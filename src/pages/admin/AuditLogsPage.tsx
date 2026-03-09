import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { RotateCcw } from 'lucide-react';

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
    } | null;
}

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const { data, loading, refetch } = useFetch<{ meta: any, data: ActivityLog[] }>(`/super-admin/audit-logs?page=${page}&limit=20`);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('fr-FR');
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return 'text-green-600 bg-green-50';
            case 'delete': return 'text-red-600 bg-red-50';
            case 'update': return 'text-blue-600 bg-blue-50';
            case 'login': return 'text-purple-600 bg-purple-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10 w-full xs:w-auto">
                        <div className="bg-stone-900 p-3 rounded-2xl text-white shadow-xl shadow-stone-100 shrink-0 self-start md:self-center">
                            <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight font-display leading-tight">
                                <span className="truncate">Journal d'Audit</span>
                            </h1>
                            <p className="text-stone-400 text-xs md:text-sm font-bold mt-1 md:mt-2 truncate">Traçabilité des actions système</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 relative z-10">
                        <Button
                            variant="secondary"
                            onClick={() => refetch()}
                            className="flex-1 sm:flex-none h-11 md:h-14 px-6 md:px-8 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-2xl font-bold uppercase tracking-wider text-[10px] md:text-xs active:scale-95 transition-all flex items-center justify-center font-display"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Actualiser Journal</span>
                            <span className="sm:hidden">Actualiser</span>
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                    <div className="overflow-x-auto p-1">
                        <table className="w-full text-left text-sm min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Date</th>
                                    <th className="px-6 py-3 font-semibold">Utilisateur</th>
                                    <th className="px-6 py-3 font-semibold">Action</th>
                                    <th className="px-6 py-3 font-semibold">Cible</th>
                                    <th className="px-6 py-3 font-semibold">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Chargement...</td></tr>
                                ) : data?.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-gray-900">{log.user?.fullName || 'Système / Anonyme'}</div>
                                            <div className="text-xs text-gray-400">{log.ipAddress}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="capitalize text-gray-700">{log.entityType.replace('_', ' ')}</span> <span className="text-xs text-gray-400">#{log.entityId}</span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination simple */}
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                        <Button
                            variant="secondary"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Précédent
                        </Button>
                        <span className="text-sm text-gray-600">Page {page}</span>
                        <Button
                            variant="secondary"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data?.meta || !data.meta.next_page_url} // Check meta logic from Adonis
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
