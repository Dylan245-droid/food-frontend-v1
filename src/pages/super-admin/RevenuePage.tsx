// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
    TrendingUp,
    DollarSign,
    BarChart3,
    Users,
    ArrowUpRight,
    RotateCcw,
    Banknote,
    Calendar,
    Search,
    ChevronRight,
    Clock,
    FileText,
    Zap
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

interface RevenueData {
    monthly: Array<{ month: string; total: number }>;
    byTenant: Array<{ name: string; total: number }>;
    lifetime: {
        total: number;
        count: number;
    };
}

const PREMIUM_COLORS = ['#1c1917', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#10b981'];

export default function RevenuePage() {
    const [data, setData] = useState<RevenueData | null>(null);
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

            const res = await api.get(`/super-admin/revenue-history?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            toast.error('Erreur analytique');
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
                <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Synchro Analytics...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase italic underline decoration-orange-500/30 decoration-8 underline-offset-4">Revenue Analytics</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Performance Plateforme • Hub Financier
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
                    <button
                        onClick={fetchData}
                        className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Refresh Data</span>
                    </button>
                    <div className="h-14 px-6 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">{filters.year} Overview</span>
                    </div>
                </div>
            </div>

            {/* Invoices Filters - Premium Stone Grid */}
            <div className="bg-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-950/20 flex flex-wrap gap-5 items-end text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex-1 min-w-[240px] relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 ml-2 flex items-center gap-2">
                        <Search className="w-3 h-3" /> Filtrer par Restaurant
                    </p>
                    <select
                        value={filters.tenantId}
                        onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-white/5 outline-none transition-all appearance-none cursor-pointer text-white"
                    >
                        <option value="" className="bg-stone-900 text-white">Tous les établissements</option>
                        {tenants.map(t => <option key={t.id} value={t.id} className="bg-stone-900 text-white">{t.name}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-48 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3 ml-2">Mois Cible</p>
                    <select
                        value={filters.month}
                        onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-white/5 outline-none transition-all appearance-none cursor-pointer text-white"
                    >
                        <option value="" className="bg-stone-900 text-white">Cumulé Annuel</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1} className="bg-stone-900 text-white">
                                {format(new Date(2024, i, 1), 'MMMM', { locale: fr })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-32 relative z-10">
                    <button
                        onClick={() => setFilters({ tenantId: '', month: '', year: new Date().getFullYear().toString() })}
                        className="w-full h-14 bg-white text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Main Revenue Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <Banknote className="w-24 h-24 text-stone-900" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-3">
                        {filters.month || filters.tenantId ? 'Volume Période' : 'Total Consolidé'}
                    </p>
                    <h3 className="text-4xl font-black text-stone-900 font-display tracking-tighter">
                        {formatCurrency(data?.lifetime.total || 0)}
                    </h3>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Target Met
                        </div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Encaissé à date</span>
                    </div>
                </div>

                {/* Docs Count */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <FileText className="w-24 h-24 text-stone-900" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-3">Nombre d'Inscriptions / Fac</p>
                    <h3 className="text-4xl font-black text-stone-900 font-display tracking-tighter">
                        {data?.lifetime.count} <span className="text-sm font-bold text-stone-200">DOCS</span>
                    </h3>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-stone-900"></div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Transactions validées</span>
                    </div>
                </div>

                {/* Average Ticket */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <BarChart3 className="w-24 h-24 text-stone-900" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-3">ARPU / Panier Moyen</p>
                    <h3 className="text-4xl font-black text-stone-900 font-display tracking-tighter">
                        {formatCurrency(data?.lifetime.count > 0 ? Math.round(data?.lifetime.total / data?.lifetime.count) : 0)}
                    </h3>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Index Qualité
                        </div>
                        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Value per tenant</span>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Monthly Trend - Premium Area Chart */}
                <div className="lg:col-span-12 xl:col-span-8 bg-white p-8 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-base font-black text-stone-900 uppercase tracking-tight flex items-center gap-3 font-display">
                                <BarChart3 className="w-5 h-5 text-stone-300" />
                                Courbe de Croissance
                            </h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2 px-8 border-l border-stone-100 ml-2.5">Projection des revenus mensuels consolidés</p>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.monthly}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1c1917" stopOpacity={0.08} />
                                        <stop offset="95%" stopColor="#1c1917" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafaf9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#d6d3d1' } as any}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#d6d3d1' } as any}
                                    tickFormatter={(val) => `${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#1c1917', color: 'white' }}
                                    itemStyle={{ color: 'white', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                                    labelStyle={{ display: 'none' }}
                                    formatter={(val: any) => [`${val?.toLocaleString('fr-FR')} FCFA`, 'Volume Revenu']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#1c1917"
                                    strokeWidth={6}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Breakdown - High Polish */}
                <div className="lg:col-span-12 xl:col-span-4 bg-stone-900 p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl shadow-stone-950/20 h-full">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Analyse Établissement</h3>
                            <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.2em] mt-1">Répartition de la valeur</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {data?.byTenant.length === 0 ? (
                            <div className="py-20 text-center text-[10px] font-black text-stone-500 uppercase tracking-widest">Data pending...</div>
                        ) : data?.byTenant.map((tenant, idx) => {
                            const percentage = data?.lifetime.total > 0 ? Math.round((tenant.total / data.lifetime.total) * 100) : 0;
                            return (
                                <div key={idx} className="group cursor-default p-4 rounded-2xl hover:bg-white/5 transition-all">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1.5 group-hover:text-stone-300 transition-colors">{tenant.name}</p>
                                            <p className="text-lg font-black font-display tracking-tight">{formatCurrency(tenant.total)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-white px-2 py-1 bg-white/10 rounded-lg">{percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 pt-12 border-t border-white/5 ">
                        <button
                            onClick={() => window.location.href = '/admin/super/tenants'}
                            className="w-full h-14 bg-white/5 hover:bg-white text-stone-400 hover:text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
                        >
                            <span>Voir tout le park</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
