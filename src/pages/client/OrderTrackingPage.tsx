import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Clock, CheckCircle2, ChefHat, XCircle, Search, PartyPopper } from 'lucide-react';

interface OrderDetail {
    id: number;
    pickupCode: string;
    status: string;
    clientName: string;
    totalFormatted: string;
    createdAt: string;
    items: { name: string; quantity: number }[];
}

export default function OrderTrackingPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [searchCode, setSearchCode] = useState(code || '');
    
    // Si code présent dans URL, on fetch, sinon on attend
    const { data: order, loading, error, refetch } = useFetch<OrderDetail>(code ? `/orders/track/${code}` : '');
    
    // Auto-refresh si commande en cours
    useEffect(() => {
        if (!code || order?.status === 'delivered' || order?.status === 'cancelled') return;
        const interval = setInterval(refetch, 10000);
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
        } catch (e) { alert('Impossible d\'annuler maintenant'); }
    };

    if (!code) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="bg-blue-50 p-4 rounded-full">
                    <Search className="w-12 h-12 text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Suivre une commande</h1>
                <p className="text-gray-500 max-w-xs">Entrez votre code de retrait reçu lors de la commande.</p>
                <form onSubmit={handleSearch} className="w-full max-w-xs space-y-4">
                    <Input 
                        placeholder="Ex: A7X9M" 
                        value={searchCode} 
                        onChange={e => setSearchCode(e.target.value)} 
                        className="text-center uppercase font-mono tracking-widest text-lg"
                        maxLength={6}
                    />
                    <Button type="submit" className="w-full">Rechercher</Button>
                </form>
            </div>
        )
    }

    if (loading) return <div>Chargement...</div>;

    if (error || !order) {
        return (
            <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Commande introuvable</h2>
                <p className="text-gray-500 mt-2">Vérifiez le code : <span className="font-mono font-bold">{code}</span></p>
                <Button variant="ghost" className="mt-4" onClick={() => navigate('/track')}>Réessayer</Button>
            </div>
        )
    }

    const steps = [
        { status: 'pending', label: 'Reçue', icon: Clock, color: 'text-yellow-500' },
        { status: 'in_progress', label: 'Préparation', icon: ChefHat, color: 'text-blue-500' },
        { status: 'delivered', label: 'Prête / Servie', icon: CheckCircle2, color: 'text-green-500' },
        { status: 'paid', label: 'Terminée', icon: PartyPopper, color: 'text-purple-500' },
    ];

    const currentStepIndex = steps.findIndex(s => s.status === order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Code de retrait</p>
                <div className="text-4xl font-black text-gray-900 font-mono tracking-widest bg-gray-50 inline-block px-6 py-3 rounded-xl border border-gray-200">
                    {order.pickupCode}
                </div>
                {isCancelled && <div className="mt-4 text-red-600 font-bold bg-red-50 py-2 rounded-lg">COMMANDE ANNULÉE</div>}
            </div>

            {!isCancelled && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between relative mb-8">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 rounded-full" />
                         <div 
                            className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-0 rounded-full transition-all duration-500" 
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        />
                        {steps.map((step, index) => {
                            const isActive = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors ${isActive ? 'bg-white border-blue-500' : 'bg-gray-100 border-white'}`}>
                                        <step.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    </div>
                                    <span className={`text-xs font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</span>
                                </div>
                            )
                        })}
                    </div>
                    
                    {order.status === 'pending' && (
                        <p className="text-center text-gray-600 text-sm bg-blue-50 p-3 rounded-lg animate-pulse">
                            Votre commande est en attente de validation par la cuisine.
                        </p>
                    )}
                    {order.status === 'in_progress' && (
                        <p className="text-center text-gray-600 text-sm bg-yellow-50 p-3 rounded-lg">
                            Ça chauffe ! Nos chefs sont en train de préparer vos plats.
                        </p>
                    )}
                     {order.status === 'delivered' && (
                        <p className="text-center text-green-700 text-sm bg-green-50 p-3 rounded-lg font-bold">
                            C'est prêt ! Présentez votre code au comptoir pour récupérer votre commande. Bon appétit ! 🍔
                        </p>
                    )}
                    {order.status === 'paid' && (
                        <div className="text-center text-purple-700 text-sm bg-purple-50 p-4 rounded-lg font-bold">
                            <PartyPopper className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                            <p>Commande terminée et récupérée.</p>
                            <p className="text-xs font-normal mt-1 opacity-80">Merci de votre visite et à bientôt ! 👋</p>
                        </div>
                    )}

                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Détails de la commande</h3>
                <div className="space-y-3">
                    {order.items.map((item: any, i) => (
                        <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-800">
                                <span className="font-bold text-gray-900 mr-2">{item.quantity}x</span> 
                                {item.name}
                            </span>
                            <span className="text-gray-500 font-medium">
                                {item.formattedSubtotal || (item.unitPrice ? item.unitPrice * item.quantity + ' FCFA' : '')}
                            </span>
                        </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100 font-bold text-lg">
                        <span>Total</span>
                        <span>{order.totalFormatted}</span>
                    </div>
                </div>
            </div>

            {order.status === 'pending' && !isCancelled && (
                 <Button variant="danger" className="w-full bg-red-100 text-red-600 hover:bg-red-200" onClick={handleCancel}>
                    Annuler ma commande
                </Button>
            )}
            
            <div className="text-center">
                 <Button variant="ghost" onClick={() => navigate('/')}>Retour à l'accueil</Button>
            </div>
        </div>
    );
}
