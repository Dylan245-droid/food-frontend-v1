// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Search, Filter, Eye, Download, X, Check, XCircle, FileText, ChevronRight, Loader2, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Receipt } from '../../components/Receipt';
import { createPortal } from 'react-dom';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'sonner';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unitPriceHt: number;
    taxRate: number;
    totalHt: number;
    totalTtc: number;
}

interface Order {
    id: number;
    dailyNumber: number;
    pickupCode: string;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    clientName: string;
    clientNif: string;
    status: 'draft' | 'finalized' | 'cancelled';
    totalTtc: number;
    taxAmount: number;
    issuedAt: string;
    cancelledAt?: string;
    items: InvoiceItem[];
    orderId?: number;
    order?: Order;
    cancellationReason?: string;
}

export default function InvoicesPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = now.toISOString().split('T')[0];
        return { start, end };
    });

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [receiptData, setReceiptData] = useState<any>(null);

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
    });

    const { data: invoicesData, loading, refetch } = useFetch<any>(`/admin/invoices?${queryParams}`);
    const invoices = invoicesData?.data || [];

    const handleCancelInvoice = async () => {
        if (!selectedInvoice || !cancelReason) return;
        try {
            await api.post(`/admin/invoices/${selectedInvoice.id}/cancel`, { reason: cancelReason });
            setIsCancelModalOpen(false);
            setIsDetailsModalOpen(false);
            setCancelReason('');
            refetch();
            toast.success("Facture annulée (Avoir généré)");
        } catch {
            toast.error("Erreur d'annulation");
        }
    };

    const viewInvoice = async (invoice: Invoice) => {
        try {
            const res = await api.get(`/admin/invoices/${invoice.id}`);
            setSelectedInvoice(res.data.data);
            setIsDetailsModalOpen(true);
        } catch {
            toast.error("Chargement impossible");
        }
    };

    const handlePrintReceipt = () => {
        if (!selectedInvoice) return;
        const receipt: any = {
            id: selectedInvoice.id,
            totalAmount: selectedInvoice.totalTtc,
            items: selectedInvoice.items?.map((item: any) => ({
                id: item.id, quantity: item.quantity, unitPrice: item.unitPriceHt, menuItem: { name: item.description }
            })) || [],
            createdAt: selectedInvoice.issuedAt,
            type: 'dine_in',
            clientName: selectedInvoice.clientName,
            subtotal: selectedInvoice.items?.reduce((acc: number, item: any) => acc + item.totalHt, 0),
            tax: selectedInvoice.taxAmount
        };
        setReceiptData(receipt);
        setTimeout(() => { window.print(); setReceiptData(null); }, 500);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 lg:px-8">

            {createPortal(<div id="printable-receipt"><Receipt order={receiptData} /></div>, document.body)}

            {/* Premium Header */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <FileText className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Facturation</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            {invoicesData?.meta?.total || 0} Documents • Suivi des revenus
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 relative z-10 shrink-0">
                    <button
                        onClick={() => {/* Export Logic */ }}
                        className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exporter CSV</span>
                    </button>
                </div>
            </div>

            {/* Surgical Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="RECHERCHER UN NUMÉRO OU UN CLIENT..."
                        className="w-full h-14 pl-14 pr-6 bg-white rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[10px] uppercase tracking-widest shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="md:col-span-3 relative">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[10px] uppercase tracking-widest shadow-sm appearance-none"
                    >
                        <option value="">TOUS LES STATUTS</option>
                        <option value="finalized">VALIDÉES</option>
                        <option value="cancelled">ANNULÉES</option>
                    </select>
                </div>
                <div className="md:col-span-4 flex gap-2">
                    <div className="flex-1 relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full h-14 pl-10 pr-4 bg-white rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[9px] uppercase tracking-tight shadow-sm"
                        />
                    </div>
                    <div className="flex-1 relative">
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full h-14 px-4 bg-white rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[9px] uppercase tracking-tight shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Invoices List - Premium Grouping */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto premium-scrollbar pb-4">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Référence</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Client</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">HT</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">TTC</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-stone-200 mx-auto" /></td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest">Aucune facture trouvée</td></tr>
                            ) : (
                                invoices.map((inv: any, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50/50 transition-colors group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 20}ms` }}>
                                        <td className="p-6">
                                            <span className="font-black text-stone-900 text-sm tracking-tight font-display">{inv.invoiceNumber}</span>
                                        </td>
                                        <td className="p-6 text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                                            {new Date(inv.issuedAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-6">
                                            <div className="font-black text-stone-800 text-xs uppercase tracking-tight truncate max-w-[150px]">{inv.clientName || 'CLIENT DE PASSAGE'}</div>
                                            {inv.clientNif && <div className="text-[9px] text-stone-400 font-bold uppercase mt-1">NIF: {inv.clientNif}</div>}
                                        </td>
                                        <td className="p-6 text-right font-bold text-stone-500 text-xs">
                                            {formatCurrency(inv.totalTtc / 1.18)}
                                        </td>
                                        <td className="p-6 text-right font-black text-stone-900 text-sm">
                                            {formatCurrency(inv.totalTtc)}
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                inv.status === 'finalized' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                            )}>
                                                {inv.status === 'finalized' ? 'Validée' : 'Annulée'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => viewInvoice(inv)}
                                                className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm active:scale-95"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-6 bg-stone-50/30 border-t border-stone-100 flex justify-between items-center">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-6 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all hover:bg-stone-900 hover:text-white">Précédent</button>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} className="px-6 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-stone-900 hover:text-white">Suivant</button>
                </div>
            </div>

            {/* Details Modal - Premium Pass */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Détails Facturation`}>
                <div className="space-y-8 pt-4">
                    {selectedInvoice && (
                        <>
                            <div className="bg-stone-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-stone-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Facture Référence</p>
                                        <h3 className="text-3xl font-black font-display tracking-tight uppercase">{selectedInvoice.invoiceNumber}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Date d'émission</p>
                                        <p className="font-bold text-sm uppercase">{new Date(selectedInvoice.issuedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-50 rounded-[2rem] p-6 border border-stone-100">
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4 ml-1">Composition de la vente</h4>
                                <div className="space-y-3">
                                    {selectedInvoice.items?.map((item: any) => (
                                        <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-stone-100/50">
                                            <div>
                                                <p className="font-black text-stone-900 text-xs uppercase tracking-tight leading-none mb-2">{item.description}</p>
                                                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{item.quantity} UNITÉS</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-stone-900 text-xs">{formatCurrency(item.totalTtc)}</p>
                                                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">TAXE INCLUSE</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200 text-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_50%)]"></div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase tracking-widest">
                                        <span>Total Net HT</span>
                                        <span>{formatCurrency(selectedInvoice.items?.reduce((acc: number, item: any) => acc + item.totalHt, 0) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase tracking-widest border-b border-white/5 pb-4">
                                        <span>Charges Fiscales (18%)</span>
                                        <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-black uppercase tracking-[0.2em] text-stone-300">Net à Payer</span>
                                        <span className="text-4xl font-black font-display tracking-tight text-white">{formatCurrency(selectedInvoice.totalTtc)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handlePrintReceipt}
                                    className="flex-1 h-16 bg-white border border-stone-200 text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-stone-100"
                                >
                                    <Download className="w-4 h-4 text-orange-500" />
                                    Imprimer
                                </button>
                                {selectedInvoice.status !== 'cancelled' && (
                                    <button
                                        onClick={() => { setIsDetailsModalOpen(false); setIsCancelModalOpen(true); }}
                                        className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Cancel Modal */}
            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Annulation Critique">
                <div className="space-y-6 pt-4 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-loose px-6">
                        L'annulation d'une facture validée génère automatiquement un avoir (note de crédit) dans votre comptabilité.
                    </p>
                    <div className="text-left space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Raison de l'annulation *</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="ERREUR DE SAISIE, RETOUR PRODUIT..."
                            className="w-full h-32 bg-stone-50 rounded-[2rem] border-none focus:ring-4 focus:ring-red-100 font-black text-[10px] p-6 uppercase tracking-widest transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Fermer</button>
                        <button onClick={handleCancelInvoice} disabled={!cancelReason} className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200">Confirmer</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
