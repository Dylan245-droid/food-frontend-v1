// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { RotateCcw, Clock, ShieldCheck, User, Globe, Tag, ChevronLeft, ChevronRight, Loader2, LogIn, LogOut, Plus, Trash, PenTool, Database, Activity } from 'lucide-react';
import { cn, getImageUrl } from '../../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    details: any;
    ipAddress: string;
    createdAt: string;
    user: {
        fullName: string;
        email: string;
        avatarUrl?: string;
        avatar?: string;
    } | null;
}

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const { data, loading, refetch } = useFetch<{ meta: any, data: ActivityLog[] }>(`/super-admin/audit-logs?page=${page}&limit=20`);

    const formatAction = (action: string) => {
        const actions: Record<string, { label: string, color: string, icon: any }> = {
            'create': { label: 'Création', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Plus },
            'delete': { label: 'Suppression', color: 'bg-red-50 text-red-600 border-red-100', icon: Trash },
            'update': { label: 'Modification', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: PenTool },
            'login': { label: 'Connexion', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: LogIn },
            'logout': { label: 'Déconnexion', color: 'bg-stone-50 text-stone-600 border-stone-200', icon: LogOut },
        };
        return actions[action?.toLowerCase()] || { label: String(action), color: 'bg-stone-50 text-stone-600 border-stone-200', icon: Activity };
    };

    const renderDetails = (details: any) => {
        if (!details) return <span className="text-stone-300 italic text-[10px] uppercase font-bold tracking-widest">Aucune donnée tech.</span>;
        
        let parsed = details;
        if (typeof details === 'string') {
            try { parsed = JSON.parse(details); } catch(e) {}
        }
        
        if (typeof parsed !== 'object' || parsed === null) {
            return <div className="text-[10px] text-stone-500 font-bold truncate max-w-[200px]">{String(parsed)}</div>;
        }

        const keys = Object.keys(parsed);
        if (keys.length === 0) return <span className="text-stone-300 italic text-[10px] uppercase font-bold tracking-widest">Opération standard</span>;

        return (
            <div className="flex flex-col gap-1.5 max-w-[250px]">
                {keys.slice(0, 3).map(k => (
                    <div key={k} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider truncate">
                        <span className="text-stone-400 shrink-0">{k}:</span>
                        <span className="text-stone-700 truncate">{String(parsed[k])}</span>
                    </div>
                ))}
                {keys.length > 3 && <div className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-1">+{keys.length - 3} autres paramètres</div>}
            </div>
        );
    };

    const logs = data?.data || [];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 lg:px-8">

            {/* Premium Header */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Journal d'Audit</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Sécurité & Historique système • Traçabilité Totale
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 relative z-10 shrink-0">
                    <button
                        onClick={() => refetch()}
                        className="h-14 px-8 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Actualiser</span>
                    </button>
                </div>
            </div>

            {/* Invoices List - Premium Grouping */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto premium-scrollbar pb-4">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Chronologie</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Acteur</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Action</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Cible Affectée</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Détails Opérationnels</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-24 text-center"><Loader2 className="w-8 h-8 animate-spin text-stone-200 mx-auto" /></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="p-24 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest">Aucune activité enregistrée</td></tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={log.id} className="hover:bg-stone-50/50 transition-colors group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 20}ms` }}>
                                        <td className="p-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-stone-50 flex flex-col items-center justify-center border border-stone-100 shrink-0">
                                                    <span className="text-[10px] font-black">{format(new Date(log.createdAt), 'dd', { locale: fr })}</span>
                                                    <span className="text-[7px] uppercase font-bold tracking-widest text-stone-400">{format(new Date(log.createdAt), 'MMM', { locale: fr })}</span>
                                                </div>
                                                <div>
                                                    <div className="font-black text-stone-900 text-xs tracking-tight uppercase leading-none mb-1.5 pl-1">
                                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                                                    </div>
                                                    <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-stone-300" />
                                                        {format(new Date(log.createdAt), 'HH:mm', { locale: fr })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                {log.user?.avatarUrl || log.user?.avatar ? (
                                                    <img src={getImageUrl(log.user.avatarUrl || log.user.avatar)} alt={log.user.fullName} className="w-8 h-8 rounded-full border border-stone-200/50 object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200/50">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="font-black text-stone-800 text-xs uppercase tracking-tight truncate max-w-[120px]">{log.user?.fullName || 'SYSTÈME'}</div>
                                                    <div className="text-[9px] text-stone-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                                                        <Globe className="w-2.5 h-2.5" />
                                                        {log.ipAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {(() => {
                                                const actionFmt = formatAction(log.action);
                                                const Icon = actionFmt.icon;
                                                return (
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border",
                                                        actionFmt.color
                                                    )}>
                                                        <Icon className="w-3 h-3" />
                                                        {actionFmt.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg shrink-0">
                                                    <Database className="w-3 h-3" />
                                                </div>
                                                <span className="font-black text-stone-900 text-[11px] uppercase tracking-wide truncate">{log.entityType.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="text-[9px] text-stone-400 font-bold uppercase ml-7">Réf: <span className="text-stone-600">#{log.entityId}</span></div>
                                        </td>
                                        <td className="p-6">
                                            <div
                                                className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-md transition-all cursor-help group-hover:border-stone-200"
                                                title={typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                                            >
                                                {renderDetails(log.details)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination - Premium */}
                <div className="p-6 bg-stone-50/30 border-t border-stone-100 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="h-12 px-6 bg-white border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-stone-900 hover:text-white flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Index de Page</span>
                        <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-stone-200">
                            {page}
                        </div>
                    </div>
                    <button
                        disabled={!data?.meta?.next_page_url && logs.length < 20}
                        onClick={() => setPage(p => p + 1)}
                        className="h-12 px-6 bg-white border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-stone-900 hover:text-white flex items-center gap-2"
                    >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
