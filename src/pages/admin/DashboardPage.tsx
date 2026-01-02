import { useFetch } from '../../lib/useFetch';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: stats, loading, error } = useFetch<any>('/staff/orders/stats');

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" /></div>;
  if (error) return <div className="text-red-500 p-6">Erreur de chargement des statistiques.</div>;

  return (
    <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Loader2 className="w-24 h-24 text-blue-600" />
                </div>
                <div>
                   <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">En cours</h3>
                   <p className="text-4xl font-black text-gray-900 mt-1">{stats?.pending + stats?.inProgress || 0}</p>
                </div>
                <div className="flex gap-2 text-xs font-bold relative z-10">
                    <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded flex items-center gap-1">
                        ● {stats?.pending} Attente
                    </span>
                    <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                        ● {stats?.inProgress} Prépa
                    </span>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-24 h-24 bg-green-600 rounded-full" /> 
                </div>
                <div>
                   <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Commandes du Jour</h3>
                   <p className="text-4xl font-black text-gray-900 mt-1">{stats?.deliveredToday || 0}</p>
                </div>
                <div className="text-xs text-green-600 font-medium">
                    Inclus service et payées
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg border border-gray-800 flex flex-col justify-between h-32 text-white relative overflow-hidden">
                 <div className="absolute right-0 top-0 p-4 opacity-10">
                    <div className="w-24 h-24 bg-white rounded-full" />
                 </div>
                <div>
                   <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Chiffre d'Affaires</h3>
                   <p className="text-4xl font-black text-white mt-1">{stats?.totalRevenueFormatted || '0 FCFA'}</p>
                </div>
                <div className="text-xs text-green-400 font-bold">
                    + Encaissements validés
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Activité par Heure</h3>
                <div className="h-[300px] w-full">
                    {stats?.chartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData.filter((d: any) => d.revenue > 0 || (parseInt(d.hour) >= 8 && parseInt(d.hour) <= 23))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="hour" 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tickFormatter={(value: any) => `${value}`}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f3f4f6'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    fill="#111827" 
                                    radius={[4, 4, 0, 0]} 
                                    name="Chiffre d'affaires (FCFA)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 italic">
                            Données insufisantes
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}
