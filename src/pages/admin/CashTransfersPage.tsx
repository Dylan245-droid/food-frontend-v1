// @ts-nocheck
import { useState, useMemo } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { ArrowRight, Wallet, ArrowRightLeft, AlertCircle, Loader2, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../../lib/utils';

interface CashSession {
    id: number;
    cashRegisterId: number;
    openingBalance: number;
    expectedBalance: number | null;
    status: 'open' | 'closed';
    openedAt: string;
    cashRegister: {
        id: number;
        name: string;
        type: 'sales' | 'delivery' | 'operating';
    };
    opener: { fullName: string };
    currentBalance?: number;
}

export default function CashTransfersPage() {
    const { data: sessionsData, loading, refetch } = useFetch<{ data: CashSession[] }>('/admin/cash/sessions/current');
    const sessions = sessionsData?.data || [];

    const [sourceSessionId, setSourceSessionId] = useState<number | null>(null);
    const [targetSessionId, setTargetSessionId] = useState<number | null>(null);
    const [amount, setAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const sourceSessions = useMemo(() =>
        sessions.filter(s => ['sales', 'delivery'].includes(s.cashRegister.type)),
        [sessions]);

    const targetSessions = useMemo(() =>
        sessions.filter(s => s.cashRegister.type === 'operating'),
        [sessions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceSessionId || !targetSessionId || amount <= 0) return toast.error('Veuillez remplir tous les champs');

        setSubmitting(true);
        try {
            await api.post('/admin/cash/transfers', { sourceSessionId, targetSessionId, amount, description });
            toast.success('Transfert effectué avec succès');
            setAmount(0);
            setDescription('');
            setSourceSessionId(null);
            setTargetSessionId(null);
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du transfert');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center gap-4 animate-in fade-in">
                <Loader2 className="w-12 h-12 animate-spin text-stone-200" />
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Synchro Flux en cours...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 lg:px-8">

            {/* Premium Header */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Transferts internes</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Mouvement de fonds entre segments • Sécurité & Traçabilité
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Source Selection */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between ml-2">
                        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-6 h-6 bg-stone-900 text-white rounded-lg flex items-center justify-center text-[10px]">01</span>
                            Origine du Versement
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {sourceSessions.length === 0 ? (
                            <div className="p-12 text-center bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200 text-[10px] font-black text-stone-300 uppercase tracking-widest leading-loose">
                                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                Aucune session de vente active
                            </div>
                        ) : (
                            sourceSessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => setSourceSessionId(session.id)}
                                    className={cn(
                                        "w-full p-6 rounded-[2rem] border text-left transition-all relative overflow-hidden group",
                                        sourceSessionId === session.id
                                            ? "bg-stone-900 text-white border-stone-900 shadow-2xl scale-[1.02]"
                                            : "bg-white text-stone-600 border-stone-100 hover:border-stone-300 hover:bg-stone-50/50"
                                    )}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-base uppercase tracking-tight leading-none font-display">{session.cashRegister.name}</h3>
                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", sourceSessionId === session.id ? "bg-emerald-500 scale-110" : "bg-stone-100 group-hover:bg-stone-200")}>
                                                {sourceSessionId === session.id && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest", sourceSessionId === session.id ? "bg-white/10 text-stone-400" : "bg-stone-100 text-stone-400 group-hover:bg-stone-200")}>
                                                {session.cashRegister.type}
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-tight", sourceSessionId === session.id ? "text-stone-300" : "text-stone-400")}>Open: {session.opener.fullName}</span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Transfer Form - Premium surgical block */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-stone-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-stone-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150 duration-1000"></div>

                        {(sourceSessionId && targetSessionId) ? (
                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10 animate-in zoom-in-95 duration-500">
                                <div className="text-center">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4 block">MONTANT DU TRANSFERT</label>
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="number"
                                            value={amount || ''}
                                            onChange={e => setAmount(Number(e.target.value))}
                                            className="w-full bg-transparent border-none text-center text-5xl font-black font-display text-white focus:ring-0 p-0 placeholder-white/10"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="h-px w-24 bg-white/10 mx-auto mt-4"></div>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mt-4">FRANCS CFA (XOF)</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1 block">NOTE / JUSTIFICATIF (OPTIONNEL)</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="EX: VERSEMENT FIN DE JOURNÉE..."
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 font-black text-[10px] p-5 uppercase tracking-widest text-white transition-all resize-none placeholder-white/10"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={amount <= 0 || submitting}
                                    className="w-full h-16 bg-white text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 group/btn hover:bg-emerald-500 hover:text-white"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span>Valider le Mouvement</span>
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-center p-6 animate-in slide-in-from-bottom-8 duration-700">
                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                                    <ArrowRightLeft className="w-8 h-8 text-stone-500" />
                                </div>
                                <h3 className="text-white font-black text-sm uppercase tracking-tight mb-2 leading-none">Configuration requise</h3>
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-loose max-w-[200px] mx-auto">Veuillez sélectionner une source et une destination pour activer le formulaire</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-indigo-500" />
                        </div>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.1em] leading-relaxed">
                            Le transfert génère automatiquement une <strong className="text-stone-900 border-b border-red-200">SORTIE</strong> en origine et une <strong className="text-stone-900 border-b border-emerald-200">ENTRÉE</strong> en destination.
                        </p>
                    </div>
                </div>

                {/* Target Selection */}
                <div className="lg:col-span-4 space-y-6 text-right">
                    <div className="flex items-center justify-between mr-2 flex-row-reverse">
                        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 flex-row-reverse">
                            <span className="w-6 h-6 bg-stone-900 text-white rounded-lg flex items-center justify-center text-[10px]">02</span>
                            Destination (Fonctionnement)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {targetSessions.length === 0 ? (
                            <div className="p-12 text-center bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200 text-[10px] font-black text-stone-300 uppercase tracking-widest leading-loose">
                                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                Aucune caisse de fonctionnement active
                            </div>
                        ) : (
                            targetSessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => setTargetSessionId(session.id)}
                                    className={cn(
                                        "w-full p-6 rounded-[2rem] border text-left transition-all relative overflow-hidden group",
                                        targetSessionId === session.id
                                            ? "bg-stone-900 text-white border-stone-900 shadow-2xl scale-[1.02]"
                                            : "bg-white text-stone-600 border-stone-100 hover:border-stone-300 hover:bg-stone-50/50"
                                    )}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-base uppercase tracking-tight leading-none font-display">{session.cashRegister.name}</h3>
                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", targetSessionId === session.id ? "bg-purple-500 scale-110" : "bg-stone-100 group-hover:bg-stone-200")}>
                                                {targetSessionId === session.id && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest", targetSessionId === session.id ? "bg-white/10 text-stone-400" : "bg-stone-100 text-stone-400 group-hover:bg-stone-200")}>
                                                {session.cashRegister.type}
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-tight", targetSessionId === session.id ? "text-stone-300" : "text-stone-400")}>Open: {session.opener.fullName}</span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
