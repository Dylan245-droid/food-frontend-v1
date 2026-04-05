// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from "../../components/ui/Button";
import {
    Search, Power, ExternalLink, Calendar,
    AlertCircle, Store, User, CreditCard,
    TrendingUp, ShieldCheck, ShieldAlert,
    RotateCcw, Globe, ChevronRight, Zap, Loader2
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency, getImageUrl } from '../../lib/utils';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for Manual Subscription
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [subForm, setSubForm] = useState({ plan: 'ESSENTIAL', months: 1, amountTtc: 85000, isPromo: false });
    const [subLoading, setSubLoading] = useState(false);


    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data);
        } catch (error) {
            toast.error("Échec de synchronisation");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            await api.patch(`/super-admin/tenants/${id}/toggle-status`);
            toast.success("Statut mis à jour");
            fetchTenants();
        } catch (error) {
            toast.error("Erreur technique");
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleManualSubscription = async () => {
        if (!selectedTenant) return;
        setSubLoading(true);
        try {
            await api.post(`/super-admin/tenants/${selectedTenant.id}/manual-subscription`, subForm);
            toast.success("Renouvellement manuel effectué avec succès !");
            setSubModalOpen(false);
            fetchTenants();
        } catch (error) {
            toast.error("Erreur lors du renouvellement manuel.");
        } finally {
            setSubLoading(false);
        }
    };

    const updatePlan = (plan: string) => {
        const isPromo = subForm.isPromo;
        const base = isPromo 
            ? (plan === 'ESSENTIAL' ? 55000 : 75000) 
            : (plan === 'ESSENTIAL' ? 85000 : 115000);
        setSubForm(prev => ({ ...prev, plan, amountTtc: base * prev.months }));
    };

    const updateMonths = (months: number) => {
        const m = Math.max(1, months);
        const isPromo = subForm.isPromo;
        const base = isPromo 
            ? (subForm.plan === 'ESSENTIAL' ? 55000 : 75000) 
            : (subForm.plan === 'ESSENTIAL' ? 85000 : 115000);
        setSubForm(prev => ({ ...prev, months: m, amountTtc: base * m }));
    };

    const togglePromo = (checked: boolean) => {
        const base = checked 
            ? (subForm.plan === 'ESSENTIAL' ? 55000 : 75000) 
            : (subForm.plan === 'ESSENTIAL' ? 85000 : 115000);
        
        // If enabling promo, cap months at remaining promo months (max 6)
        let months = subForm.months;
        const remaining = 6 - (selectedTenant?.promoMonthsCount || 0);
        if (checked && months > remaining) {
            months = Math.max(1, remaining);
        }

        setSubForm(prev => ({ ...prev, isPromo: checked, months, amountTtc: base * months }));
    };


    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.owner?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPlanStyles = (plan: string) => {
        const p = plan?.toUpperCase();
        switch (p) {
            case 'PRO': return 'bg-orange-500 text-white';
            case 'ESSENTIAL': return 'bg-blue-500 text-white';
            default: return 'bg-stone-100 text-stone-600';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <Store className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Park Restaurants</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Gestion des Tenants • {tenants.length} Établissements
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
                    <div className="relative group/search flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within/search:text-stone-900 transition-colors" />
                        <input
                            type="text"
                            placeholder="RECHERCHER UN TENANT, EMAIL OU SLUG..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-stone-100 transition-all placeholder-stone-300"
                        />
                    </div>
                    <button
                        onClick={fetchTenants}
                        className="h-14 px-8 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Sync</span>
                    </button>
                </div>
            </div>

            {/* List Table - Premium Grouping */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest pl-8">Identité Tenant</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Abonnement</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Facturation</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Jours Restants</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Revenus & Usage</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Échéance Prochaine</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading && tenants.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center"><div className="w-10 h-10 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center text-[11px] font-black text-stone-300 uppercase tracking-widest italic">Aucun tenant identifié</td></tr>
                            ) : (
                                filteredTenants.map((t, idx) => {
                                    const isExpired = t.subscription.status === 'EXPIRED' || t.subscription.status === 'SUSPENDED' || t.subscription.daysLeft === 0;
                                    const expiryDate = t.subscription.plan === 'TRIAL' ? t.subscription.trialEndsAt : t.subscription.subscriptionEndsAt;
                                    return (
                                        <tr key={t.id} className="hover:bg-stone-50/50 transition-all group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 15}ms` }}>
                                            <td className="p-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    {t.logoUrl || t.logo ? (
                                                        <img src={getImageUrl(t.logoUrl || t.logo)} alt={t.name} className="w-14 h-14 rounded-[1.5rem] object-cover border border-stone-100 group-hover:scale-105 transition-all duration-500 shadow-sm shrink-0 bg-white" />
                                                    ) : (
                                                        <div className="w-14 h-14 shrink-0 rounded-[1.5rem] bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all group-hover:scale-105 duration-500">
                                                            <Store className="w-7 h-7" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="font-black text-stone-900 text-sm uppercase tracking-tight truncate max-w-[200px]">{t.name}</div>
                                                            {!t.isActive && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-widest">OFF</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-3 h-3 text-indigo-400" />
                                                            <a href={`/r/${t.slug}`} target="_blank" className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest hover:underline">/r/{t.slug}</a>
                                                        </div>
                                                        <div className="text-[9px] text-stone-400 font-bold mt-1.5 flex items-center gap-1.5 uppercase">
                                                            {t.owner?.avatarUrl || t.owner?.avatar ? (
                                                                <img src={getImageUrl(t.owner.avatarUrl || t.owner.avatar)} alt={t.owner.fullName || ''} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                                                            ) : (
                                                                <User className="w-2.5 h-2.5 shrink-0" />
                                                            )}
                                                            {t.owner?.fullName} ({t.owner?.email})
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                        getPlanStyles(t.subscription.plan)
                                                    )}>
                                                        {t.subscription.plan}
                                                    </span>
                                                    {t.subscription.status === 'SUSPENDED' ? (
                                                        <span className="text-[8px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                            <ShieldAlert className="w-3 h-3" /> Suspendu
                                                        </span>
                                                    ) : isExpired ? (
                                                        <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest">Délai Expiré</span>
                                                    ) : (
                                                        <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Actif / OK</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                                    <div className="text-[10px] font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                                                        <CreditCard className="w-3 h-3 text-stone-400" />
                                                        {t.subscription.paymentMethod === 'FIAFIO_MANDATE' ? 'AUTOPAY' : 'MANUEL'}
                                                    </div>
                                                    {t.subscription.paymentMethod === 'FIAFIO_MANDATE' && (
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border",
                                                            t.subscription.fiafioMandateStatus === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                        )}>
                                                            Mandat: {t.subscription.fiafioMandateStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className={cn(
                                                    "inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl relative",
                                                    t.subscription.daysLeft <= 3 ? "bg-red-50 text-red-600 border border-red-100" : t.subscription.daysLeft <= 7 ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                )}>
                                                    <span className="text-sm font-black tracking-tight leading-none">{t.subscription.daysLeft}</span>
                                                    <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">Jours</span>
                                                    {t.subscription.daysLeft <= 3 && (
                                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                                                    )}
                                                    {t.subscription.daysLeft <= 3 && (
                                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="min-w-[100px]">
                                                        <p className="font-black text-stone-900 text-xs tracking-tight">
                                                            {formatCurrency(
                                                                (t.promoMonthsCount || 0) < 6
                                                                    ? (t.subscription.plan === 'ESSENTIAL' ? 55000 : t.subscription.plan === 'PRO' ? 75000 : 0)
                                                                    : (t.subscription.plan === 'ESSENTIAL' ? 85000 : t.subscription.plan === 'PRO' ? 115000 : 0)
                                                            )}
                                                        </p>
                                                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Renouvellement</p>
                                                    </div>
                                                    <div className="h-10 w-[1px] bg-stone-100"></div>
                                                    <div>
                                                        <p className="font-black text-stone-900 text-xs tracking-tight">{t.ordersCount} <span className="text-[9px] text-stone-400">CMD</span></p>
                                                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Usage global</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                {expiryDate ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                                                            isExpired ? "bg-red-50 text-red-500" : "bg-stone-50 text-stone-900"
                                                        )}>
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className={cn("font-black text-xs tracking-tight uppercase", isExpired ? "text-red-500" : "text-stone-900")}>
                                                                {expiryDate ? format(new Date(expiryDate), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                                                            </p>
                                                            {t.subscription.pastDueSince && (
                                                                <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest animate-pulse">Relance en cours</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-300 font-black text-[10px] uppercase tracking-widest italic">Abonnement Free</span>
                                                )}
                                            </td>
                                            <td className="p-6 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => window.open(`/r/${t.slug}`, '_blank')} className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center border border-stone-100/50">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTenant(t);
                                                            const p = t.subscription.plan === 'TRIAL' ? 'ESSENTIAL' : t.subscription.plan;
                                                            const isEligible = (t.promoMonthsCount || 0) < 6;
                                                            const base = isEligible 
                                                                ? (p === 'PRO' ? 75000 : 55000) 
                                                                : (p === 'PRO' ? 85000 : 115000);
                                                            setSubForm({ plan: p === 'PRO' ? 'PRO' : 'ESSENTIAL', months: 1, amountTtc: base, isPromo: isEligible });
                                                            setSubModalOpen(true);
                                                        }}
                                                        className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white"
                                                    >
                                                        <Zap className="w-3.5 h-3.5" /> 
                                                        {t.subscription.plan === 'TRIAL' ? "S'abonner" : isExpired || t.subscription.status === 'SUSPENDED' ? 'Renouveler' : 'Upgrader'}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(t.id)}
                                                        className={cn(
                                                            "h-10 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 border",
                                                            t.isActive
                                                                ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                                                                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                                                        )}
                                                    >
                                                        {t.isActive ? (
                                                            <>Suspendre</>
                                                        ) : (
                                                            <>Activer Unit</>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Subscription Modal */}
            {subModalOpen && selectedTenant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setSubModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-indigo-500 mb-4">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Renouv. Manuel</h2>
                            <p className="text-xs font-bold text-stone-500 mt-1.5">Configuration de l'abonnement pour <span className="text-stone-900">{selectedTenant.name}</span></p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Plan d'abonnement</label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {['ESSENTIAL', 'PRO'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => updatePlan(p)}
                                            className={cn(
                                                "py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                                                subForm.plan === p
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Promo Launch Section */}
                            <div className="bg-indigo-50 border border-indigo-100/50 rounded-3xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Offre Lancement (6 mois)</p>
                                            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                                                Usage : {selectedTenant.promoMonthsCount || 0} / 6 mois payés
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => togglePromo(!subForm.isPromo)}
                                        disabled={(selectedTenant.promoMonthsCount || 0) >= 6}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                            subForm.isPromo ? "bg-indigo-600" : "bg-stone-200",
                                            (selectedTenant.promoMonthsCount || 0) >= 6 && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                            subForm.isPromo ? "left-7" : "left-1"
                                        )}></div>
                                    </button>
                                </div>
                                {subForm.isPromo && (
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse pl-1">
                                        ✨ Prix promo appliqué : {subForm.plan === 'ESSENTIAL' ? '55.000' : '75.000'} FCFA / mois
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Durée (Mois)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={subForm.isPromo ? (6 - (selectedTenant.promoMonthsCount || 0)) : 99}
                                        value={subForm.months}
                                        onChange={(e) => updateMonths(parseInt(e.target.value) || 1)}
                                        className="w-full h-12 bg-stone-50 border border-stone-100 rounded-2xl px-4 text-sm font-black text-stone-900 focus:outline-none focus:ring-4 focus:ring-indigo-50"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Montant TTC</label>
                                    <div className="h-12 bg-stone-100 rounded-2xl px-4 flex items-center border border-stone-200">
                                        <span className="text-sm font-black text-stone-900">{formatCurrency(subForm.amountTtc)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 text-orange-800 p-3.5 rounded-2xl text-[10px] border border-orange-100/50 flex gap-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0 text-orange-500" />
                                <span className="font-bold leading-relaxed">Cette action va générer directement une facture avec le statut PAYÉ.</span>
                            </div>
                        </div>

                        <div className="p-5 bg-stone-50 border-t border-stone-100 flex justify-end gap-2.5">
                            <Button variant="outline" size="sm" onClick={() => setSubModalOpen(false)} disabled={subLoading}>Annuler</Button>
                            <Button 
                                size="sm" 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200 min-w-[170px]" 
                                onClick={handleManualSubscription}
                                disabled={subLoading}
                            >
                                {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer & Facturer"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
