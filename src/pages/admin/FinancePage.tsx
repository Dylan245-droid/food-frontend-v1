import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, Calendar, TrendingUp, DollarSign, ShoppingBag, Utensils, ArrowUpRight } from 'lucide-react';

// Utility for currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'FCFA');
};



export default function FinancePage() {
    // Dates: Default to start of current month
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const { data: stats, loading, refetch } = useFetch<any>(`/admin/finance/stats?startDate=${startDate}&endDate=${endDate}`);

    useEffect(() => {
        refetch();
    }, [startDate, endDate]);

    if(loading && !stats) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        Tableau de Bord Financier
                    </h1>
                    <p className="text-gray-500">Suivi détaillé des performances</p>
                </div>
                
                {/* Date Filters */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Période :</span>
                    </div>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-gray-400">à</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <KpiCard 
                    title="Chiffre d'Affaires" 
                    value={formatCurrency(stats?.kpi?.totalRevenue || 0)}
                    icon={DollarSign}
                    color="bg-green-500"
                    textColor="text-green-600"
                    bgClassName="bg-green-50"
                 />
                 <KpiCard 
                    title="Nombre de Commandes" 
                    value={stats?.kpi?.totalOrders || 0}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    textColor="text-blue-600"
                    bgClassName="bg-blue-50"
                 />
                 <KpiCard 
                    title="Panier Moyen" 
                    value={formatCurrency(stats?.kpi?.averageTicket || 0)}
                    icon={Utensils}
                    color="bg-purple-500"
                    textColor="text-purple-600"
                    bgClassName="bg-purple-50"
                 />
                 {/* Margin Simulator Card */}
                 <div className="bg-stone-900 p-6 rounded-xl shadow-lg border border-stone-800 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign className="w-24 h-24 text-white" />
                    </div>
                    <div>
                        <p className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-1">Marge Estimée (70%)</p>
                        <h3 className="text-3xl font-black text-white">{formatCurrency((stats?.kpi?.totalRevenue || 0) * 0.7)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Basé sur coût matière standard
                    </div>
                 </div>
            </div>

            {/* Main Chart: Revenue Evolution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Évolution du Chiffre d'Affaires</h3>
                        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
                            Voir détails
                        </button>
                    </div>
                    <div className="h-[350px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.charts?.dailyRevenue || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                    tick={{fontSize: 12, fill: '#6b7280'}}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tickFormatter={(val) => `${val/1000}k`}
                                    tick={{fontSize: 12, fill: '#6b7280'}}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    formatter={(value: any) => formatCurrency(value)}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#2563eb" 
                                    strokeWidth={4} 
                                    dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}}
                                    activeDot={{r: 8}} 
                                    animationDuration={1500}
                                />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Répartition par Type</h3>
                    <div className="flex-1 h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.charts?.revenueByType || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="revenue"
                                    nameKey="type"
                                >
                                    {(stats?.charts?.revenueByType || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.type === 'Sur place' ? '#f97316' : '#9333ea'} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {(!stats?.charts?.revenueByType || stats?.charts?.revenueByType.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm italic">
                                Pas de données
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Top Items & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Top Selling Items */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top Plats (Chiffre d'Affaires)</h3>
                    <div className="space-y-4">
                        {(stats?.charts?.topItems || []).slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2 px-2">
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {i+1}
                                    </span>
                                    <div>
                                        <div className="font-bold text-gray-700 group-hover:text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.category}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">{formatCurrency(item.revenue)}</div>
                                    <div className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block">{item.quantity} ventes</div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Detailed Daily Table (Mini) */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Détail Journalier</h3>
                        <button className="text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Voir tout
                        </button>
                    </div>
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg font-bold">Date</th>
                                    <th className="px-4 py-3 font-bold">Cmds</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg font-bold">Revenu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(stats?.charts?.dailyRevenue || []).slice().reverse().map((day: any) => (
                                    <tr key={day.date} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-gray-700 group-hover:text-blue-700">{new Date(day.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{day.count}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(day.revenue)}</td>
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

function KpiCard({ title, value, icon: Icon, textColor, bgClassName }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">{value}</h3>
            </div>
            <div className={`w-14 h-14 ${bgClassName} ${textColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    );
}
