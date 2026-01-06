import { useState, useEffect, useRef } from 'react';
import { useFetch } from '../../lib/useFetch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, Calendar, TrendingUp, DollarSign, ShoppingBag, Utensils, ArrowUpRight, Lightbulb } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

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

    // State for modals and expanded views
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const dailyTableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        refetch();
    }, [startDate, endDate]);

    // Generate insights based on data
    const generateInsights = () => {
        const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = [];
        
        if (stats?.charts?.topItems?.[0]) {
            const topItem = stats.charts.topItems[0];
            insights.push({
                type: 'success',
                message: `🌟 "${topItem.name}" est votre best-seller avec ${topItem.quantity} ventes. Mettez-le en avant !`
            });
        }
        
        if (stats?.charts?.revenueByType) {
            const dineIn = stats.charts.revenueByType.find((t: any) => t.type === 'Sur place');
            const takeout = stats.charts.revenueByType.find((t: any) => t.type === 'À emporter');
            if (dineIn && takeout) {
                const dineInPercent = Math.round((dineIn.revenue / (dineIn.revenue + takeout.revenue)) * 100);
                insights.push({
                    type: 'info',
                    message: `🍽️ ${dineInPercent}% du CA provient du service en salle. ${dineInPercent < 50 ? 'Pensez à promouvoir l\'expérience sur place.' : ''}`
                });
            }
        }
        
        if (stats?.kpi?.avgOrder) {
            const avg = stats.kpi.avgOrder;
            insights.push({
                type: avg > 5000 ? 'success' : 'warning',
                message: `💰 Panier moyen : ${formatCurrency(avg)}. ${avg < 5000 ? 'Proposez des formules/menus pour l\'augmenter.' : 'Excellent panier moyen !'}`
            });
        }
        
        return insights;
    };

    const handleScrollToDaily = () => {
        dailyTableRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                 {/* Margin Simulator Card - Premium Dark */}
                 <div className="relative overflow-hidden p-4 rounded-xl shadow-lg bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border border-stone-700/50 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    {/* Decorative Elements */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
                            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">Marge Estimée (70%)</p>
                            <h3 className="text-lg font-black text-white tracking-tight truncate">{formatCurrency((stats?.kpi?.totalRevenue || 0) * 0.7)}</h3>
                        </div>
                    </div>
                    
                    <div className="relative z-10 mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                        Basé sur coût matière standard
                    </div>
                 </div>
            </div>

            {/* Main Chart: Revenue Evolution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Évolution du Chiffre d'Affaires</h3>
                        <button 
                            onClick={() => setIsDetailsModalOpen(true)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                        >
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
                 <div ref={dailyTableRef} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Détail Journalier</h3>
                        <button 
                            onClick={handleScrollToDaily}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider flex items-center gap-1"
                        >
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

            {/* Insights Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-amber-900">Conseils Manager</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generateInsights().map((insight, i) => (
                        <div 
                            key={i} 
                            className={`p-4 rounded-lg border ${
                                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                            }`}
                        >
                            <p className={`text-sm font-medium ${
                                insight.type === 'success' ? 'text-green-800' :
                                insight.type === 'warning' ? 'text-yellow-800' :
                                'text-blue-800'
                            }`}>
                                {insight.message}
                            </p>
                        </div>
                    ))}
                    {generateInsights().length === 0 && (
                        <p className="text-amber-700 italic col-span-3 text-center">Pas assez de données pour générer des conseils.</p>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Détail de l'évolution">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3">Évolution jour par jour du chiffre d'affaires sur la période sélectionnée.</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-600">Commandes</th>
                                <th className="px-4 py-3 text-right font-bold text-gray-600">Revenu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(stats?.charts?.dailyRevenue || []).slice().reverse().map((day: any) => (
                                <tr key={day.date} className="hover:bg-blue-50">
                                    <td className="px-4 py-3 font-medium">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{day.count}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(day.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, textColor, bgClassName, gradient }: any) {
    return (
        <div className={`relative overflow-hidden p-4 rounded-xl shadow-md border border-gray-100 flex items-center gap-3 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${gradient || 'bg-white'}`}>
            {/* Icon */}
            <div className={`relative z-10 w-11 h-11 ${bgClassName} ${textColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300`}>
                <Icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex-1 min-w-0">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-lg font-black text-gray-900 tracking-tight truncate">{value}</h3>
            </div>
        </div>
    );
}
