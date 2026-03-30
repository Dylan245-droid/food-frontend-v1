// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from "../../components/ui/Button";
import {
    Users, DollarSign, Activity, ShieldAlert,
    TrendingUp, Store, Globe, ChevronRight, RotateCcw,
    Zap, Clock, ShieldCheck, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../../lib/utils';
import { formatDistanceToNow, isAfter, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Recharts for graphs
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, CartesianGrid
} from 'recharts';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes] = await Promise.all([
                api.get('/super-admin/stats'),
                api.get('/super-admin/tenants')
            ]);
            setStats(statsRes.data);
            setTenants(tenantsRes.data.data);
        } catch (error) {
            toast.error("Erreur de synchronisation");
        } finally {
            setLoading(false);
        }
    };

    const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/super-admin/tenants/${id}/toggle-status`);
            toast.success(`Restaurant ${currentStatus ? 'désactivé' : 'activé'}`);
            fetchData();
        } catch (error) {
            toast.error("Action impossible");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading && !stats) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Synchro Plateforme...</p>
        </div>
    );

    const planData = stats ? [
        { name: 'Essai', value: stats.subscriptions.TRIAL, color: '#a8a29e' },
        { name: 'Essentiel', value: stats.subscriptions.ESSENTIAL, color: '#3b82f6' },
        { name: 'Pro', value: stats.subscriptions.PRO, color: '#f97316' },
        { name: 'Élite', value: stats.subscriptions.ELITE, color: '#8b5cf6' }
    ] : [];

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <Globe className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Vue d'ensemble</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Pilotage Global • {tenants.length} Établissements
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
                    <div className="relative group/search flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within/search:text-stone-900 transition-colors" />
                        <input
                            type="text"
                            placeholder="RECHERCHER UN RESTAURANT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-stone-100 transition-all placeholder-stone-300"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Actualiser</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <DollarSign className="w-24 h-24 text-stone-900" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-2">Revenu Mensuel (MRR)</p>
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-black text-stone-900 font-display tracking-tighter">
                            {formatCurrency(stats?.financials.mrr || 0)}
                        </h3>
                        {stats?.financials.growth > 0 && (
                            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{stats.financials.growth}%
                            </span>
                        )}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                             Calculé au Réel
                        </div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest italic tracking-tight">Flux Facturé</span>
                    </div>
                </div>

                {/* Active Restaurants */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <Store className="w-24 h-24 text-stone-900" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-2">Park Restaurants</p>
                    <h3 className="text-3xl font-black text-stone-900 font-display tracking-tighter">
                        {stats?.tenants.active} <span className="text-sm font-bold text-stone-200">/ {stats?.tenants.total}</span>
                    </h3>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            + {stats?.tenants.newThisMonth || 0} ce mois
                        </div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">En ligne</span>
                    </div>
                </div>

                {/* Churn / Inactive */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <ShieldAlert className="w-24 h-24 text-red-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-2">Taux d'Inactivité</p>
                    <h3 className="text-3xl font-black text-red-600 font-display tracking-tighter">
                        {stats?.tenants.inactive} <span className="text-sm font-bold text-red-200">Hold</span>
                    </h3>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.4)]"></div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Action requise</span>
                    </div>
                </div>


            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Distribution Chart - High End */}
                <div className="lg:col-span-4 bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl shadow-stone-900/10 text-white relative overflow-hidden min-h-[400px] flex flex-col">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_60%)]"></div>
                    <div className="relative z-10 mb-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-2">Maturité Commerciale</h3>
                        <p className="text-xl font-black font-display tracking-tight uppercase">Répartition des Offres</p>
                    </div>

                    <div className="flex-1 min-h-0 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planData} layout="vertical" margin={{ left: -20, right: 30, top: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 900, fill: '#57534e' } as any} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ borderRadius: '16px', backgroundColor: '#1c1917', border: '1px solid #292524', color: 'white', padding: '12px' }}
                                    itemStyle={{ color: 'white', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="value" radius={[2, 6, 6, 2]} barSize={28}>
                                    {planData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 space-y-3 relative z-10">
                        {planData.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover/item:text-white transition-colors">{p.name}</span>
                                </div>
                                <span className="font-black text-xs text-stone-300">{p.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tenant List Section - RE-IMAGINED (User's Missing Section) */}
                <div className="lg:col-span-8 bg-white border border-stone-100 shadow-sm rounded-[2.5rem] p-8 md:p-10 flex flex-col min-h-[400px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-stone-50">
                        <div>
                            <h3 className="text-base font-black text-stone-900 uppercase tracking-tight font-display flex items-center gap-3">
                                <Store className="w-5 h-5 text-stone-300" />
                                Listing des Restaurants (Tenants)
                            </h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">{filteredTenants.length} Établissement(s) identifié(s)</p>
                        </div>
                        <Button
                            variant="secondary"
                            className="bg-stone-50 text-stone-900 border-stone-100 rounded-2xl font-black uppercase tracking-widest text-[9px] h-11 px-6 hover:bg-stone-100 transition-all shadow-sm"
                            onClick={() => fetchData()}
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Force Sync
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">
                                    <th className="pb-6 pl-4 font-black">Restaurant & Santé</th>
                                    <th className="pb-6 text-center">Activité</th>
                                    <th className="pb-6 text-center">Abonnement</th>
                                    <th className="pb-6 text-center">Échéance</th>
                                    <th className="pb-6 text-right pr-4 font-black">Gestion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredTenants.length === 0 ? (
                                    <tr><td colSpan={5} className="py-24 text-center text-[11px] font-black text-stone-300 uppercase tracking-widest italic">Aucun restaurant ne correspond à votre recherche</td></tr>
                                ) : filteredTenants.map(t => (
                                    <tr key={t.id} className="hover:bg-stone-50/50 transition-all group">
                                        <td className="py-6 pl-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all">
                                                    {t.lastOrderAt && differenceInDays(new Date(), new Date(t.lastOrderAt)) < 3 ? (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    ) : t.lastOrderAt && differenceInDays(new Date(), new Date(t.lastOrderAt)) < 7 ? (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></div>
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-stone-900 text-sm uppercase tracking-tight group-hover:text-stone-900 transition-colors uppercase truncate max-w-[180px]">{t.name}</div>
                                                    <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                                                        {t.isActive ? 'Opérationnel' : 'Suspendu'} • {t.ordersCount} Ventes
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-stone-800 text-[10px] uppercase truncate max-w-[120px] leading-tight mb-1">
                                                    {t.lastOrderAt ? formatDistanceToNow(new Date(t.lastOrderAt), { addSuffix: true, locale: fr }) : 'Aucune'}
                                                </span>
                                                <span className="text-[9px] text-stone-300 font-bold uppercase tracking-tight">Dernière vente</span>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center">
                                            <span className={cn(
                                                "inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-stone-200/50 shadow-sm",
                                                t.subscription?.plan === 'PRO' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                                                t.subscription?.plan === 'ESSENTIAL' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                "bg-stone-100 text-stone-600"
                                            )}>
                                                {t.subscription?.plan === 'PRO' ? 'PRO' : 
                                                 t.subscription?.plan === 'ESSENTIAL' ? 'ESSENTIEL' : 
                                                 'ESSAI'}
                                            </span>
                                        </td>
                                        <td className="py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={cn(
                                                    "font-black text-[11px] uppercase tracking-tighter",
                                                    t.subscription.daysLeft < 5 ? "text-red-600" : "text-stone-900"
                                                )}>
                                                    {t.subscription.daysLeft} jours
                                                </span>
                                                <span className="text-[9px] text-stone-300 font-bold uppercase tracking-tight">
                                                    {t.subscription.subscriptionEndsAt ? new Date(t.subscription.subscriptionEndsAt).toLocaleDateString('fr-FR') : 'Essai'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 text-right pr-4">
                                            <button
                                                onClick={() => toggleTenantStatus(t.id, t.isActive)}
                                                className={cn(
                                                    "h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 flex items-center gap-2 ml-auto shadow-sm",
                                                    t.isActive
                                                        ? "bg-white text-stone-400 border border-stone-100 hover:text-red-600 hover:border-red-100"
                                                        : "bg-emerald-600 text-white shadow-emerald-100 border border-emerald-600 hover:bg-emerald-700"
                                                )}
                                            >
                                                {t.isActive ? (
                                                    <Activity className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Zap className="w-3.5 h-3.5" />
                                                )}
                                                {t.isActive ? "Pause" : "Activer"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
