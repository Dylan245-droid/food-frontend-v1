import { useState, useEffect, useCallback } from 'react';
import { useFetch } from '../../lib/useFetch';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Clock, CheckCircle2, ChefHat, XCircle, Search, PartyPopper, Utensils, ArrowLeft, Bike, MapPin } from 'lucide-react';
import { LiveTrackingMap } from '../../components/LiveTrackingMap';
import { useDriverPositionUpdates } from '../../hooks/useDriverPositionUpdates';
import { useBranding } from '../../context/BrandingContext';

interface OrderDetail {
    id: number;
    pickupCode: string;
    status: string;
    clientName: string;
    totalFormatted: string;
    totalAmount: number;
    deliveryFee: number;
    createdAt: string;
    items: { name: string; quantity: number, formattedSubtotal?: string, unitPrice?: number }[];
    type: 'dine_in' | 'takeout' | 'delivery';
    deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
    deliveryLat?: number;
    deliveryLng?: number;
    deliveryAddress?: string;
}

export default function OrderTrackingPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [searchCode, setSearchCode] = useState(code || '');
    const { branding } = useBranding();
    
    // Si code présent dans URL, on fetch, sinon on attend
    const { data: order, loading, error, refetch } = useFetch<OrderDetail>(code ? `/orders/track/${code}` : '');
    
    // Live driver tracking for delivery orders
    const { driverPosition } = useDriverPositionUpdates(order?.id);
    const [deliveryEta, setDeliveryEta] = useState<{ distanceKm: number; etaMinutes: number } | null>(null);
    
    // Restaurant position from settings
    const restaurantLat = parseFloat(branding?.restaurant_lat as string || '0.4162');
    const restaurantLng = parseFloat(branding?.restaurant_lng as string || '9.4673');
    
    // Handle distance/ETA updates from map
    const handleDistanceUpdate = useCallback((distanceKm: number, etaMinutes: number) => {
        setDeliveryEta({ distanceKm, etaMinutes });
    }, []);
    
    // Auto-refresh si commande en cours
    // Stop polling when: paid, cancelled, or for delivery orders when ready (status: delivered)
    useEffect(() => {
        // Don't poll if order is finished
        if (!code || order?.status === 'paid' || order?.status === 'cancelled') return;
        
        // For delivery orders: completely stop polling once status is 'delivered' (ready)
        // SSE will handle real-time driver position updates - no need for polling
        if (order?.type === 'delivery' && order?.status === 'delivered') {
            return; // No polling - SSE handles updates
        }
        
        const interval = setInterval(refetch, 5000); // 5s for active orders
        return () => clearInterval(interval);
    }, [code, order?.status, order?.type, refetch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchCode.trim()) {
            navigate(`/track/${searchCode.trim().toUpperCase()}`);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Voulez-vous vraiment annuler votre commande ?')) return;
        try {
            await api.post(`/orders/cancel/${code}`);
            refetch();
        } catch { alert('Impossible d\'annuler maintenant'); }
    };

    if (!code) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 bg-[#FFF8F3] p-6 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full blur-[80px] mix-blend-multiply pointer-events-none opacity-40" style={{ background: 'var(--primary-100)' }}></div>
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full blur-[80px] mix-blend-multiply pointer-events-none opacity-40" style={{ background: 'var(--secondary-100)' }}></div>

                <div className="relative z-10 bg-white p-8 rounded-3xl shadow-xl border border-stone-100 max-w-sm w-full mx-auto transform rotate-1">
                    <div className="p-6 rounded-full inline-block mb-6 shadow-inner" style={{ background: 'var(--primary-50)' }}>
                        <Search className="w-10 h-10" style={{ color: 'var(--primary-500)' }} />
                    </div>
                    <h1 className="text-3xl font-black text-stone-900 mb-2">Suivi Commande</h1>
                    <p className="text-stone-500 mb-8 font-medium">Où est votre festin ?</p>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <Input 
                            placeholder="CODE RETRAIT" 
                            value={searchCode} 
                            onChange={e => setSearchCode(e.target.value)} 
                            className="text-center uppercase font-mono tracking-[0.2em] text-xl h-14 bg-stone-50 border-stone-200 focus:ring-[var(--primary-200)] focus:border-[var(--primary-400)] transition-all"
                            style={{ '--tw-ring-color': 'var(--primary-200)', borderColor: 'var(--primary-400)' } as React.CSSProperties}
                            maxLength={6}
                        />
                        <Button type="submit" className="w-full h-14 text-lg font-bold bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800">
                             Lancer la recherche 🚀
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    if (loading) return (
         <div className="min-h-screen flex items-center justify-center bg-[#FFF8F3]">
            <div className="animate-bounce flex flex-col items-center">
                 <ChefHat className="w-12 h-12 text-orange-400 mb-2 opacity-60" />
                 <span className="text-stone-400 font-bold">Recherche de la commande...</span>
            </div>
         </div>
    );

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center p-6">
                 <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-red-50 max-w-sm w-full">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-stone-900 mb-2">Oups !</h2>
                    <p className="text-stone-500 mb-6">Nous ne trouvons pas la commande <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 rounded mx-1">{code}</span></p>
                    <Button onClick={() => navigate('/track')} className="w-full bg-stone-900 text-white h-12 rounded-xl">Réessayer</Button>
                </div>
            </div>
        )
    }

    // Determine if delivery is in transit
    const isDeliveryInTransit = order.type === 'delivery' && order.deliveryStatus === 'picked_up';
    const isDeliveryComplete = order.type === 'delivery' && order.deliveryStatus === 'delivered';

    const steps = [
        { status: 'pending', label: 'Reçue', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
        { status: 'in_progress', label: 'Au Fourneau', icon: ChefHat, color: 'text-[var(--primary-600)]', bg: 'bg-[var(--primary-50)]', border: 'border-[var(--primary-100)]' },
        { 
            status: 'delivered', 
            label: order.type === 'delivery' ? 'Prête' : 'Prête !', 
            icon: CheckCircle2, 
            color: 'text-green-600', 
            bg: 'bg-green-50', 
            border: 'border-green-100' 
        },
        { 
            status: 'paid', 
            label: order.type === 'delivery' 
                ? (isDeliveryComplete ? 'Livrée !' : 'En route 🛵') 
                : 'Payée', 
            icon: order.type === 'delivery' && !isDeliveryComplete ? Bike : PartyPopper, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50', 
            border: 'border-purple-100' 
        },
    ];

    // Calculate current step index - for delivery orders, 'picked_up' means we're on the last step
    let currentStepIndex = steps.findIndex(s => s.status === order.status);
    if (order.type === 'delivery' && isDeliveryInTransit && order.status === 'delivered') {
        // deliveryStatus = 'picked_up' means driver is en route, show the last step as active
        currentStepIndex = 3; // Index of the 'paid'/'En route' step
    }
    const isCancelled = order.status === 'cancelled';
    const isPaid = order.status === 'paid';

    return (
        <div className="min-h-screen bg-[#FFF8F3] text-stone-800 pb-12 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[80vw] h-[80vw] bg-yellow-100/30 rounded-full blur-[100px] mix-blend-multiply"></div>
                <div className="absolute bottom-0 right-0 w-[60vw] h-[60vw] bg-red-100/20 rounded-full blur-[100px] mix-blend-multiply"></div>
             </div>

             <div className="relative z-10 max-w-md mx-auto p-6">
                <button onClick={() => navigate('/')} className="mb-6 flex items-center text-stone-400 hover:text-stone-800 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour accueil
                </button>

                {/* Pickup Code Card */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-stone-100 text-center mb-8 relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ background: 'var(--gradient-brand)' }}></div>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Code de retrait</p>
                    <div className="text-5xl font-black text-stone-900 font-mono tracking-widest bg-stone-50 inline-block px-8 py-4 rounded-2xl border-2 border-stone-100 border-dashed">
                        {order.pickupCode}
                    </div>
                    {isCancelled && (
                        <div className="mt-4 inline-flex items-center gap-2 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                            <XCircle className="w-4 h-4" /> ANNULÉE
                        </div>
                    )}
                </div>

                {!isCancelled && (
                    <div className="space-y-6 mb-8">
                        {/* Progress Stepper */}
                         <div className="flex justify-between relative px-4">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-6 right-6 h-1 bg-stone-100 -z-10 rounded-full"></div>
                            <div 
                                className="absolute top-1/2 left-6 h-1 -z-10 rounded-full"
                                style={{ 
                                    width: `calc(${(Math.min(currentStepIndex, 3) / 3) * 100}% - 3rem)`,
                                    background: 'var(--gradient-brand)'
                                }}
                            ></div>

                            {steps.map((step, index) => {
                                const isActive = index <= currentStepIndex;

                                
                                return (
                                    <div key={step.status} className="flex flex-col items-center gap-3">
                                        <div className={`
                                            w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10
                                            ${isActive 
                                                ? 'bg-white shadow-lg scale-110' 
                                                : 'bg-stone-50 border-stone-100 text-stone-300'
                                            }
                                        `}
                                        style={isActive ? { borderColor: 'var(--primary-500)', boxShadow: '0 4px 6px -1px var(--primary-200)' } : {}}
                                        >
                                            <step.icon 
                                                className={`w-4 h-4 md:w-5 md:h-5 ${!isActive && 'text-stone-300'}`} 
                                                style={isActive ? { color: step.status === 'in_progress' ? 'var(--primary-600)' : undefined } : undefined}
                                                // Note: step.color contains class names, but for in_progress we want dynamic style if possible, 
                                                // but since we replaced the class in steps array, it should be fine.
                                                // However step.color is passed as classname? No, let's see where it's used.
                                                // Ah, below: `isActive ? 'text-orange-600' : ...` was hardcoded!
                                            />
                                        </div>
                                        <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-stone-800' : 'text-stone-300'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {/* Status Message Cards */}
                        <div className="animate-in slide-in-from-bottom-4 duration-700">
                            {order.status === 'pending' && (
                                <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl text-center relative overflow-hidden">
                                     <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-100 rounded-full blur-xl"></div>
                                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-3 animate-spin-slow opacity-80" />
                                    <h3 className="text-lg font-bold text-yellow-800 mb-1">Commande reçue !</h3>
                                    <p className="text-yellow-700/80 text-sm">Le chef va bientôt valider votre commande.</p>
                                </div>
                            )}
                            {order.status === 'in_progress' && (
                                <div className="p-6 rounded-2xl text-center relative overflow-hidden border" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                                    <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full blur-xl animate-pulse" style={{ background: 'var(--primary-100)' }}></div>
                                    <ChefHat className="w-8 h-8 mx-auto mb-3 animate-bounce" style={{ color: 'var(--primary-600)' }} />
                                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--primary-900)' }}>Ça chauffe en cuisine !</h3>
                                    <p className="text-sm" style={{ color: 'var(--primary-700)' }}>Vos plats sont en cours de préparation avec amour.</p>
                                </div>
                            )}
                            {order.status === 'delivered' && (
                                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-green-100/20 animate-pulse"></div>
                                    <Utensils className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h3 className="text-xl font-black text-green-800 mb-1">C'est prêt ! 🍔</h3>
                                    <p className="text-green-700 text-sm font-medium">Présentez votre code <span className="font-bold">{order.pickupCode}</span> au comptoir.</p>
                                </div>
                            )}
                            {isPaid && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-8 rounded-2xl text-center relative overflow-hidden">
                                    <PartyPopper className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-xl font-black text-purple-900 mb-2">Bon Appétit !</h3>
                                    <p className="text-purple-700/80 text-sm max-w-[200px] mx-auto">Merci de votre visite. On espère vous revoir très vite ! 👋</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Live Tracking Map for Delivery Orders */}
                {order.type === 'delivery' && order.deliveryLat && order.deliveryLng && 
                 order.deliveryStatus && ['assigned', 'picked_up'].includes(order.deliveryStatus) && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                            <h3 className="font-bold text-stone-900">Suivi en direct</h3>
                        </div>
                        
                        <LiveTrackingMap
                            restaurantLat={restaurantLat}
                            restaurantLng={restaurantLng}
                            destinationLat={order.deliveryLat}
                            destinationLng={order.deliveryLng}
                            driverPosition={driverPosition}
                            orderId={order.id}
                            onDistanceUpdate={handleDistanceUpdate}
                        />
                        
                        {/* ETA Display */}
                        {driverPosition && deliveryEta && (
                            <div className="mt-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600 font-bold">🛵 Votre livreur arrive...</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-blue-700">~{deliveryEta.etaMinutes} min</span>
                                        <p className="text-xs text-blue-500 font-medium">{deliveryEta.distanceKm.toFixed(1)} km</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!driverPosition && (
                            <div className="mt-3 text-center text-sm text-stone-500">
                                <p>🔄 En attente de la position du livreur...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Receipt Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative">
                    {/* Ragged Top Edge (CSS Trick or SVG could work, simpler here) */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-dashed border-stone-200">
                        <h3 className="font-bold text-stone-900 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full" style={{ background: 'var(--primary-500)' }}></span>
                            Votre commande
                        </h3>
                        <span className="text-xs text-stone-400 font-mono">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                        {order.items.map((item: any, i) => (
                            <div key={i} className="flex justify-between items-start text-sm">
                                <div className="text-stone-800">
                                    <span className="font-bold mr-3 bg-stone-100 text-stone-600 px-1.5 rounded text-xs">{item.quantity}x</span> 
                                    {item.name}
                                </div>
                                <div className="font-mono text-stone-500 text-xs mt-0.5">
                                    {item.quantity * (item.unitPrice || 0)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-stone-100 space-y-2">
                         <div className="flex justify-between items-center text-stone-500 text-sm">
                            <span>Sous-total</span>
                            <span>{new Intl.NumberFormat('fr-FR').format((order.totalAmount || 0) - (order.deliveryFee || 0))}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-blue-600 text-sm font-bold bg-blue-50 px-2 py-1 rounded">
                                <span>Frais de livraison 🛵</span>
                                <span>+ {new Intl.NumberFormat('fr-FR').format(order.deliveryFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-stone-900 font-bold">Total</span>
                            <span className="font-black text-2xl text-stone-900">{order.totalFormatted}</span>
                        </div>
                    </div>
                </div>

                {order.status === 'pending' && !isCancelled && (
                     <Button 
                        variant="ghost" 
                        className="w-full mt-6 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl" 
                        onClick={handleCancel}
                    >
                        Annuler ma commande
                    </Button>
                )}
            </div>
        </div>
    );
}
