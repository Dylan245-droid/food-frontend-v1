import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, Smartphone, Wallet, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';

interface FiafioPaymentModalProps {
    open: boolean;
    onClose: () => void;
    planName: string;
    amount: number;
    cycle: 'MONTHLY' | 'YEARLY';
    onSuccess: () => void;
}

type PaymentStep = 'INPUT' | 'CONFIRM' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export default function FiafioPaymentModal({ open, onClose, planName, amount, cycle, onSuccess }: FiafioPaymentModalProps) {
    const [step, setStep] = useState<PaymentStep>('INPUT');
    const [fiafioId, setFiafioId] = useState('');
    const [error, setError] = useState('');
    const [pollCount, setPollCount] = useState(0);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setStep('INPUT');
            setFiafioId('');
            setError('');
            setPollCount(0);
        }
    }, [open]);

    // Polling Logic
    useEffect(() => {
        let interval: any;

        if (step === 'PROCESSING') {
            interval = setInterval(async () => {
                setPollCount(prev => prev + 1);

                try {
                    const res = await api.get('/admin/subscription');
                    // Check if subscriptionStatus became ACTIVE or pending mandate status changed
                    // For simplicity, we just check if we have a mandate status of ACTIVE, 
                    // or if the subscription plan matches target and is active.
                    // Ideally the backend subscription endpoint returns the mandate status.
                    // Let's assume if status is 'ACTIVE' and plan matches, we are good.

                    if (res.data.status === 'ACTIVE' && res.data.plan === planName.toUpperCase()) {
                        setStep('SUCCESS');
                        clearInterval(interval);
                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }

                // Timeout after 2 minutes (120s / 3s = 40 checks)
                if (pollCount > 60) {
                    clearInterval(interval);
                    setError("Délai d'attente dépassé. Veuillez vérifier votre application Fiafio.");
                    setStep('ERROR');
                }

            }, 2000);
        }

        return () => clearInterval(interval);
    }, [step, pollCount, planName, onSuccess, onClose]);

    const handleInitiate = () => {
        if (!fiafioId || fiafioId.length < 3) {
            setError("Veuillez entrer un ID Fiafio valide");
            return;
        }
        setError('');
        setStep('CONFIRM');
    };

    const handleConfirm = async () => {
        setStep('PROCESSING');
        setError('');

        try {
            const res = await api.post('/admin/subscription/subscribe', {
                plan: planName.toUpperCase(),
                cycle,
                fiafioId
            });

            if (!res.data.success) {
                throw new Error(res.data.message);
            }
            // Request sent, now we wait for user formatting
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Erreur lors de l'initialisation du paiement");
            setStep('ERROR');
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-stone-950 p-6 flex items-center justify-between border-b border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Paiement Fiafio</h3>
                            <p className="text-xs text-stone-500">Paiement sécurisé instantané</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-stone-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* STEP 1: INPUT */}
                    {step === 'INPUT' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-2">Votre ID Fiafio</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-stone-500" />
                                    <input
                                        type="text"
                                        value={fiafioId}
                                        onChange={(e) => setFiafioId(e.target.value)}
                                        placeholder="Ex: USER-12345"
                                        className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-stone-500 mt-2">Vous recevrez une demande de validation sur votre application.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleInitiate}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                            >
                                Continuer
                            </button>
                        </div>
                    )}

                    {/* STEP 2: CONFIRM */}
                    {step === 'CONFIRM' && (
                        <div className="space-y-6">
                            <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3">
                                <div className="flex justify-between items-center text-stone-400 text-sm">
                                    <span>Abonnement {planName}</span>
                                    <span>{formatCurrency(amount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-stone-400 text-sm">
                                    <span>Frais de transaction</span>
                                    <span className="text-green-400">0 FCFA (Offerts)</span>
                                </div>
                                <div className="h-px bg-stone-800 my-2" />
                                <div className="flex justify-between items-center text-white font-bold text-lg">
                                    <span className="text-sm font-bold uppercase tracking-widest text-stone-500">Total à payer</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black tracking-tight">{new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ')}</span>
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">FCFA</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 text-xs text-stone-500 bg-purple-900/10 p-3 rounded-xl border border-purple-500/10">
                                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                                En confirmant, vous autorisez GoTchop à prélever ce montant mensuellement via Fiafio.
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('INPUT')}
                                    className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Payer {formatCurrency(amount)}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PROCESSING */}
                    {step === 'PROCESSING' && (
                        <div className="py-8 flex flex-col items-center text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                                <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative z-10" />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-white">En attente de validation...</h4>
                                <p className="text-stone-400 max-w-xs mx-auto text-sm">
                                    Une demande de paiement a été envoyée au <strong>{fiafioId}</strong>.
                                    <br />
                                    <span className="text-purple-400 font-medium">Ouvrez votre application Fiafio pour valider.</span>
                                </p>
                            </div>

                            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden max-w-xs">
                                <div className="h-full bg-purple-500 animate-progress origin-left w-full" />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 'SUCCESS' && (
                        <div className="py-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
                                <Check className="w-10 h-10 text-green-500" />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-white">Paiement Réussi !</h4>
                                <p className="text-stone-400 max-w-xs mx-auto">
                                    Votre abonnement <strong>{planName}</strong> est maintenant actif. Merci de votre confiance !
                                </p>
                            </div>

                            <button onClick={onClose} className="text-stone-500 hover:text-white text-sm underline">
                                Fermer cette fenêtre
                            </button>
                        </div>
                    )}

                    {/* STEP 5: ERROR */}
                    {step === 'ERROR' && (
                        <div className="py-8 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center ring-4 ring-red-500/20">
                                <X className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-white">Échec du paiement</h4>
                                <p className="text-red-400 max-w-xs mx-auto text-sm">
                                    {error}
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 rounded-xl"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => setStep('INPUT')}
                                    className="flex-1 bg-white text-black hover:bg-stone-200 font-bold py-3 rounded-xl"
                                >
                                    Réessayer
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
