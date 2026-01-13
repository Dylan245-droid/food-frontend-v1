import { useState, useMemo } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { ArrowRight, Wallet, ArrowRightLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CashSession {
  id: number;
  cashRegisterId: number;
  openingBalance: number;
  expectedBalance: number | null; // This might be null if not calculated recently, but we need current balance
  // actually currentBalance comes from the backend endpoint logic often not on the model directly unless computed
  status: 'open' | 'closed';
  openedAt: string;
  cashRegister: { 
      id: number;
      name: string; 
      type: 'sales' | 'delivery' | 'operating';
  };
  opener: { fullName: string };
  // We need current balance. The endpoint /sessions/current returns it calculated?
  // Let's check CashPage usage. It uses /admin/cash/sessions/current which returns data including currentBalance.
  // Wait, looking at CashRegistersController.index, it computes currentBalance.
  // But /admin/cash/sessions/current is CashSessionsController.current.
}

interface EnrichedSession extends CashSession {
    currentBalance?: number; // Might be added by the controller
    // If not we might need to fetch it or just rely on openingBalance for now (risky for transfers)
    // Actually CashSessionsController.current should return currentBalance.
    // Let's assume it does closer to CashRegistersController logic.
}



export default function CashTransfersPage() {
    const { data: sessionsData, loading, refetch } = useFetch<{ data: EnrichedSession[] }>('/admin/cash/sessions/current');
    const sessions = sessionsData?.data || [];

    const [sourceSessionId, setSourceSessionId] = useState<number | null>(null);
    const [targetSessionId, setTargetSessionId] = useState<number | null>(null);
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter sessions
    const sourceSessions = useMemo(() => 
        sessions.filter(s => ['sales', 'delivery'].includes(s.cashRegister.type)), 
    [sessions]);

    const targetSessions = useMemo(() => 
        sessions.filter(s => s.cashRegister.type === 'operating'), 
    [sessions]);

    // Selected Session Details


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceSessionId || !targetSessionId || amount <= 0) return;

        setSubmitting(true);
        try {
            const payload = {
                sourceSessionId,
                targetSessionId,
                amount,
                description
            };
            await api.post('/admin/cash/transfers', payload);
            toast.success('Transfert effectué avec succès');
            setAmount(0);
            setDescription('');
            setSourceSessionId(null);
            setTargetSessionId(null);
            refetch();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Erreur lors du transfert');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-stone-300" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 rounded-xl">
                    <ArrowRightLeft className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-stone-900">Transferts de Fonds</h1>
                    <p className="text-stone-500">Déplacer l'argent des caisses de vente vers le fonctionnement</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Source Selection */}
                <div className="space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">1</div>
                        Origine (Vente/Livraison)
                    </h2>
                    
                    <div className="space-y-3">
                        {sourceSessions.length === 0 ? (
                            <div className="p-4 border border-dashed rounded-xl text-center text-stone-400 text-sm">
                                Aucune session de vente active
                            </div>
                        ) : (
                            sourceSessions.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => setSourceSessionId(session.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        sourceSessionId === session.id 
                                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                                            : 'border-stone-200 bg-white hover:border-green-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-stone-900">{session.cashRegister.name}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 uppercase">
                                            {session.cashRegister.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-500 mb-2">
                                        Ouv: {session.opener.fullName}
                                    </div>
                                    {/* Ideally we show current balance here if available */}
                                    <div className="font-mono font-bold text-green-700 text-right">
                                        {/* Placeholder if we assume backend returns it, else hidden */}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Transfer Form (Center) */}
                <div className="lg:mt-12 bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative">
                     {(!sourceSessionId || !targetSessionId) && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center p-6 text-center">
                            <p className="text-stone-400 font-bold text-sm">Sélectionnez une origine et une destination</p>
                        </div>
                     )}
                     
                     <div className="flex justify-center mb-6 text-stone-300">
                        <ArrowRight className="w-8 h-8" />
                     </div>

                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Montant à transférer</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={amount || ''}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full text-center text-3xl font-black p-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">FCFA</span>
                            </div>
                        </div>

                        <Input 
                            label="Motif / Note"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Versement fin de service..."
                        />

                        <Button 
                            type="submit" 
                            className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            disabled={amount <= 0 || submitting}
                            isLoading={submitting}
                        >
                            Valider le transfert
                        </Button>
                     </form>
                </div>

                {/* Target Selection */}
                <div className="space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">2</div>
                        Destination (Fonctionnement)
                    </h2>
                    
                    <div className="space-y-3">
                        {targetSessions.length === 0 ? (
                            <div className="p-4 border border-dashed rounded-xl text-center text-stone-400 text-sm">
                                Aucune caisse de fonctionnement active
                            </div>
                        ) : (
                            targetSessions.map(session => (
                                <div 
                                    key={session.id}
                                    onClick={() => setTargetSessionId(session.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        targetSessionId === session.id 
                                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                                            : 'border-stone-200 bg-white hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-stone-900">{session.cashRegister.name}</span>
                                        <Wallet className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="text-xs text-stone-500 mb-2">
                                        Ouv: {session.opener.fullName}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>
                    Le transfert crée automatiquement un mouvement de <strong>SORTIE</strong> dans la caisse d'origine 
                    et un mouvement d'<strong>ENTRÉE</strong> dans la caisse de destination.
                </p>
            </div>
        </div>
    );
}
