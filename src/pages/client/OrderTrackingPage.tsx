import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Clock, CheckCircle2, ChefHat, XCircle, Search, PartyPopper, Utensils, ArrowLeft } from 'lucide-react';

interface OrderDetail {
    id: number;
    pickupCode: string;
    status: string;
    clientName: string;
    totalFormatted: string;
    createdAt: string;
    items: { name: string; quantity: number, formattedSubtotal?: string, unitPrice?: number }[];
}

export default function OrderTrackingPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [searchCode, setSearchCode] = useState(code || '');
    
    // Si code présent dans URL, on fetch, sinon on attend
    const { data: order, loading, error, refetch } = useFetch<OrderDetail>(code ? `/orders/track/${code}` : '');
    
    // Auto-refresh si commande en cours
    useEffect(() => {
        if (!code || order?.status === 'paid' || order?.status === 'cancelled') return;
        const interval = setInterval(refetch, 5000); // 5s pour plus de réactivité
        return () => clearInterval(interval);
    }, [code, order?.status, refetch]);

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
                <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-yellow-100/40 rounded-full blur-[80px] mix-blend-multiply pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-orange-100/40 rounded-full blur-[80px] mix-blend-multiply pointer-events-none"></div>

                <div className="relative z-10 bg-white p-8 rounded-3xl shadow-xl border border-stone-100 max-w-sm w-full mx-auto transform rotate-1">
                    <div className="bg-orange-50 p-6 rounded-full inline-block mb-6 shadow-inner">
                        <Search className="w-10 h-10 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-black text-stone-900 mb-2">Suivi Commande</h1>
                    <p className="text-stone-500 mb-8 font-medium">Où est votre festin ?</p>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <Input 
                            placeholder="CODE RETRAIT" 
                            value={searchCode} 
                            onChange={e => setSearchCode(e.target.value)} 
                            className="text-center uppercase font-mono tracking-[0.2em] text-xl h-14 bg-stone-50 border-stone-200 focus:ring-orange-200 focus:border-orange-400"
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

    const steps = [
        { status: 'pending', label: 'Reçue', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
        { status: 'in_progress', label: 'Au Fourneau', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { status: 'delivered', label: 'Prête !', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { status: 'paid', label: 'Payée', icon: PartyPopper, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);
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
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
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
                                className="absolute top-1/2 left-6 h-1 bg-gradient-to-r from-yellow-400 to-purple-500 -z-10 rounded-full transition-all duration-1000"
                                style={{ width: `calc(${(Math.min(currentStepIndex, 3) / 3) * 100}% - 3rem)` }}
                            ></div>

                            {steps.map((step, index) => {
                                const isActive = index <= currentStepIndex;

                                
                                return (
                                    <div key={step.status} className="flex flex-col items-center gap-3">
                                        <div className={`
                                            w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10
                                            ${isActive 
                                                ? 'bg-white border-orange-500 shadow-lg shadow-orange-200 scale-110' 
                                                : 'bg-stone-50 border-stone-100 text-stone-300'
                                            }
                                        `}>
                                            <step.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-orange-600' : 'text-stone-300'}`} />
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
                                <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center relative overflow-hidden">
                                    <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-orange-100 rounded-full blur-xl animate-pulse"></div>
                                    <ChefHat className="w-8 h-8 text-orange-600 mx-auto mb-3 animate-bounce" />
                                    <h3 className="text-lg font-bold text-orange-800 mb-1">Ça chauffe en cuisine !</h3>
                                    <p className="text-orange-700/80 text-sm">Vos plats sont en cours de préparation avec amour.</p>
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

                {/* Receipt Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative">
                    {/* Ragged Top Edge (CSS Trick or SVG could work, simpler here) */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-dashed border-stone-200">
                        <h3 className="font-bold text-stone-900 flex items-center gap-2">
                            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
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

                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                        <span className="text-stone-500 font-bold">Total</span>
                        <span className="font-black text-xl text-stone-900">{order.totalFormatted}</span>
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
