// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Loader2, Calendar, TrendingUp, DollarSign, ShoppingBag, Utensils, ArrowUpRight, Clock, CreditCard, PieChart as PieIcon, Calculator, Receipt, FileText, ChevronRight } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { FinancialReportPrintable } from '../../components/FinancialReportPrintable';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// Colors (Refined for Stone theme)
const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#a8a29e'];

import { formatCurrency, cn } from '../../lib/utils';

export default function FinancePage() {
    const { branding } = useBranding();

    // State
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // Start of month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'trends'>('overview');

    // Fetch Stats
    const { data: statsData, loading, error } = useFetch<any>(`/admin/finance/stats?startDate=${startDate}&endDate=${endDate}`);
    const stats = statsData;

    const handlePrintRequest = () => {
        window.print();
    };

    // Derived Accounting Stats
    const totalTTC = stats?.kpi?.totalRevenue || 0;
    const totalHT = totalTTC / 1.18;
    const totalTax = totalTTC - totalHT;

    if (loading && !stats) return (
        <div className="h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-stone-300 w-10 h-10" />
                <p className="text-stone-400 font-bold text-sm tracking-widest uppercase">Analyse des finances...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 text-center">
            <p className="font-black uppercase tracking-widest">Erreur de chargement</p>
            <p className="text-sm mt-2 font-medium opacity-70">Impossible de récupérer les statistiques financières.</p>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Comptabilité', icon: TrendingUp },
        { id: 'products', label: 'Ventes Produits', icon: PieIcon },
        { id: 'trends', label: 'Tendances', icon: Clock },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* The Portal Report (Hidden until print) */}
            <FinancialReportPrintable
                stats={stats}
                startDate={startDate}
                endDate={endDate}
                branding={branding}
            />

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-4 sm:p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none"></div>
                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <LineChart className="w-5 h-5 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base xs:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Finance & Insights</h1>
                        <p className="text-[10px] md:text-sm font-bold mt-2 truncate tracking-wide uppercase text-stone-400">Rapports financiers et performance</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-xs flex-1">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-black focus:ring-0 text-stone-800 p-0 w-full"
                            />
                        </div>
                        <div className="w-4 h-[1px] bg-stone-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-xs flex-1">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-xs font-black focus:ring-0 text-stone-800 p-0 w-full"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handlePrintRequest}
                        className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                    >
                        <FileText className="w-4 h-4" />
                        Exporter Rapport
                    </button>
                </div>
            </div>

            {/* Premium KPIs Row - Surgical Responsive Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Revenue Card (Matches Dashboard Home) */}
                    <div
                        className="p-6 md:p-8 rounded-[2rem] text-white relative overflow-hidden group shadow-2xl shadow-blue-500/10"
                        style={{ background: 'var(--gradient-brand)' }}
                    >
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-6 backdrop-blur-md">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-1">Chiffre d'Affaires (TTC)</p>
                            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{formatCurrency(stats.kpi.totalRevenue)}</h3>
                            <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                                <TrendingUp className="w-3 h-3 text-green-300" />
                                + {((stats.charts.dailyRevenue?.[stats.charts.dailyRevenue.length - 1]?.revenue || 0) / (stats.kpi.totalRevenue || 1) * 100).toFixed(1)}% aujourd'hui
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                            <ShoppingBag className="w-32 h-32 text-stone-900" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-6">
                            <ShoppingBag className="w-6 h-6 text-stone-900" />
                        </div>
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Volume de ventes</p>
                        <h3 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tighter leading-none">{stats.kpi.totalOrders} <span className="text-xs uppercase text-stone-300 tracking-widest align-middle ml-1">Orders</span></h3>
                        <p className="text-[11px] text-stone-400 font-bold mt-6 flex items-center gap-2 tracking-wide uppercase">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_6px_rgba(251,146,60,0.4)]"></span>
                            Sur la période filtrée
                        </p>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                        <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                            <Utensils className="w-32 h-32 text-stone-900" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-6">
                            <Utensils className="w-6 h-6 text-stone-900" />
                        </div>
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Panier Moyen</p>
                        <h3 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tighter leading-none">{formatCurrency(stats.kpi.averageTicket)}</h3>
                        <p className="text-[11px] text-stone-400 font-bold mt-6 tracking-wide uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_6px_rgba(129,140,248,0.4)]"></span>
                            Intelligence de dépense client
                        </p>
                    </div>
                </div>
            )}

            {/* Surgical Tabs - High end Animated Pill */}
            <div className="sticky top-20 z-30 flex justify-center py-2">
                <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 flex gap-1 overflow-x-auto premium-scrollbar max-w-[calc(100vw-2rem)] sm:max-w-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-stone-900 text-white shadow-lg shadow-stone-200 translate-y-[-1px]"
                                    : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                            )}
                        >
                            <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-orange-400" : "text-stone-300")} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Minimalist & Breathable */}
            {stats && (
                <div className="animate-in slide-in-from-bottom-6 duration-700">

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Accounting Cards - Double trouble */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-900 p-6 md:p-8 rounded-[2rem] border border-stone-800 shadow-2xl shadow-stone-900/10 flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                                            <Calculator className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Base Hors Taxe (HT)</p>
                                            <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">{formatCurrency(totalHT)}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-stone-500 transition-colors hidden sm:block" />
                                </div>

                                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 shrink-0">
                                            <Receipt className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">Contribution Fiscale (TVA 18%)</p>
                                            <p className="text-2xl md:text-3xl font-black text-stone-900 tracking-tighter">{formatCurrency(totalTax)}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-stone-200 group-hover:text-stone-400 transition-colors hidden sm:block" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Chart - Takes 2/3 */}
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm lg:col-span-2 flex flex-col h-[480px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em]">Flux de Trésorerie</h3>
                                        <div className="flex gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-stone-100"></span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.charts.dailyRevenue}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={branding.primaryColor || '#f97316'} stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor={branding.primaryColor || '#f97316'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#a8a29e', fontSize: 11, fontWeight: 700 } as any}
                                                    tickFormatter={(val: any) => new Date(val).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#a8a29e', fontSize: 11, fontWeight: 700 } as any}
                                                    tickFormatter={(val: any) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: '1px solid #f5f5f4',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                                        padding: '12px 16px',
                                                    }}
                                                    formatter={(val: any) => [formatCurrency(val), "Encaissements"]}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke={branding.primaryColor || '#f97316'} strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Sales By Type - Mobile Surgical Card view */}
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col overflow-hidden">
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] mb-8">Canaux de Vente</h3>
                                    <div className="space-y-4 flex-1">
                                        {stats.charts.revenueByType?.map((item: any, idx: number) => {
                                            const typeColors = {
                                                'dine_in': 'bg-orange-500',
                                                'takeout': 'bg-indigo-500',
                                                'delivery': 'bg-blue-500'
                                            };
                                            const typeLabel = item.type === 'dine_in' ? 'Sur Place' : item.type === 'takeout' ? 'Emporter' : 'Livraison';

                                            return (
                                                <div key={idx} className="bg-stone-50/50 p-5 rounded-3xl border border-stone-100 transition-all hover:bg-stone-50 group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-3 items-center">
                                                            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", typeColors[item.type] || 'bg-stone-400')}></div>
                                                            <p className="text-xs font-black text-stone-900 uppercase tracking-widest">{typeLabel}</p>
                                                        </div>
                                                        <span className="text-[10px] font-black text-stone-300 uppercase shrink-0">{item.count} CMD</span>
                                                    </div>
                                                    <p className="text-xl font-black text-stone-900 tracking-tighter">{formatCurrency(item.revenue)}</p>
                                                    <div className="mt-4 w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full transition-all duration-1000", typeColors[item.type] || 'bg-stone-400')}
                                                            style={{ width: `${(item.revenue / stats.kpi.totalRevenue * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PRODUCTS - Surgical Layout */}
                    {activeTab === 'products' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Top Items - Bar Chart */}
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm h-[480px] flex flex-col">
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] mb-8">Performance Catalogue</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={stats.charts.topItems} margin={{ left: 20, right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f4" />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={100}
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' } as any}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #f5f5f4' }}
                                                    formatter={(val: any) => [val, "Unités"]}
                                                />
                                                <Bar
                                                    dataKey="quantity"
                                                    fill="#1c1917"
                                                    radius={[2, 6, 6, 2]}
                                                    barSize={16}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Revenue by Category - Pie */}
                                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm h-[480px] flex flex-col">
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] mb-8">Répartition Catégories</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.charts.salesByCategory}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={8}
                                                    dataKey="revenue"
                                                    stroke="none"
                                                >
                                                    {stats.charts.salesByCategory?.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none' }}
                                                    formatter={(val: any) => formatCurrency(val)}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    align="center"
                                                    iconType="circle"
                                                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Top Items Table - RE-IMAGINED AS CARDS ON MOBILE */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-stone-50">
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em]">Listing des Meilleures Ventes</h3>
                                </div>
                                <div className="overflow-x-auto hidden md:block">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-stone-50/50 text-stone-400">
                                            <tr>
                                                <th className="p-6 font-black uppercase tracking-widest text-[10px]">Article</th>
                                                <th className="p-6 font-black uppercase tracking-widest text-[10px]">Catégorie</th>
                                                <th className="p-6 text-right font-black uppercase tracking-widest text-[10px]">Quantité</th>
                                                <th className="p-6 text-right font-black uppercase tracking-widest text-[10px]">Revenu Généré</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-50 font-medium">
                                            {stats.charts.topItems?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                                                    <td className="p-6 font-black text-stone-900 group-hover:text-stone-600">{item.name}</td>
                                                    <td className="p-6">
                                                        <span className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500">{item.category}</span>
                                                    </td>
                                                    <td className="p-6 text-right font-black text-stone-400">{item.quantity}</td>
                                                    <td className="p-6 text-right font-black text-stone-900">{formatCurrency(item.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Grid view (Surgery) */}
                                <div className="md:hidden grid grid-cols-1 divide-y divide-stone-50">
                                    {stats.charts.topItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="p-6 flex justify-between items-center group active:bg-stone-50 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-black text-stone-900 uppercase text-xs truncate mb-1">{item.name}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{item.category} • {item.quantity} vendus</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-black text-stone-900 text-sm tracking-tight">{formatCurrency(item.revenue)}</p>
                                                <div className="w-full h-1 bg-gradient-to-r from-transparent to-stone-200 mt-1 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: TRENDS - Surgical Heatmaps */}
                    {activeTab === 'trends' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Hourly Traffic - Dark Mode styled */}
                            <div className="bg-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-900/10 h-[480px] flex flex-col border border-stone-800">
                                <h3 className="text-sm font-black text-stone-500 uppercase tracking-[0.2em] mb-8">Intensité Horaire</h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.charts.hourlyTraffic}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#292524" />
                                            <XAxis
                                                dataKey="hour"
                                                tickFormatter={(val: any) => `${val}h`}
                                                tick={{ fill: '#57534e', fontSize: 10, fontWeight: 800 } as any}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: '#57534e', fontSize: 10, fontWeight: 800 } as any}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                contentStyle={{ borderRadius: '16px', backgroundColor: '#1c1917', border: '1px solid #292524', color: 'white' }}
                                                itemStyle={{ color: 'white' }}
                                            />
                                            <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payment Methods - High fidelity Pie */}
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm h-[480px] flex flex-col">
                                <h3 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] mb-8">Modes d'Encaissement</h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.charts.paymentMethods}
                                                cx="50%"
                                                cy="45%"
                                                outerRadius={130}
                                                dataKey="total"
                                                stroke="none"
                                            >
                                                {stats.charts.paymentMethods?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none' }}
                                                formatter={(val: any) => formatCurrency(val)}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                align="center"
                                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
