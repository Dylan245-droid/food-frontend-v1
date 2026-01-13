import { useState, useEffect, useRef, useCallback } from 'react';
import { useFetch } from '../../lib/useFetch';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { Loader2, Navigation, Package, Car, Bike, MapPin, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '../../components/ui/Button';
import { DeliveryOrderCard } from '../../components/DeliveryOrderCard';
import { formatCurrency } from '../../lib/utils';
import { useDriverLocation } from '../../hooks/useDriverLocation';

// Set Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface Order {
    id: number;
    dailyNumber: number;
    deliveryAddress: string;
    deliveryLat?: number;
    deliveryLng?: number;
    geocodeConfidence?: 'high' | 'medium' | 'low' | 'failed' | null;
    clientName: string;
    clientPhone: string;
    totalAmount: number;
    deliveryFee: number;
    status: string;
    deliveryStatus: 'pending' | 'assigned' | 'picked_up' | 'delivered';
    items: any[];
    notes?: string;
    createdAt: string;
}

interface DirectionsData {
    distanceKm: number;
    durationCarMinutes: number;
    durationMotoMinutes: number;
    geometry: any;
    confidence: string;
}

export default function DeliveryDashboard() {
    const { user, logout } = useAuth();
    const { branding } = useBranding();
    const [activeTab, setActiveTab] = useState<'active' | 'available' | 'history'>('active');
    
    // Data Fetching
    const { data: myOrders, loading: loadingMy, refetch: refetchMyOrders } = useFetch<Order[]>('/delivery/my-orders');
    const { data: historyOrders, loading: loadingHistory, refetch: refetchHistory } = useFetch<Order[]>('/delivery/history');
    const { data: availableOrders, loading: loadingAvailable, refetch: refetchAvailable } = useFetch<Order[]>('/delivery/pending');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [directions, setDirections] = useState<DirectionsData | null>(null);
    const [loadingDirections, setLoadingDirections] = useState(false);
    const [isTrackingActive, setIsTrackingActive] = useState(false); // Live tracking mode
    
    // Map refs
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const routeSourceId = 'route';

    // Restaurant position from settings
    const restaurantLat = parseFloat(branding?.restaurant_lat as string || '0.4162');
    const restaurantLng = parseFloat(branding?.restaurant_lng as string || '9.4673');

    // Driver location tracking - faster interval (15s) when actively tracking
    const hasActiveOrders = (myOrders?.length || 0) > 0;
    const { location: driverLocation, loading: locationLoading, refresh: refreshLocation } = useDriverLocation({
        enabled: hasActiveOrders,
        orderId: selectedOrder?.id || null,
        intervalMs: isTrackingActive ? 15000 : 60000, // 15s when active, 60s otherwise
    });

    // Restore tracking state on page load if any order is 'picked_up' (en route)
    useEffect(() => {
        if (!myOrders) return;
        const inTransitOrder = myOrders.find(o => o.deliveryStatus === 'picked_up');
        if (inTransitOrder && !isTrackingActive && !selectedOrder) {
            setSelectedOrder(inTransitOrder);
            setIsTrackingActive(true);
        }
    }, [myOrders, isTrackingActive, selectedOrder]);

    // Initialize map
    useEffect(() => {
        // Wait for next frame to ensure container has dimensions
        const initMap = () => {
            if (!mapContainer.current || map.current) return;
            
            const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
            console.log('Mapbox token configured:', !!token, token?.substring(0, 10) + '...');
            
            if (!token) {
                console.error('VITE_MAPBOX_ACCESS_TOKEN not found in environment');
                return;
            }
            
            // Check container has dimensions
            const rect = mapContainer.current.getBoundingClientRect();
            console.log('Map container dimensions:', rect.width, rect.height);
            
            if (rect.width === 0 || rect.height === 0) {
                console.error('Map container has no dimensions, retrying...');
                setTimeout(initMap, 100);
                return;
            }
            
            mapboxgl.accessToken = token;
            
            try {
                console.log('Creating Mapbox map...');
                map.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [restaurantLng, restaurantLat],
                    zoom: 12,
                });

                map.current.on('load', () => {
                    console.log('Mapbox map loaded!');
                });

                map.current.on('error', (e) => {
                    console.error('Mapbox error:', e);
                });

                map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // Add restaurant marker with branding info
                const restaurantPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div style="padding: 8px; min-width: 150px;">
                        <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">
                            🍽️ ${branding?.name || 'Restaurant'}
                        </h3>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            ${branding?.address || 'Adresse non configurée'}
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
                            📞 ${branding?.phone || ''}
                        </p>
                    </div>
                `);
                
                new mapboxgl.Marker({ color: '#EF4444' })
                    .setLngLat([restaurantLng, restaurantLat])
                    .setPopup(restaurantPopup)
                    .addTo(map.current);

                // Add route source
                map.current.on('load', () => {
                    if (!map.current) return;
                    map.current.addSource(routeSourceId, {
                        type: 'geojson',
                        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
                    });
                    map.current.addLayer({
                        id: 'route-line',
                        type: 'line',
                        source: routeSourceId,
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.8 }
                    });
                });

            } catch (error) {
                console.error('Failed to initialize Mapbox map:', error);
            }
        };

        // Use requestAnimationFrame to wait for DOM to be ready
        requestAnimationFrame(initMap);

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [restaurantLat, restaurantLng]);

    // Update markers when orders or selection changes
    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const ordersToShow = myOrders || [];
        ordersToShow.forEach(order => {
            if (order.deliveryLat && order.deliveryLng) {
                const isSelected = selectedOrder?.id === order.id;
                
                // Different color for selected order
                const marker = new mapboxgl.Marker({ 
                    color: isSelected ? '#F59E0B' : '#22C55E',  // Orange if selected, green otherwise
                    scale: isSelected ? 1.2 : 1
                })
                    .setLngLat([order.deliveryLng, order.deliveryLat])
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                        <div style="padding: 8px;">
                            <strong style="font-size: 14px;">#${order.dailyNumber}</strong><br/>
                            <span style="font-weight: 500;">${order.clientName}</span><br/>
                            <small style="color: #666;">${order.deliveryAddress}</small>
                        </div>
                    `))
                    .addTo(map.current!);
                
                // Auto-open popup for selected order
                if (isSelected) {
                    marker.togglePopup();
                }
                
                markersRef.current.push(marker);
            }
        });
    }, [myOrders, selectedOrder]);

    // Update driver marker
    useEffect(() => {
        if (!map.current || !driverLocation) return;

        // Remove previous driver marker if exists
        const driverMarkerId = 'driver-marker';
        const existingMarker = document.getElementById(driverMarkerId);
        if (existingMarker) existingMarker.remove();

        // Create driver marker element
        const el = document.createElement('div');
        el.id = driverMarkerId;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3B82F6';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

        new mapboxgl.Marker(el)
            .setLngLat([driverLocation.lng, driverLocation.lat])
            .addTo(map.current);
    }, [driverLocation]);

    // Fetch directions when order is selected
    const fetchDirections = useCallback(async (order: Order) => {
        if (!order.deliveryLat || !order.deliveryLng) return;
        
        setLoadingDirections(true);
        try {
            const res = await api.get('/directions', {
                params: {
                    originLat: driverLocation?.lat || restaurantLat,
                    originLng: driverLocation?.lng || restaurantLng,
                    destLat: order.deliveryLat,
                    destLng: order.deliveryLng,
                }
            });
            setDirections(res.data);

            // Draw route on map
            if (map.current && res.data.geometry) {
                const source = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
                if (source) {
                    source.setData({
                        type: 'Feature',
                        properties: {},
                        geometry: res.data.geometry
                    });
                }

                // Fit bounds to show route
                const bounds = new mapboxgl.LngLatBounds();
                res.data.geometry.coordinates.forEach((coord: [number, number]) => {
                    bounds.extend(coord);
                });
                map.current.fitBounds(bounds, { padding: 60 });
            }
        } catch (err) {
            console.error('Failed to fetch directions:', err);
        } finally {
            setLoadingDirections(false);
        }
    }, [driverLocation, restaurantLat, restaurantLng]);

    // Auto-refresh directions when driver location changes (only when tracking active)
    useEffect(() => {
        if (isTrackingActive && selectedOrder && driverLocation) {
            fetchDirections(selectedOrder);
        }
    }, [driverLocation, isTrackingActive, selectedOrder, fetchDirections]);

    // Handle order selection
    const handleOrderSelect = useCallback((order: Order) => {
        setSelectedOrder(order);
        fetchDirections(order);
        
        if (map.current && order.deliveryLat && order.deliveryLng) {
            map.current.flyTo({
                center: [order.deliveryLng, order.deliveryLat],
                zoom: 14,
            });
        }
    }, [fetchDirections]);

    // Toggle tracking mode - persist to backend
    const toggleTracking = useCallback(async (order?: Order) => {
        const targetOrder = order || selectedOrder;
        if (!targetOrder) return;
        
        // If not selected, select it first
        if (!selectedOrder || selectedOrder.id !== targetOrder.id) {
            handleOrderSelect(targetOrder);
        }
        
        const isCurrentlyTracking = isTrackingActive && selectedOrder?.id === targetOrder.id;
        
        if (!isCurrentlyTracking) {
            // Starting tracking - update backend to 'picked_up' status
            try {
                await api.patch(`/delivery/orders/${targetOrder.id}/status`, { status: 'picked_up' });
                toast.success('Livraison démarrée !');
                refreshLocation();
                setIsTrackingActive(true);
                refetchMyOrders();
            } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Erreur');
            }
        } else {
            // Just stop tracking locally (no backend change - driver is still en route)
            setIsTrackingActive(false);
        }
    }, [selectedOrder, isTrackingActive, handleOrderSelect, refreshLocation, refetchMyOrders]);

    const refetchAll = () => {
        refetchMyOrders();
        refetchAvailable();
        refetchHistory();
    };

    const handleAssign = async (orderId: number) => {
        try {
            await api.post('/delivery/assign', { orderId });
            toast.success('Commande assignée !');
            refetchAll();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erreur');
        }
    };

    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        try {
            await api.patch(`/delivery/orders/${orderId}/status`, { status: newStatus });
            toast(newStatus === 'delivered' ? '✅ Livraison terminée !' : 'Statut mis à jour');
            refetchAll();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erreur');
        }
    };

    const openNavigation = (lat?: number, lng?: number, address?: string) => {
        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        }
    };

    // Determine current orders to display
    const currentOrders = activeTab === 'active' ? myOrders : activeTab === 'available' ? availableOrders : historyOrders;
    const isLoading = activeTab === 'active' ? loadingMy : activeTab === 'available' ? loadingAvailable : loadingHistory;

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
            {/* Left Panel - Orders List */}
            <div className="w-full md:w-[420px] flex flex-col bg-white border-r border-stone-200 shadow-lg order-2 md:order-1 max-h-[60vh] md:max-h-screen overflow-hidden">
                {/* Header */}
                <div className="bg-stone-900 text-white p-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Bike className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="font-bold">Espace Livreur</h1>
                                <p className="text-xs text-white/70">Bonjour, {user?.email?.split('@')[0] || 'Livreur'}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="text-xs text-white/70 hover:text-white">Déconnexion</button>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex p-2 bg-white border-b border-stone-200 gap-2 shrink-0">
                    {[
                        { id: 'active', label: `En cours (${myOrders?.length || 0})` },
                        { id: 'available', label: `Disponibles (${availableOrders?.length || 0})` },
                        { id: 'history', label: 'Historique' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setSelectedOrder(null); setDirections(null); }}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === tab.id 
                                ? 'bg-stone-900 text-white shadow-md' 
                                : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24 md:pb-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-stone-400" /></div>
                    ) : currentOrders?.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <Package className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                            <p className="text-sm font-medium">Aucune commande</p>
                        </div>
                    ) : (
                        currentOrders?.map(order => (
                            <div key={order.id}>
                                <DeliveryOrderCard 
                                    order={order}
                                    onClick={() => handleOrderSelect(order)}
                                    isSelected={selectedOrder?.id === order.id}
                                    restaurantLat={restaurantLat}
                                    restaurantLng={restaurantLng}
                                    actions={
                                        activeTab === 'available' ? (
                                            <Button 
                                                className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-bold"
                                                onClick={(e) => { e.stopPropagation(); handleAssign(order.id); }}
                                            >
                                                Prendre en charge 🚀
                                            </Button>
                                        ) : activeTab === 'active' ? (
                                            <>
                                                {selectedOrder?.id === order.id && isTrackingActive ? (
                                                    <Button 
                                                        variant="outline"
                                                        className="flex-1 text-xs border-red-500 text-red-600 hover:bg-red-50"
                                                        onClick={(e) => { e.stopPropagation(); toggleTracking(); }}
                                                    >
                                                        🛑 Arrêter
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="outline"
                                                        className={`flex-1 text-xs ${selectedOrder?.id === order.id ? 'border-blue-500 text-blue-600 hover:bg-blue-50' : ''}`}
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            if (selectedOrder?.id !== order.id) {
                                                                handleOrderSelect(order);
                                                            }
                                                            toggleTracking(); 
                                                        }}
                                                    >
                                                        🚀 Débuter
                                                    </Button>
                                                )}
                                                <Button 
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, 'delivered'); }}
                                                >
                                                    Livré & Encaissé ✅
                                                </Button>
                                            </>
                                        ) : null
                                    }
                                />
                                
                                {/* Directions info for selected order */}
                                {selectedOrder?.id === order.id && directions && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4 text-blue-500" />
                                                    <span className="font-bold text-blue-900">{directions.distanceKm.toFixed(1)} km</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Car className="w-4 h-4 text-stone-500" />
                                                    <span className="text-stone-600">{directions.durationCarMinutes} min</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Bike className="w-4 h-4 text-orange-500" />
                                                    <span className="font-medium text-orange-600">{directions.durationMotoMinutes} min</span>
                                                </div>
                                            </div>
                                            {loadingDirections && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 order-1 md:order-2 h-[40vh] md:h-screen relative bg-stone-200">
                <div ref={mapContainer} className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }} />
                
                {/* Refresh button */}
                <button 
                    onClick={refetchAll}
                    className="absolute top-4 left-4 z-10 bg-white p-2.5 rounded-full shadow-lg hover:bg-stone-50 transition-colors"
                    title="Actualiser"
                >
                    <RefreshCw className="w-5 h-5 text-stone-600" />
                </button>
                
                {/* Driver location status */}
                {hasActiveOrders && (
                    <div className={`absolute bottom-4 left-4 z-10 px-3 py-2 rounded-lg shadow-lg text-xs ${
                        isTrackingActive ? 'bg-blue-600 text-white' : 'bg-white'
                    }`}>
                        {locationLoading ? (
                            <span className="text-stone-500">📍 Localisation...</span>
                        ) : isTrackingActive ? (
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                🛵 En route...
                            </span>
                        ) : driverLocation ? (
                            <span className="text-green-600">📍 Position active</span>
                        ) : (
                            <span className="text-orange-500">📍 GPS désactivé</span>
                        )}
                    </div>
                )}
                
                {/* No token warning */}
                {!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN && (
                    <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
                        <div className="text-center p-4">
                            <MapPin className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                            <p className="text-stone-500 font-medium">Clé Mapbox non configurée</p>
                            <p className="text-xs text-stone-400 mt-1">Ajoutez VITE_MAPBOX_ACCESS_TOKEN dans .env</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
