import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FinancialReportPrintableProps {
    stats: any;
    startDate: string;
    endDate: string;
    branding?: {
        name: string;
        address?: string;
        phone?: string;
        logo?: string;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'FCFA');
};

export function FinancialReportPrintable({ stats, startDate, endDate, branding }: FinancialReportPrintableProps) {
    if (!stats) return null;

    return createPortal(
        <div id="financial-report-printable" className="hidden print:block absolute top-0 left-0 w-full z-[9999] bg-white text-black p-0 m-0 overflow-visible font-sans leading-tight">
            {/* Page Container A4 Style - Compacted */}
            <div className="max-w-[210mm] w-full mx-auto p-[10mm] relative bg-white">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        {branding?.logo && (
                            <img src={branding.logo} alt="Logo" className="w-14 h-14 object-contain" />
                        )}
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-wider">{branding?.name || 'RESTAURANT'}</h1>
                            <p className="text-xs text-gray-600">{branding?.address}</p>
                            <p className="text-xs text-gray-600">{branding?.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-black uppercase">Rapport Financier</h2>
                        <p className="text-xs font-medium mt-1">
                            Période : {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Généré le : {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>
                </div>

                {/* KPI Summary Grid - Compacted */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="border border-gray-300 p-3 rounded-sm bg-gray-50">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">Chiffre d'Affaires</p>
                        <p className="text-xl font-black text-center mt-1 truncate">{formatCurrency(stats.kpi.totalRevenue)}</p>
                    </div>
                    <div className="border border-gray-300 p-3 rounded-sm bg-gray-50">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">Nombre de Commandes</p>
                        <p className="text-xl font-black text-center mt-1">{stats.kpi.totalOrders}</p>
                    </div>
                    <div className="border border-gray-300 p-3 rounded-sm bg-gray-50">
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">Panier Moyen</p>
                        <p className="text-xl font-black text-center mt-1 truncate">{formatCurrency(stats.kpi.averageTicket)}</p>
                    </div>
                </div>

                {/* Section: Détail Journalier */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Détail des Ventes</h3>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="text-left py-1.5 px-2 font-bold uppercase">Date</th>
                                <th className="text-center py-1.5 px-2 font-bold uppercase">Commandes</th>
                                <th className="text-right py-1.5 px-2 font-bold uppercase">Revenu (FCFA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.charts.dailyRevenue || []).map((day: any, index: number) => (
                                <tr key={day.date} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="py-1.5 px-2">{format(new Date(day.date), 'dd/MM/yyyy', { locale: fr })}</td>
                                    <td className="py-1.5 px-2 text-center">{day.count}</td>
                                    <td className="py-1.5 px-2 text-right font-bold">{new Intl.NumberFormat('fr-FR').format(day.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
                            <tr>
                                <td className="py-1.5 px-2">TOTAL</td>
                                <td className="py-1.5 px-2 text-center">{stats.kpi.totalOrders}</td>
                                <td className="py-1.5 px-2 text-right">{new Intl.NumberFormat('fr-FR').format(stats.kpi.totalRevenue)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Side by Side: Top Articles & Répartition */}
                <div className="flex gap-6 mb-6 break-inside-avoid">
                    {/* Top Articles */}
                    <div className="flex-1">
                        <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Top Articles</h3>
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="text-left py-1">Nom</th>
                                    <th className="text-center py-1">Qté</th>
                                    <th className="text-right py-1">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats.charts.topItems || []).slice(0, 10).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-1">{item.name}</td>
                                        <td className="py-1 text-center">{item.quantity}</td>
                                        <td className="py-1 text-right">{new Intl.NumberFormat('fr-FR').format(item.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Répartition */}
                    <div className="w-[40%]">
                        <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Répartition</h3>
                        <div className="space-y-2">
                            {(stats.charts.revenueByType || []).map((type: any, i: number) => (
                                <div key={i} className="border p-2 rounded-sm text-[10px]">
                                    <div className="flex justify-between font-bold mb-0.5">
                                        <span>{type.type}</span>
                                        <span>{Math.round((type.revenue / stats.kpi.totalRevenue) * 100)}%</span>
                                    </div>
                                    <div className="text-right text-gray-500">
                                        {formatCurrency(type.revenue)} ({type.count} cmds)
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 w-full p-8 text-center text-[10px] text-gray-400 print:block hidden">
                    <div className="border-t pt-2 max-w-[210mm] mx-auto">
                        Document généré automatiquement par le système de gestion.
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
