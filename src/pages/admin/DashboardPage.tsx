import { useFetch } from '../../lib/useFetch';
import { useBranding } from '../../context/BrandingContext';
import { Loader2, TrendingUp, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';

export default function DashboardPage() {
  const { data: stats, loading, error } = useFetch<any>('/staff/orders/stats');
  const { branding } = useBranding();

  if (loading) return (
      <div className="flex justify-center p-24">
          <div className="animate-bounce flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
              <p className="text-stone-400 font-bold text-sm">Chargement des données...</p>
          </div>
      </div>
  );
  if (error) return <div className="text-red-500 p-6 bg-red-50 rounded-xl border border-red-100 text-center font-bold">Erreur de chargement des statistiques.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header>
             <h1 className="text-3xl font-black text-stone-900 mb-2 font-display">Vue d'ensemble</h1>
             <p className="text-stone-500">Bienvenue sur votre tableau de bord.</p>
        </header>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Orders Card */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-stone-100 flex flex-col h-40 relative overflow-hidden group hover:border-orange-200 transition-colors">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
                    <Loader2 className="w-24 h-24 text-blue-600" />
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                             <Loader2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-stone-500 text-xs font-bold uppercase tracking-wider">En cours</h3>
                   </div>
                   <p className="text-5xl font-black text-stone-900 mt-2 font-display tracking-tight">{stats?.pending + stats?.inProgress || 0}</p>
                </div>
                <div className="flex gap-2 text-xs font-bold relative z-10">
                    <span className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100 flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div> {stats?.pending} Attente
                    </span>
                    <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75"></div> {stats?.inProgress} Prépa
                    </span>
                </div>
            </div>
            
            {/* Daily Orders Card */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-stone-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:border-green-200 transition-colors">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
                    <ShoppingBag className="w-24 h-24 text-green-600" /> 
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-50 p-2 rounded-xl text-green-600">
                             <ShoppingBag className="w-5 h-5" />
                        </div>
                        <h3 className="text-stone-500 text-xs font-bold uppercase tracking-wider">Commandes du Jour</h3>
                   </div>
                   <p className="text-5xl font-black text-stone-900 mt-2 font-display tracking-tight">{stats?.deliveredToday || 0}</p>
                </div>
                <div className="text-xs text-green-600 font-bold bg-green-50 inline-block px-3 py-1 rounded-lg self-start border border-green-100 shadow-sm">
                    Inclus service et payées
                </div>
            </div>

            {/* Revenue Card - Themed */}
            <div 
              className="p-6 rounded-3xl shadow-xl flex flex-col justify-between h-40 text-white relative overflow-hidden group"
              style={{ background: 'var(--gradient-brand)' }}
            >
                 {/* Background decoration */}
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
                 
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/10 p-2 rounded-xl text-white">
                             <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires</h3>
                   </div>
                   <p className="text-4xl font-black text-white mt-1 font-display tracking-tight">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
                <div className="text-xs text-stone-300 font-medium relative z-10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    Encaissements validés aujourd'hui
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                        Activité par Heure
                    </h3>
                    <div className="text-xs font-medium text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">Aujourd'hui</div>
                </div>
                
                <div className="h-[300px] w-full">
                    {stats?.chartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData.filter((d: any) => d.revenue > 0 || (parseInt(d.hour) >= 8 && parseInt(d.hour) <= 23))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                <XAxis 
                                    dataKey="hour" 
                                    tick={{fontSize: 12, fill: '#a8a29e'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{fontSize: 12, fill: '#a8a29e'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tickFormatter={(value: any) => `${value}`}
                                />
                                <Tooltip 
                                    cursor={{fill: '#FFF8F3'}}
                                    contentStyle={{
                                        borderRadius: '16px', 
                                        border: '1px solid #e7e5e4', 
                                        boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)',
                                        padding: '12px',
                                        fontFamily: 'sans-serif'
                                    }}
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    fill={branding.primaryColor} 
                                    radius={[6, 6, 6, 6]} 
                                    name="Chiffre d'affaires (FCFA)"
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-stone-400 italic bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                            Données insufisantes pour le graphique
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}
