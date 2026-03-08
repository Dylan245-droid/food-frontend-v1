import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

import { Check, ShieldCheck, Star, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { showToast } from '../../utils/toast';
import api from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import FiafioPaymentModal from '../../components/FiafioPaymentModal';
import { PRICING_FEATURES } from '../../data/pricingFeatures';

export default function SubscriptionPage() {
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const { refreshUser } = useAuth();

    // Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, amount: number } | null>(null);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);

    // Fetch real subscription data
    const { data: subscription, loading, refetch } = useFetch<any>('/admin/subscription');

    const handleSubscribeClick = async (planName: string, baseAmount: number) => {
        let amount = baseAmount;
        if (billingCycle === 'YEARLY') {
            amount = baseAmount * 12 * 0.85; // 15% discount
        }

        // ONE-CLICK OPTIMIZATION: If mandate is active, try to reactivate directly
        if (subscription?.paymentMethod === 'FIAFIO_MANDATE' && subscription?.fiafioMandateStatus === 'ACTIVE') {
            setProcessingPlan(planName);
            try {
                const res = await api.post('/admin/subscription/subscribe', {
                    plan: planName.toUpperCase(),
                    cycle: billingCycle
                });

                if (res.data.success && !res.data.approvalUrl) {
                    showToast.success(res.data.message);
                    refetch();
                    await refreshUser();
                    setProcessingPlan(null);
                    return;
                }
            } catch (err: any) {
                console.error("Optimized reactivation failed, falling back to modal", err);
                if (err.response?.data?.code === 'DIRECT_DEBIT_FAILED') {
                    showToast.warning(err.response.data.message);
                }
                // Fallback to modal flow below
            }
            setProcessingPlan(null);
        }

        setSelectedPlan({ name: planName, amount });
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        showToast.success("Abonnement activé avec succès !");
        refetch();
        await refreshUser();
        setShowPaymentModal(false);
    };

    const handleCancelAutoRenewal = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir désactiver le renouvellement automatique ? Vous devrez renouveler votre abonnement manuellement à la prochaine échéance.")) {
            return;
        }

        try {
            const res = await api.delete('/api/admin/subscription/mandate');
            if (res.data.success) {
                showToast.success(res.data.message);
                refetch();
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Erreur lors de la désactivation");
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    // Plan Translation Map
    const PLAN_DISPLAY_NAMES: Record<string, string> = {
        'TRIAL': 'Essai Gratuit',
        'ESSENTIAL': 'Essentiel',
        'PRO': 'Pro',
        'ELITE': 'Élite'
    };

    const getPlanDisplayName = (plan: string) => PLAN_DISPLAY_NAMES[plan?.toUpperCase()] || plan;

    // Helper to check current plan
    const isCurrent = (planName: string) => {
        const isPlanMatch = subscription?.plan === planName.toUpperCase();
        // Only show as "Current" (locked/badged) if it's actually ACTIVE or TRIAL
        const isActiveState = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';
        return isPlanMatch && isActiveState;
    };

    const isPlanMatchOnly = (planName: string) => subscription?.plan === planName.toUpperCase();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Modal */}
            {selectedPlan && (
                <FiafioPaymentModal
                    open={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    planName={selectedPlan.name}
                    amount={selectedPlan.amount}
                    cycle={billingCycle}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-stone-900 mb-1 md:mb-2 font-display">Mon Abonnement</h1>
                    <p className="text-xs md:text-sm text-stone-500">Gérez votre offre et votre facturation.</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border",
                        subscription?.status === 'ACTIVE' || (subscription?.status === 'TRIAL' && subscription?.daysLeft > 0) ? "bg-green-100/50 text-green-700 border-green-200" :
                            subscription?.status === 'PAST_DUE' ? "bg-orange-100/50 text-orange-700 border-orange-200" :
                                "bg-red-100/50 text-red-700 border-red-200"
                    )}>
                        <Clock className="w-5 h-5" />
                        <span className="font-bold text-sm">
                            {getPlanDisplayName(subscription?.plan)} • {
                                subscription?.status === 'SUSPENDED' ? 'Suspendu' :
                                    subscription?.status === 'PAST_DUE' ? 'Paiement en retard' :
                                        subscription?.status === 'EXPIRED' || subscription?.daysLeft === 0 ? 'Expiré' :
                                            `${subscription?.daysLeft} jours restants`
                            }
                        </span>
                    </div>

                    {subscription?.paymentMethod === 'FIAFIO_MANDATE' && subscription?.fiafioMandateStatus === 'ACTIVE' && (
                        <button
                            onClick={handleCancelAutoRenewal}
                            className="text-[10px] text-stone-500 hover:text-red-600 underline transition-colors"
                        >
                            Désactiver le renouvellement automatique
                        </button>
                    )}
                </div>
            </header>

            {/* Trial Banner */}
            {subscription?.status === 'TRIAL' && subscription?.daysLeft > 0 && (
                <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 flex items-center gap-2">
                                <AlertCircle className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />
                                Période d'essai bientôt finie
                            </h2>
                            <p className="text-xs md:text-base text-stone-400 max-w-xl">
                                Il vous reste {subscription?.daysLeft} jours.
                                Abonnez-vous pour ne pas perdre l'accès.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Past Due Banner */}
            {subscription?.status === 'PAST_DUE' && (
                <div className="bg-gradient-to-r from-orange-900 to-orange-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <AlertCircle className="text-orange-500" />
                                Paiement en retard
                            </h2>
                            <p className="text-stone-300 max-w-xl">
                                Le prélèvement automatique a échoué. Nous tenterons un nouveau prélèvement pendant les 7 prochains jours. Veuillez vous assurer d'avoir les fonds nécessaires pour ne pas perdre l'accès.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspended Banner */}
            {(subscription?.status === 'SUSPENDED' || subscription?.status === 'EXPIRED' || (subscription?.daysLeft === 0 && !['ACTIVE', 'TRIAL', 'PAST_DUE'].includes(subscription?.status))) && (
                <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <AlertCircle className="text-red-500" />
                                Abonnement Suspendu
                            </h2>
                            <p className="text-stone-300 max-w-xl">
                                Votre accès aux fonctionnalités liées à votre offre <span className="font-bold text-white uppercase">{getPlanDisplayName(subscription?.plan)}</span> est suspendu suite à un échec de renouvellement prolongé.
                                Veuillez régler votre abonnement manuellement pour déverrouiller l'accès.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Toggles */}
            <div className="flex justify-center mt-12">
                <div className="bg-stone-100 p-1 rounded-xl flex items-center relative">
                    <button
                        onClick={() => setBillingCycle('MONTHLY')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                            billingCycle === 'MONTHLY' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                        )}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setBillingCycle('YEARLY')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 flex items-center gap-2",
                            billingCycle === 'YEARLY' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
                        )}
                    >
                        Annuel
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">-15%</span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* ESSENTIEL */}
                <div className={cn(
                    "bg-white rounded-3xl p-8 border flex flex-col transition-all shadow-sm relative overflow-hidden",
                    isCurrent('ESSENTIAL') ? "border-green-500 ring-2 ring-green-500/20" : "border-stone-200 hover:border-orange-200"
                )}>
                    {isCurrent('ESSENTIAL') && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">ACTUEL</div>}
                    <div className="mb-4 md:mb-6">
                        <h3 className="text-lg md:text-xl font-bold text-stone-900">Essentiel</h3>
                        <p className="text-[10px] md:text-sm text-stone-500">Maquis, Dark Kitchen...</p>
                    </div>
                    <div className="mb-4 md:mb-6">
                        <span className="text-3xl md:text-4xl font-black text-stone-900">{formatCurrency(billingCycle === 'YEARLY' ? 35000 * 12 * 0.85 : 35000)}</span>
                        <span className="text-xs md:text-sm font-medium text-stone-400"> / {billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {PRICING_FEATURES.ESSENTIAL.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm text-stone-600">
                                <Check className="w-4 h-4 text-green-500 shrink-0" /> {f}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => handleSubscribeClick('ESSENTIAL', 35000)}
                        disabled={isCurrent('ESSENTIAL') || !!processingPlan}
                        className={cn(
                            "w-full py-4 rounded-xl border font-bold transition-colors flex items-center justify-center gap-2",
                            isCurrent('ESSENTIAL')
                                ? "bg-green-50 text-green-700 border-green-200 cursor-default"
                                : "border-stone-200 text-stone-900 hover:bg-stone-50"
                        )}
                    >
                        {processingPlan === 'ESSENTIAL' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Réactivation en cours...</>
                        ) : isCurrent('ESSENTIAL') ? 'Plan Actuel' : isPlanMatchOnly('ESSENTIAL') ? 'Réactiver Essentiel' : 'Choisir Essentiel'}
                    </button>
                </div>

                {/* PRO */}
                <div className={cn(
                    "rounded-3xl p-8 border flex flex-col relative transform md:scale-105 shadow-2xl z-10",
                    isCurrent('PRO') ? "bg-stone-900 border-green-500 ring-2 ring-green-500" : "bg-stone-900 border-stone-800"
                )}>
                    {!isCurrent('PRO') && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            Populaire
                        </div>
                    )}
                    {isCurrent('PRO') && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">ACTUEL</div>}

                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-orange-500 flex items-center gap-2">
                            <Star className="w-4 h-4 fill-orange-500" /> Pro
                        </h3>
                        <p className="text-stone-400 text-sm">Restaurants, Pizzerias, Lounges, Glaciers</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black text-white">{formatCurrency(billingCycle === 'YEARLY' ? 65000 * 12 * 0.85 : 65000)}</span>
                        <span className="text-sm font-medium text-stone-500"> / {billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {PRICING_FEATURES.PRO.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm text-stone-300">
                                <div className="w-5 h-5 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-orange-500" />
                                </div>
                                {f}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => handleSubscribeClick('PRO', 65000)}
                        disabled={isCurrent('PRO') || !!processingPlan}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2",
                            isCurrent('PRO')
                                ? "bg-green-600 text-white cursor-default"
                                : "bg-orange-600 text-white hover:bg-orange-500 shadow-orange-900/20"
                        )}
                    >
                        {processingPlan === 'PRO' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Réactivation en cours...</>
                        ) : isCurrent('PRO') ? 'Plan Actuel' : isPlanMatchOnly('PRO') ? 'Réactiver Pro' : 'Choisir Pro'}
                    </button>
                </div>

                {/* ÉLITE */}
                <div className={cn(
                    "bg-white rounded-3xl p-8 border flex flex-col transition-all shadow-sm relative overflow-hidden",
                    isCurrent('ELITE') ? "border-green-500 ring-2 ring-green-500/20" : "border-stone-200 hover:border-orange-200"
                )}>
                    {isCurrent('ELITE') && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">ACTUEL</div>}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-stone-900">Élite</h3>
                        <p className="text-stone-500 text-sm">Hôtels, Chaînes, Franchises, Food Courts</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black text-stone-900">{formatCurrency(billingCycle === 'YEARLY' ? 150000 * 12 * 0.85 : 150000)}</span>
                        <span className="text-sm font-medium text-stone-400"> / {billingCycle === 'YEARLY' ? 'an' : 'mois'}</span>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        {PRICING_FEATURES.ELITE.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm text-stone-600">
                                <ShieldCheck className="w-4 h-4 text-stone-900 shrink-0" /> {f}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => handleSubscribeClick('ELITE', 150000)}
                        disabled={isCurrent('ELITE') || !!processingPlan}
                        className={cn(
                            "w-full py-4 rounded-xl border font-bold transition-colors flex items-center justify-center gap-2",
                            isCurrent('ELITE')
                                ? "bg-green-50 text-green-700 border-green-200 cursor-default"
                                : "border-stone-200 text-stone-900 hover:bg-stone-50"
                        )}
                    >
                        {processingPlan === 'ELITE' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Réactivation en cours...</>
                        ) : isCurrent('ELITE') ? 'Plan Actuel' : isPlanMatchOnly('ELITE') ? 'Réactiver Élite' : 'Contacter Ventes'}
                    </button>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-12 text-center">
                <p className="text-sm text-stone-400 mb-4 font-medium uppercase tracking-widest">Paiement sécurisé via</p>
                <div className="flex justify-center items-center gap-2 opacity-70 hover:opacity-100 transition-all">
                    <span className="text-xl font-black text-stone-900 tracking-tighter">Fiafio</span>
                    <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-1 rounded">PAY</span>
                </div>
            </div>
        </div>
    );
}
