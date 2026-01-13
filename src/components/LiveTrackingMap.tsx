import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface DriverPosition {
    lat: number;
    lng: number;
    timestamp?: string;
}

interface LiveTrackingMapProps {
    restaurantLat: number;
    restaurantLng: number;
    destinationLat: number;
    destinationLng: number;
    driverPosition?: DriverPosition | null;
    orderId: number;
    onDistanceUpdate?: (distanceKm: number, etaMinutes: number) => void;
}

/**
 * Live tracking map component for client-side order tracking
 * Shows restaurant, destination, and live driver position
 */
export function LiveTrackingMap({
    restaurantLat,
    restaurantLng,
    destinationLat,
    destinationLng,
    driverPosition,
    onDistanceUpdate,
}: LiveTrackingMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;
        if (!mapboxgl.accessToken) {
            console.error('Mapbox token not configured');
            return;
        }

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [destinationLng, destinationLat],
            zoom: 13,
        });

        map.current.on('load', () => {
            setIsLoading(false);
            if (!map.current) return;
            
            // Force resize to ensure proper dimensions
            setTimeout(() => {
                map.current?.resize();
            }, 100);

            // Add restaurant marker (red)
            new mapboxgl.Marker({ color: '#EF4444' })
                .setLngLat([restaurantLng, restaurantLat])
                .setPopup(new mapboxgl.Popup().setText('🍽️ Restaurant'))
                .addTo(map.current);

            // Add destination marker (green)
            new mapboxgl.Marker({ color: '#22C55E' })
                .setLngLat([destinationLng, destinationLat])
                .setPopup(new mapboxgl.Popup().setText('📍 Votre adresse'))
                .addTo(map.current);

            // Add route source
            map.current.addSource('route', {
                type: 'geojson',
                data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
            });
            map.current.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.8 }
            });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [restaurantLat, restaurantLng, destinationLat, destinationLng]);

    // Update driver marker and route when position changes
    useEffect(() => {
        if (!map.current || !driverPosition) return;

        // Remove old marker
        if (driverMarkerRef.current) {
            driverMarkerRef.current.remove();
        }

        // Create pulsing driver marker
        const el = document.createElement('div');
        el.className = 'driver-marker';
        el.innerHTML = `
            <div style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #3B82F6;
                border: 3px solid white;
                box-shadow: 0 2px 10px rgba(59, 130, 246, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            ">🛵</div>
            <div style="
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.3);
                top: -5px;
                left: -5px;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
        `;
        el.style.position = 'relative';

        driverMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([driverPosition.lng, driverPosition.lat])
            .addTo(map.current);

        // Center map on driver with some offset to show destination
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([driverPosition.lng, driverPosition.lat]);
        bounds.extend([destinationLng, destinationLat]);
        map.current.fitBounds(bounds, { padding: 80 });

        // Fetch route from driver to destination and draw it
        const fetchAndDrawRoute = async () => {
            try {
                const res = await api.get('/directions', {
                    params: {
                        originLat: driverPosition.lat,
                        originLng: driverPosition.lng,
                        destLat: destinationLat,
                        destLng: destinationLng,
                    }
                });
                
                if (res.data.geometry && map.current) {
                    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
                    if (source) {
                        source.setData({
                            type: 'Feature',
                            properties: {},
                            geometry: res.data.geometry
                        });
                    }
                    
                    // Use Mapbox directions distance/duration if available
                    if (res.data.distance && res.data.duration) {
                        const distanceKm = res.data.distance / 1000;
                        const etaMinutes = Math.round(res.data.duration / 60);
                        onDistanceUpdate?.(distanceKm, etaMinutes);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch route:', err);
                // Fallback to Haversine distance
                const distanceKm = calculateHaversineDistance(
                    driverPosition.lat, driverPosition.lng,
                    destinationLat, destinationLng
                );
                const etaMinutes = Math.round((distanceKm / 25) * 60);
                onDistanceUpdate?.(distanceKm, etaMinutes);
            }
        };
        
        fetchAndDrawRoute();

    }, [driverPosition, destinationLat, destinationLng, onDistanceUpdate]);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-stone-200" style={{ height: '300px' }}>
            <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
            
            {isLoading && (
                <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
            )}

            {!mapboxgl.accessToken && (
                <div className="absolute inset-0 bg-stone-100 flex items-center justify-center text-center p-4">
                    <p className="text-stone-500 text-sm">Carte non disponible</p>
                </div>
            )}

            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

// Haversine distance calculation
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
