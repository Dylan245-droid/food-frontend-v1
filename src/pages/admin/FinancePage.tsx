// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Loader2, Calendar, TrendingUp, DollarSign, ShoppingBag, Utensils, ArrowUpRight, Clock, CreditCard, PieChart as PieIcon, Calculator, Receipt } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { FinancialReportPrintable } from '../../components/FinancialReportPrintable';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

import { formatCurrency } from '../../lib/utils';

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

    if (loading && !stats) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Erreur de chargement des statistiques.</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* The Portal Report (Hidden until print) */}
            <FinancialReportPrintable 
                stats={stats} 
                startDate={startDate} 
                endDate={endDate} 
                branding={branding} 
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        Tableau de Bord Financier
                    </h1>
                    <p className="text-gray-500">Analysez vos performances et revenus.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-none text-sm focus:ring-0 text-gray-600"
                    />
                    <span className="text-gray-300">|</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-none text-sm focus:ring-0 text-gray-600"
                    />
                     <button 
                        onClick={handlePrintRequest}
                        className="ml-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded hover:bg-black transition-colors"
                    >
                        IMPRIMER RAPPORT
                    </button>
                </div>
            </div>

            {/* Main KPIs Row */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-24 h-24 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Chiffre d'Affaires (TTC)</p>
                        <h3 className="text-3xl font-black text-gray-900">{formatCurrency(stats.kpi.totalRevenue)}</h3>
                        <div className="mt-4 flex items-center text-xs text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            Global
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShoppingBag className="w-24 h-24 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-orange-600 mb-1">Total Commandes</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.kpi.totalOrders}</h3>
                        <p className="text-xs text-gray-400 mt-2">Sur la période sélectionnée</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Utensils className="w-24 h-24 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-purple-600 mb-1">Panier Moyen</p>
                        <h3 className="text-3xl font-black text-gray-900">{formatCurrency(stats.kpi.averageTicket)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Dépense moyenne par client</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Vue Comptable & Aperçu
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`${activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <PieIcon className="w-4 h-4" />
                        Produits & Ventes
                    </button>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={`${activeTab === 'trends' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Clock className="w-4 h-4" />
                        Tendances
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            {stats && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Accounting Cards (HT / TVA) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                        <Calculator className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Total Hors Taxe (HT)</p>
                                        <p className="text-xl font-black text-gray-900">{formatCurrency(totalHT)}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                        <Receipt className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">TVA Estimée (18%)</p>
                                        <p className="text-xl font-black text-gray-900">{formatCurrency(totalTax)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sales By Type (Sur Place vs Emporter) */}
                             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-gray-400" />
                                    Répartition par Type de Commande
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {stats.charts.revenueByType?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-bold text-gray-900">{item.type}</p>
                                                <p className="text-xs text-gray-500">{item.count} commandes</p>
                                            </div>
                                            <p className="font-mono font-bold text-blue-600">{formatCurrency(item.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Évolution du Chiffre d'Affaires Journalier</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.charts.dailyRevenue}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#9ca3af', fontSize: 12} as any}
                                            tickFormatter={(val: any) => new Date(val).toLocaleDateString(undefined, {day: '2-digit', month: 'short'})}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#9ca3af', fontSize: 12} as any}
                                            tickFormatter={(val: any) => `${val/1000}k`}
                                        />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: any) => [formatCurrency(val), "Revenu"]}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* TAB: PRODUCTS */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Items - Bar Chart */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top 10 Articles (Graphique)</h3>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart layout="vertical" data={stats.charts.topItems} margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11} as any} />
                                            <Tooltip formatter={(val: any) => [val, "Vendus"]} />
                                            <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Revenue by Category - Pie */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenus par Catégorie</h3>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <PieChart>
                                            <Pie
                                                data={stats.charts.salesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="revenue"
                                            >
                                                {stats.charts.salesByCategory?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* Detailed Top Items Table */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900">Détails des Ventes (Top Articles)</h3>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium">
                                        <tr>
                                            <th className="p-4">Article</th>
                                            <th className="p-4">Catégorie</th>
                                            <th className="p-4 text-right">Quantité</th>
                                            <th className="p-4 text-right">Revenu Généré</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stats.charts.topItems?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="p-4 text-gray-500">{item.category}</td>
                                                <td className="p-4 text-right font-mono">{item.quantity}</td>
                                                <td className="p-4 text-right font-bold text-blue-600">{formatCurrency(item.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: TRENDS */}
                    {activeTab === 'trends' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hourly Traffic */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Affluence Horaire (Commandes)</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={stats.charts.hourlyTraffic}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="hour" tickFormatter={(val: any) => `${val}h`} />
                                        <YAxis />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[400px]">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Méthodes de Paiement</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <PieChart>
                                        <Pie
                                            data={stats.charts.paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            dataKey="total"
                                            label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                                        >
                                            {stats.charts.paymentMethods?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
