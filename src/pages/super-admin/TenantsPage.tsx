
import { useState, useEffect } from 'react';
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
    Search, Power, ExternalLink, Calendar,
    AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data);
        } catch (error) {
            toast.error("Impossible de charger les tenants");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            await api.patch(`/super-admin/tenants/${id}/toggle-status`);
            toast.success("Statut mis à jour");
            fetchTenants();
        } catch (error) {
            toast.error("Erreur mise à jour statut");
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.owner?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPlanBadge = (plan: string) => {
        const p = plan?.toUpperCase();
        switch (p) {
            case 'ELITE': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Élite</span>;
            case 'PRO': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">Pro</span>;
            case 'ESSENTIAL': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Essentiel</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">Essai</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tenants Inscrits</h1>
                    <p className="text-slate-500 mt-1">Gérez les accès, abonnements et facturation.</p>
                </div>
                <Button onClick={fetchTenants} variant="outline" size="sm">Actualiser</Button>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Rechercher un tenant, email ou slug..."
                            className="pl-10 h-10 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[1000px]">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold">Tenant</th>
                                <th className="px-6 py-4 font-bold">Abonnement</th>
                                <th className="px-6 py-4 font-bold">Paiement</th>
                                <th className="px-6 py-4 font-bold">Revenus</th>
                                <th className="px-6 py-4 font-bold">Prochaine Échéance</th>
                                <th className="px-6 py-4 font-bold text-center">Activité</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredTenants.map((t) => {
                                const isTrial = t.subscription.plan === 'TRIAL';
                                const expiryDate = isTrial ? t.subscription.trialEndsAt : t.subscription.subscriptionEndsAt;
                                const isExpired = expiryDate && new Date(expiryDate) < new Date();

                                return (
                                    <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                {t.name}
                                                {!t.isActive && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">INACTIF</span>}
                                            </div>
                                            <a href={`/r/${t.slug}`} target="_blank" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-0.5">
                                                /r/{t.slug} <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <div className="text-xs text-slate-400 mt-1">{t.owner?.fullName} ({t.owner?.email})</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {getPlanBadge(t.subscription.plan)}

                                                {/* Status Badges based on reality (Dates + Status) */}
                                                {t.subscription.status === 'SUSPENDED' ? (
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold border border-red-200">
                                                        Suspendu
                                                    </span>
                                                ) : t.subscription.status === 'PAST_DUE' ? (
                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">
                                                        Paiement en retard
                                                    </span>
                                                ) : isExpired ? (
                                                    isTrial ? (
                                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium border border-yellow-200">
                                                            Fin d'essai
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">
                                                            Expiré
                                                        </span>
                                                    )
                                                ) : isTrial ? (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium border border-blue-100">
                                                        En essai
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start text-xs">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    {t.subscription.paymentMethod === 'FIAFIO_MANDATE' ? 'Fiafio' : 'Manuel'}
                                                </div>
                                                {t.subscription.paymentMethod === 'FIAFIO_MANDATE' && (
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                                        t.subscription.fiafioMandateStatus === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-100" :
                                                            t.subscription.fiafioMandateStatus === 'PENDING' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                "bg-red-50 text-red-700 border-red-100"
                                                    )}>
                                                        {t.subscription.fiafioMandateStatus}
                                                    </span>
                                                )}
                                                {t.subscription.failedRenewalAttempts > 0 && (
                                                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Retry {t.subscription.failedRenewalAttempts}/3
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-slate-700 font-medium">
                                                {t.subscription.plan === 'ESSENTIAL' && '35 000 F'}
                                                {t.subscription.plan === 'PRO' && '65 000 F'}
                                                {t.subscription.plan === 'ELITE' && '150 000 F'}
                                                {t.subscription.plan === 'TRIAL' && '-'}
                                                {!['ESSENTIAL', 'PRO', 'ELITE', 'TRIAL'].includes(t.subscription.plan) && '-'}
                                            </div>
                                            <div className="text-xs text-slate-400">/ mois</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expiryDate ? (
                                                <div className={`flex flex-col gap-1`}>
                                                    <div className={`flex items-center gap-2 ${isExpired || t.subscription.status === 'SUSPENDED' || t.subscription.status === 'PAST_DUE' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {format(new Date(expiryDate), 'dd MMM yyyy', { locale: fr })}
                                                        {(isExpired || t.subscription.status === 'SUSPENDED') && <AlertCircle className="w-4 h-4" />}
                                                    </div>
                                                    {t.subscription.pastDueSince && (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="text-[10px] text-orange-600 font-bold">
                                                                En retard depuis le {format(new Date(t.subscription.pastDueSince), 'dd MMM', { locale: fr })}
                                                            </div>
                                                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        t.subscription.status === 'SUSPENDED' ? "bg-red-500 w-full" : "bg-orange-500"
                                                                    )}
                                                                    style={{
                                                                        width: t.subscription.status === 'SUSPENDED' ? '100%' : `${Math.min((new Date().getTime() - new Date(t.subscription.pastDueSince).getTime()) / (14 * 24 * 60 * 60 * 1000) * 100, 100)}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="text-[9px] text-slate-400 font-medium text-right">
                                                                {Math.floor((new Date().getTime() - new Date(t.subscription.pastDueSince).getTime()) / (24 * 60 * 60 * 1000))} / 14 jours
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-bold text-slate-900">{t.ordersCount}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Commandes</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => window.open(`/r/${t.slug}`, '_blank')}>
                                                    <ExternalLink className="h-4 w-4 text-slate-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleStatus(t.id)}
                                                    className={t.isActive ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTenants.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Aucun tenant trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
