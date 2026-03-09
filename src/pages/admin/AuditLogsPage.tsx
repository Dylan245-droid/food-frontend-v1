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
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-stone-100">
                <div>
                    <h1 className="text-lg md:text-2xl font-black text-stone-900 flex items-center gap-2 md:gap-3 uppercase tracking-tight font-display">
                        <div className="bg-stone-900 p-1.5 md:p-2 rounded-xl text-white">
                            <RotateCcw className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                        Journal d'Audit
                    </h1>
                    <p className="text-stone-400 text-[10px] md:text-sm font-medium ml-8 md:ml-14">Traçabilité des actions système</p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => refetch()}
                    className="h-10 md:h-12 px-4 md:px-6 rounded-xl font-bold shadow-sm"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Actualiser</span>
                    <span className="xs:hidden">Refesh</span>
                </Button>
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
    );
}
