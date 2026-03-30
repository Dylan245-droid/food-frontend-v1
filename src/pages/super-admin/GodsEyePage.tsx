// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
    TrendingUp,
    BarChart3,
    Users,
    ArrowUpRight,
    RotateCcw,
    Banknote,
    Calendar,
    Search,
    ChevronRight,
    Zap,
    Eye,
    ShoppingCart,
    Award,
    Store,
    LayoutDashboard,
    Activity,
    ShieldCheck,
    Clock
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency } from '../../lib/utils';

interface GodsEyeData {
    kpis: {
        gmv: number;
        totalOrders: number;
        count: number;
        averageBasket: number;
    };
    revenueTrend: Array<{ date: string; total: number }>;
    tenantPerformance: Array<{ id: string; name: string; revenue: number; ordersCount: number; logo_url?: string }>;
    topProducts: Array<{ name: string; totalSold: number; totalRevenue: number }>;
    hourlyDistribution: Array<{ hour: string | number; count: number }>;
    categoryDistribution: Array<{ name: string; revenue: number }>;
}

export default function GodsEyePage() {
    const [data, setData] = useState<GodsEyeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        tenantId: '',
        month: '',
        year: new Date().getFullYear().toString()
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.tenantId) params.append('tenantId', filters.tenantId);
            if (filters.month) params.append('month', filters.month);
            if (filters.year) params.append('year', filters.year);

            const res = await api.get(`/super-admin/analytics/gods-eye?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            toast.error('Erreur analytique (Oeil de Dieu)');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data || []);
        } catch (error) { }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filters]);

    if (loading && !data) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Eye className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] ml-2">Initialisation Oeil de Dieu...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Platform Master Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-xl shadow-stone-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent_50%)]"></div>
                
                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-indigo-600 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-indigo-200 shrink-0 transform hover:rotate-6 transition-transform duration-500">
                        <Eye className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tighter leading-none uppercase italic">Oeil de Dieu</h1>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">Live Intel</span>
                        </div>
                        <p className="text-stone-400 text-[10px] md:text-xs font-bold mt-2 tracking-wide uppercase flex items-center gap-2">
                             Full Platform Visibility • {tenants.length} Établissements
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
                    <div className="h-12 px-6 bg-stone-50 border border-stone-100 rounded-xl flex items-center gap-3 shadow-inner">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">{filters.year} ANALYTICS</span>
                    </div>
                    <button
                        onClick={fetchData}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-200 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 group"
                    >
                        <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
                        <span>Refresh Intelligence</span>
                    </button>
                </div>
            </div>

            {/* Advanced Multi-Layer Filters */}
            <div className="bg-stone-900 p-6 md:p-8 rounded-3xl shadow-2xl shadow-stone-950/20 flex flex-wrap gap-6 items-end text-white relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-[linear-gradient(225deg,rgba(255,255,255,0.03)_0%,transparent_100%)]"></div>

                <div className="flex-1 min-w-[250px] relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-3 ml-2 flex items-center gap-2">
                        <Search className="w-3 h-3" /> Surveillance Restaurant
                    </p>
                    <select
                        value={filters.tenantId}
                        onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer text-white hover:bg-white/10"
                    >
                        <option value="" className="bg-stone-900 text-white">Vision Panoramique (Tous)</option>
                        {tenants.map(t => <option key={t.id} value={t.id} className="bg-stone-900 text-white">{t.name}</option>)}
                    </select>
                </div>

                <div className="w-full sm:w-56 relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 mb-3 ml-2">Période</p>
                    <select
                        value={filters.month}
                        onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer text-white"
                    >
                        <option value="" className="bg-stone-900 text-white">Cumulé Annuel</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1} className="bg-stone-900 text-white">
                                {format(new Date(2024, i, 1), 'MMMM', { locale: fr })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-full sm:w-36 relative z-10">
                    <button
                        onClick={() => setFilters({ tenantId: '', month: '', year: new Date().getFullYear().toString() })}
                        className="w-full h-12 bg-white text-stone-900 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-100 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                </div>
            </div>

            {/* Master KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Total GMV */}
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-stone-200 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500 group-hover:scale-110 transform">
                        <Banknote className="w-20 h-20 text-indigo-600" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-3">Volume d'Affaire Global (GMV)</p>
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-black text-stone- stone-900 font-display tracking-tighter">
                            {formatCurrency(data?.kpis.gmv || 0)}
                        </h3>
                        {data?.kpis.growth !== undefined && (
                            <span className={cn(
                                "text-[10px] font-black flex items-center gap-1",
                                data.kpis.growth >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {data.kpis.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                {data.kpis.growth > 0 ? `+${data.kpis.growth}` : data.kpis.growth}%
                            </span>
                        )}
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                             C.A. Réel
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-stone-200 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500 group-hover:scale-110 transform">
                        <ShoppingCart className="w-20 h-20 text-indigo-600" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-3">Volume de Commandes</p>
                    <h3 className="text-3xl font-black text-stone-900 font-display tracking-tighter">
                        {data?.kpis.count} <span className="text-sm font-bold text-stone-200">VENTES</span>
                    </h3>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                        <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Transactions Scannées</span>
                    </div>
                </div>

                {/* Avg Basket */}
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-stone-200 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500 group-hover:scale-110 transform">
                        <Award className="w-20 h-20 text-indigo-600" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mb-3">Panier Moyen</p>
                    <h3 className="text-3xl font-black text-stone-900 font-display tracking-tighter">
                        {formatCurrency(data?.kpis.averageBasket || 0)}
                    </h3>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                             Index Efficacité
                        </div>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* Revenue Curve - Deep Analytics */}
                <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-3 font-display italic">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                Croissance GMV
                            </h3>
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-2 px-6 border-l-4 border-indigo-500/20 ml-2">Flux de revenus quotidiens</p>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorGodGmv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafaf9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontStyle: 'italic', fontWeight: 900, fill: '#d6d3d1' } as any}
                                    dy={10}
                                    formatter={(val) => val.split('-').slice(2).join('/')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#d6d3d1' } as any}
                                    tickFormatter={(val) => `${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#1c1917', color: 'white', padding: '12px' }}
                                    itemStyle={{ color: 'white', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#6366f1', fontWeight: 900, fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase' }}
                                    formatter={(val: any) => [`${val?.toLocaleString('fr-FR')} FCFA`, 'Ventes']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorGodGmv)"
                                    animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🍕 Revenue Mix - Profitability Layer (4 cols) */}
                <div className="lg:col-span-4 bg-stone-900 p-6 md:p-8 rounded-3xl text-white shadow-2xl shadow-stone-950/20 relative overflow-hidden flex flex-col border border-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                        <Activity className="w-24 h-24" />
                    </div>
                    <div className="mb-6 relative z-10">
                        <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-3 font-display italic">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Mix de Rentabilité
                        </h3>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-2 italic">Revenus par catégorie</p>
                    </div>

                    <div className="flex-1 min-h-[250px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.categoryDistribution} layout="vertical" margin={{ left: -10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#78716c'} as any} width={80} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#000', color: 'white' }}
                                />
                                <Bar dataKey="revenue" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 🕒 Peak Productivity & 💡 THE GUIDE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-12 bg-gradient-to-br from-indigo-900 to-stone-900 p-8 md:p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.2),transparent_60%)]"></div>
                    <div className="relative z-10 flex flex-col xl:flex-row items-center gap-12">
                        <div className="shrink-0 flex flex-col items-center xl:items-start text-center xl:text-left">
                            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 mb-6 group hover:rotate-12 transition-transform">
                                <Eye className="w-12 h-12 text-white animate-pulse" />
                            </div>
                            <h2 className="text-4xl font-black font-display tracking-tight uppercase italic leading-none">Conseils du Guide</h2>
                            <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Analyse Stratégique Temps Réel</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 flex-1">
                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors group/insight">
                                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
                                    <Clock className="w-6 h-6 text-orange-400" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Optimisation Staff</h4>
                                </div>
                                <p className="text-[13px] text-stone-300 leading-relaxed font-medium">
                                    Pic identifié vers <span className="text-white font-black">{data?.hourlyDistribution?.sort((a,b) => b.count - a.count)[0]?.hour}h</span>. 
                                    Staffez 30min avant pour les rushs.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors group/insight">
                                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
                                    <Zap className="w-6 h-6 text-emerald-400" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Mix de Ventes</h4>
                                </div>
                                <p className="text-[13px] text-stone-300 leading-relaxed font-medium">
                                    <span className="text-white font-black">{data?.categoryDistribution[0]?.name || 'N/A'}</span> domine. 
                                    Créez des combos pour booster vos autres catégories.
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors group/insight">
                                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
                                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Santé Globale</h4>
                                </div>
                                <p className="text-[13px] text-stone-300 leading-relaxed font-medium">
                                    Panier moyen : <span className="text-white font-black">{formatCurrency(data?.kpis.averageBasket || 0)}</span>. 
                                    L'Upsell ciblé est la clé ce mois-ci.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🕒 Peak Productivity Chart (Full width below) */}
                <div className="lg:col-span-12 bg-white p-8 md:p-12 rounded-[3.5rem] border border-stone-100 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                        <Clock className="w-32 h-32 text-stone-900" />
                    </div>
                    <div className="mb-10">
                        <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight flex items-center gap-3 font-display italic">
                            <Clock className="w-6 h-6 text-orange-500" />
                            Pics de Productivité Platforme (Heure par Heure)
                        </h3>
                    </div>

                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.hourlyDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafaf9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#d6d3d1'} as any} formatter={(v) => `${v}h`} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f5f5f4'}} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1c1917', color: 'white' }} />
                                <Bar dataKey="count" fill="url(#hourGradientGuide)" radius={[10, 10, 0, 0]} barSize={25}>
                                    <defs>
                                        <linearGradient id="hourGradientGuide" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fb923c" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tenant Deep Dive Table */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-stone-50">
                    <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-3 font-display">
                        <Store className="w-5 h-5 text-stone-300" />
                        Surveillance Établissements
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-stone-50/50">
                                <th className="p-5 text-[10px] font-black text-stone-400 uppercase tracking-widest pl-10 border-b border-stone-100">Restaurant</th>
                                <th className="p-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center border-b border-stone-100">Commandes</th>
                                <th className="p-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right border-b border-stone-100">C.A. Généré</th>
                                <th className="p-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center border-b border-stone-100">Contribution</th>
                                <th className="p-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right pr-10 border-b border-stone-100">Détails</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {data?.tenantPerformance.map((tp, idx) => {
                                const contribution = data.kpis.gmv > 0 ? Math.round((tp.revenue / data.kpis.gmv) * 100) : 0;
                                return (
                                    <tr key={idx} className="group hover:bg-stone-50/70 transition-all cursor-default">
                                        <td className="p-5 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-105 duration-300 overflow-hidden shrink-0">
                                                    {tp.logo_url ? (
                                                        <img 
                                                            src={tp.logo_url} 
                                                            alt={tp.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement?.classList.add('bg-stone-100');
                                                            }}
                                                        />
                                                    ) : (
                                                        <Store className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-stone-900 text-xs uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{tp.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="font-black text-stone-900 text-xs">{tp.ordersCount}</span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <p className="font-black text-stone-900 text-sm tracking-tighter">{formatCurrency(tp.revenue || 0)}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-full max-w-[80px] h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                        style={{ width: `${contribution}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{contribution}%</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right pr-10">
                                            <button className="h-9 w-9 rounded-xl border border-stone-100 flex items-center justify-center text-stone-300 hover:text-indigo-600 transition-all ml-auto">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
