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
import { Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RevenueData {
    monthly: Array<{ month: string; total: number }>;
    byTenant: Array<{ name: string; total: number }>;
    lifetime: {
        total: number;
        count: number;
    };
}

interface Tenant {
    id: string;
    name: string;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

export default function RevenuePage() {
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<Tenant[]>([]);
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
            console.error('Error fetching revenue history:', error);
            toast.error('Erreur lors du chargement des données financières');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filters]);

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
            <div className="space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight leading-tight italic">HISTORIQUE DES REVENUS</h1>
                        <p className="text-stone-400 text-xs sm:text-sm font-bold mt-1">Analyse chirurgicale de la performance GoTchop</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white rounded-2xl border border-stone-100 shadow-sm hover:bg-stone-50 transition-all text-stone-600 active:scale-95"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* Invoices Filters */}
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-stone-100 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-1 ml-1">Restaurant</label>
                        <select
                            value={filters.tenantId}
                            onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
                            className="w-full h-11 bg-stone-50 border border-stone-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Tous les restaurants</option>
                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-1 ml-1">Mois</label>
                        <select
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                            className="w-full h-11 bg-stone-50 border border-stone-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Tous les mois</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {format(new Date(2024, i, 1), 'MMMM', { locale: fr })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-1 ml-1">Année</label>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full h-11 bg-stone-50 border border-stone-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none cursor-pointer"
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => setFilters({ tenantId: '', month: '', year: new Date().getFullYear().toString() })}
                        className="h-11 px-4 text-stone-400 hover:text-orange-500 transition-colors"
                        title="Réinitialiser"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* Lifetime Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Banknote className="w-24 h-24 text-stone-900" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">
                                {filters.month || filters.tenantId || filters.year !== new Date().getFullYear().toString() ? 'Revenu Période' : 'Revenu Total Vie'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black text-stone-900">{data.lifetime.total.toLocaleString('fr-FR')}</h3>
                                <span className="text-stone-400 font-bold text-sm">FCFA</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full text-[10px] font-bold">
                                <TrendingUp className="w-3 h-3" />
                                <span>Performance cible</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="w-24 h-24 text-stone-900" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Factures {filters.month || filters.year ? 'Période' : 'Total'}</p>
                            <h3 className="text-3xl font-black text-stone-900">{data.lifetime.count}</h3>
                            <div className="mt-4 flex items-center gap-2 text-stone-500 bg-stone-50 w-fit px-3 py-1 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                <span>Validité chirurgicale</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-20 h-20 text-stone-900" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Panier Moyen / Facture</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                                    {data.lifetime.count > 0 ? Math.round(data.lifetime.total / data.lifetime.count).toLocaleString('fr-FR') : 0}
                                </h3>
                                <span className="text-stone-400 font-bold text-sm">FCFA</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-[10px] font-bold">
                                <DollarSign className="w-3 h-3" />
                                <span>Analyse de valeur</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trend */}
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-orange-500" />
                                Croissance Mensuelle
                            </h3>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthly}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }}
                                        tickFormatter={(val) => `${val / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [`${val?.toLocaleString('fr-FR')} FCFA`, 'Revenu']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#f97316"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Tenants */}
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                Répartition par Restaurant
                            </h3>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byTenant} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#292524' }}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [`${val?.toLocaleString('fr-FR')} FCFA`, 'Total Payé']}
                                    />
                                    <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={20}>
                                        {data.byTenant.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table (Surgery level) */}
                <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">Analyse Comparative</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400 tracking-widest px-2">Source</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400 tracking-widest px-2">Volume</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400 tracking-widest px-2">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {data.byTenant.map((tenant, idx) => {
                                    const percentage = Math.round((tenant.total / data.lifetime.total) * 100);
                                    return (
                                        <tr key={idx} className="group hover:bg-stone-50/50 transition-colors">
                                            <td className="py-4 px-2">
                                                <span className="text-sm font-bold text-stone-900">{tenant.name}</span>
                                            </td>
                                            <td className="py-4 px-2">
                                                <span className="text-sm font-bold text-stone-600">{tenant.total.toLocaleString('fr-FR')} FCFA</span>
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-orange-500 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-stone-400">{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
