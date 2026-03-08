import { useState, useEffect } from 'react';
import { Button } from "../../components/ui/Button";
import {
    Users, DollarSign, Activity, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'sonner';

// Recharts for graphs
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell
} from 'recharts';

export default function SuperAdminDashboard() {
    useAuth(); // keep hook if it triggers redirect on no auth, otherwise remove if wholly unused. Wait, let's just remove user.
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for speed
            const [statsRes, tenantsRes] = await Promise.all([
                api.get('/super-admin/stats'),
                api.get('/super-admin/tenants')
            ]);

            setStats(statsRes.data);
            setTenants(tenantsRes.data.data);
        } catch (error) {
            console.error("Dashboard error:", error);
            toast.error("Erreur de chargement du dashboard");
        } finally {
            setLoading(false);
        }
    };

    const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/super-admin/tenants/${id}/toggle-status`);
            toast.success(`Restaurant ${currentStatus ? 'désactivé' : 'activé'}`);
            fetchData(); // Refresh
        } catch (error) {
            toast.error("Opération échouée");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement des données financières...</div>;

    // Prepare chart data from stats
    const planData = stats ? [
        { name: 'Essai', value: stats.subscriptions.TRIAL, color: '#facc15' }, // Yellow
        { name: 'Essentiel', value: stats.subscriptions.ESSENTIAL, color: '#60a5fa' }, // Blue
        { name: 'Pro', value: stats.subscriptions.PRO, color: '#f97316' }, // Orange
        { name: 'Élite', value: stats.subscriptions.ELITE, color: '#a855f7' } // Purple
    ] : [];

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vue D'Ensemble</h1>
                    <p className="text-slate-500">Pilotage de la plateforme & Revenus</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={fetchData}>Actualiser</Button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden p-6">
                    <div className="pb-2 text-sm text-slate-500">Revenu Mensuel (MRR)</div>
                    <div className="text-3xl font-black text-slate-800 flex items-center gap-1">
                        {stats?.financials.mrr.toLocaleString()} <span className="text-sm text-slate-400 font-medium">FCFA</span>
                    </div>
                    <div className="absolute right-4 top-4 opacity-10">
                        <DollarSign className="w-16 h-16 text-green-600" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden p-6">
                    <div className="pb-2 text-sm text-slate-500">Restaurants Actifs</div>
                    <div className="text-3xl font-black text-slate-800">
                        {stats?.tenants.active} <span className="text-sm text-slate-400 font-normal">/ {stats?.tenants.total}</span>
                    </div>
                    <div className="absolute right-4 top-4 opacity-10">
                        <Activity className="w-16 h-16 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden p-6">
                    <div className="pb-2 text-sm text-slate-500">Churn (Inactifs)</div>
                    <div className="text-3xl font-black text-slate-800 text-red-500">
                        {stats?.tenants.inactive}
                    </div>
                    <div className="absolute right-4 top-4 opacity-10">
                        <ShieldAlert className="w-16 h-16 text-red-600" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl relative overflow-hidden p-6">
                    <div className="pb-2 text-sm text-slate-500">Utilisateurs Totaux</div>
                    <div className="text-3xl font-black text-slate-800">
                        {stats?.users}
                    </div>
                    <div className="absolute right-4 top-4 opacity-10">
                        <Users className="w-16 h-16 text-slate-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col">
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">Répartition des Offres</h3>
                        <p className="text-sm text-slate-500">Ventilation du parc client par abonnement</p>
                    </div>
                    <div className="h-64 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {planData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tenant List Section */}
                <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">Détails des Restaurants</h3>
                        <p className="text-sm text-slate-500">Liste exhaustive des tenants et leur statut</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Restaurant</th>
                                    <th className="px-6 py-3">Propriétaire</th>
                                    <th className="px-6 py-3">Offre</th>
                                    <th className="px-6 py-3">Statut</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenants.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {t.name}
                                            <div className="text-xs text-slate-400 font-normal">{t.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {t.owner?.fullName || 'N/A'}
                                            <div className="text-xs text-slate-400">{t.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border uppercase tracking-wider">
                                                Standard
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.isActive ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Actif</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Inactif</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleTenantStatus(t.id, t.isActive)}
                                                className={t.isActive ? "text-red-500 hover:text-red-700 hover:bg-red-50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}
                                            >
                                                {t.isActive ? "Désactiver" : "Activer"}
                                            </Button>
                                        </td>
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
