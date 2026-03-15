// @ts-nocheck
import { useFetch } from '../../lib/useFetch';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { Loader2, TrendingUp, ShoppingBag, Clock, UtensilsCrossed, ArrowRight, Zap, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return "Bon après-midi";
    return 'Bonsoir';
}

export default function DashboardPage() {
    const { data: stats, loading, error } = useFetch<any>('/staff/orders/stats');
    const { branding } = useBranding();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Synchro Dashboard...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 text-center">
            <p className="font-black uppercase tracking-widest">Erreur de Flux</p>
            <p className="text-sm mt-2 font-medium opacity-70 italic">Impossible de synchroniser les données d'exploitation.</p>
        </div>
    );

    const pendingCount = stats?.pending || 0;
    const inProgressCount = stats?.inProgress || 0;
    const activeOrders = pendingCount + inProgressCount;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">

            {/* Premium Header - Stone Style */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-4 sm:p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

                <div className="relative z-10">
                    <h1 className="text-lg xs:text-2xl md:text-4xl font-black text-stone-900 tracking-tight leading-none italic uppercase underline decoration-stone-900/5 decoration-8 underline-offset-4">
                        {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Chef'} 👋
                    </h1>
                    <p className="text-stone-400 text-xs md:text-sm font-bold mt-3 tracking-wide uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Status: Système Opérationnel • Hub de Commande
                    </p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 px-6 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                </div>
            </div>

            {/* KPI Grid - High Polish Surgical Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Active Orders - Minimalist Pure */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group hover:border-stone-900/10 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 transition-all group-hover:bg-stone-900 group-hover:text-white group-hover:rotate-12">
                            <Zap className="w-6 h-6" />
                        </div>
                        <button onClick={() => navigate('/admin/orders')} className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-2">Flux en Cuisine</p>
                    <h3 className="text-4xl font-black text-stone-900 tracking-tighter">{activeOrders} <span className="text-xs text-stone-200 uppercase align-middle ml-1">En cours</span></h3>

                    <div className="flex gap-3 mt-8">
                        <div className="flex-1 px-4 py-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                <span className="text-[9px] font-black uppercase text-stone-400">Attente</span>
                            </div>
                            <span className="text-sm font-black text-stone-900">{pendingCount}</span>
                        </div>
                        <div className="flex-1 px-4 py-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                <span className="text-[9px] font-black uppercase text-stone-400">Prépa</span>
                            </div>
                            <span className="text-sm font-black text-stone-900">{inProgressCount}</span>
                        </div>
                    </div>
                </div>

                {/* Delivered Status */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                        <ShoppingBag className="w-24 h-24 text-stone-900" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 mb-8">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-2">Productivité Quotidienne</p>
                    <h3 className="text-4xl font-black text-stone-900 tracking-tighter">{stats?.deliveredToday || 0} <span className="text-xs text-stone-200 uppercase align-middle ml-1">Success</span></h3>
                    <p className="text-[10px] text-stone-400 font-bold mt-8 flex items-center gap-2 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                        Volume de sortie aujourd'hui
                    </p>
                </div>

                {/* Revenue Premium - Brand style */}
                <div
                    className="p-8 rounded-[2.5rem] text-white relative overflow-hidden sm:col-span-2 lg:col-span-1 shadow-2xl shadow-stone-950/10 group h-full"
                    style={{ background: 'var(--gradient-brand)' }}
                >
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-8 backdrop-blur-md border border-white/10">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Chiffre d'Affaires Cash</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter font-display">{formatCurrency(stats?.totalRevenue || 0)}</h3>
                        <div className="mt-auto pt-8">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/5">
                                <Zap className="w-3.5 h-3.5" /> Direct Pay
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics & Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Hourly Activity - Premium Area Style Chart */}
                <div className="lg:col-span-8 bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col h-[520px]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em]">Intensité horaire</h3>
                            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">Flux de commandes sur 24h</p>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-stone-200"></div>)}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 w-full group/chart">
                        {stats?.chartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData.filter((d: any) => d.revenue > 0 || (parseInt(d.hour) >= 8 && parseInt(d.hour) <= 23))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafafa" />
                                    <XAxis
                                        dataKey="hour"
                                        tick={{ fontSize: 10, fill: '#d6d3d1', fontWeight: 900 } as any}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#d6d3d1', fontWeight: 900 } as any}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{
                                            borderRadius: '20px',
                                            border: 'none',
                                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                                            padding: '12px 20px',
                                            backgroundColor: '#1c1917'
                                        }}
                                        itemStyle={{ color: 'white', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#1c1917"
                                        radius={[6, 6, 2, 2]}
                                        name="Flux (FCFA)"
                                        barSize={20}
                                    >
                                        {stats.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} className="transition-all duration-300" fill={entry.revenue > 0 ? '#1c1917' : '#f5f5f4'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-stone-200 gap-3 border-2 border-dashed border-stone-50 rounded-[2rem]">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Calibration des courbes...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts - Dark Stone Style */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] flex flex-col h-full shadow-2xl shadow-stone-950/10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Commandes Rapides</h3>
                        </div>

                        <div className="space-y-3 flex-1">
                            {[
                                { label: 'Flux Cuisine', sub: 'Gérer les commandes', icon: UtensilsCrossed, path: '/admin/orders', color: 'bg-orange-500' },
                                { label: 'Catalogue', sub: 'Modifier la carte', icon: ShoppingBag, path: '/admin/menu', color: 'bg-blue-500' },
                                { label: 'Plan de Salle', sub: 'Salles & Tables', icon: Clock, path: '/admin/tables', color: 'bg-emerald-500' },
                                { label: 'Finance Hub', sub: 'Rapports d\'activité', icon: TrendingUp, path: '/admin/finance', color: 'bg-purple-500' },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg", item.color)}>
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1.5">{item.label}</p>
                                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{item.sub}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>

                        {/* <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-[9px] font-bold text-stone-600 uppercase tracking-[0.2em] italic text-center">GoTchop OS v4.0 • Premium Control</p>
                        </div> */}
                    </div>
                </div>

            </div>
        </div>
    );
}
