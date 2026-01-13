import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Search, Filter, Eye, Download, X, Check, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Receipt } from '../../components/Receipt';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../lib/utils';

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

    // Modals
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Printing
    const [receiptData, setReceiptData] = useState<any>(null);

    // Fetch Invoices
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
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
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'annulation");
        }
    };

    const viewInvoice = async (invoice: Invoice) => {
        try {
             const res = await api.get(`/admin/invoices/${invoice.id}`);
             setSelectedInvoice(res.data.data);
             setIsDetailsModalOpen(true);
        } catch(e) {
            console.error(e);
            alert("Impossible de charger les détails de la facture");
        }
    };

    const handlePrintReceipt = () => {
        if (!selectedInvoice) return;
        
        const receipt: any = {
            id: selectedInvoice.id,
            dailyNumber: null,
            pickupCode: null,
            status: 'paid',
            totalAmount: selectedInvoice.totalTtc,
            items: selectedInvoice.items?.map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: item.unitPriceHt, 
                menuItem: { name: item.description }
            })) || [],
            createdAt: selectedInvoice.issuedAt,
            type: 'dine_in', // Generic
            clientName: selectedInvoice.clientName,
            subtotal: selectedInvoice.items?.reduce((acc: number, item: any) => acc + item.totalHt, 0),
            tax: selectedInvoice.taxAmount
        };
        
        setReceiptData(receipt);
        // Delay to allow rendering
        setTimeout(() => window.print(), 500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            
            {/* Hidden Receipt for Printing */}
            {createPortal(
                <div id="printable-receipt">
                    <Receipt order={receiptData} />
                </div>,
                document.body
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Factures</h1>
                    <p className="text-gray-500">Gérez vos factures et avoirs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={async () => {
                            try {
                                const params = new URLSearchParams({
                                    ...(statusFilter && { status: statusFilter }),
                                    ...(search && { search }),
                                    ...(dateRange.start && { startDate: dateRange.start }),
                                    ...(dateRange.end && { endDate: dateRange.end }),
                                });
                                
                                const response = await api.get(`/admin/invoices/export?${params}`, {
                                    responseType: 'blob'
                                });
                                
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `factures_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error('Export failed', error);
                                alert("Erreur lors de l'export");
                            }
                        }}
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Rechercher (Numéro, Client...)" 
                        className="pl-10 w-full border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <Filter className="w-4 h-4 text-gray-400 ml-2" />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="finalized">Validées</option>
                            <option value="cancelled">Annulées</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg flex items-center px-2 py-1">
                            <span className="text-xs text-gray-500 mr-2">Du</span>
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-transparent border-none p-0 text-sm w-32 focus:ring-0"
                            />
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg flex items-center px-2 py-1">
                            <span className="text-xs text-gray-500 mr-2">Au</span>
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-transparent border-none p-0 text-sm w-32 focus:ring-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">Numéro</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Client</th>
                            <th className="p-4 text-right">Montant TTC</th>
                            <th className="p-4 text-center">Statut</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune facture trouvée.</td></tr>
                        ) : (
                            invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                                    <td className="p-4 text-gray-600">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{inv.clientName || 'Client de passage'}</div>
                                        {inv.clientNif && <div className="text-xs text-gray-400">NIF: {inv.clientNif}</div>}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">{formatCurrency(inv.totalTtc)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                            ${inv.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                        `}>
                                            {inv.status === 'finalized' ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}
                                            {inv.status === 'finalized' ? 'Validée' : 'Annulée'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => viewInvoice(inv)}
                                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                     <button disabled={page===1} onClick={() => setPage(p => p-1)} className="hover:text-blue-600 disabled:opacity-50">Précédent</button>
                     <span>Page {page}</span>
                     <button onClick={() => setPage(p => p+1)} className="hover:text-blue-600">Suivant</button>
                </div>
            </div>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Facture ${selectedInvoice?.invoiceNumber || ''}`}>
                <div className="p-6 space-y-6">
                    {selectedInvoice && (
                        <>
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Client</p>
                                    <p className="font-bold text-lg">{selectedInvoice.clientName || 'Inconnu'}</p>
                                    {selectedInvoice.clientNif && <p className="text-sm text-gray-400">NIF: {selectedInvoice.clientNif}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Date d'émission</p>
                                    <p className="font-bold">{new Date(selectedInvoice.issuedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {selectedInvoice.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed border-gray-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.description}</p>
                                            <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unitPriceHt)} HT</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{formatCurrency(item.totalTtc)}</p>
                                            <p className="text-[10px] text-gray-400">{formatCurrency(item.totalHt)} HT</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Total HT</span>
                                    <span>{formatCurrency(selectedInvoice.items?.reduce((acc: number, item: any) => acc + item.totalHt, 0) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>TVA (18.00%)</span>
                                    <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200">
                                    <span>Total TTC</span>
                                    <span>{formatCurrency(selectedInvoice.totalTtc)}</span>
                                </div>
                            </div>

                            {selectedInvoice.status === 'cancelled' && (
                                <div className="bg-red-50 p-4 rounded-lg text-red-800 text-sm border border-red-100">
                                    <p className="font-bold mb-1">Facture Annulée</p>
                                    <p>Raison : {selectedInvoice.cancellationReason}</p>
                                    <p className="text-xs opacity-70 mt-1">Le {new Date(selectedInvoice.cancelledAt!).toLocaleString()}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setIsDetailsModalOpen(false)}>Fermer</Button>
                                <Button variant="secondary" className="flex-1 font-bold" onClick={handlePrintReceipt}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Imprimer
                                </Button>
                                {selectedInvoice.status !== 'cancelled' && (
                                    <Button 
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => {
                                            setIsDetailsModalOpen(false);
                                            setIsCancelModalOpen(true);
                                        }}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Annuler
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Cancel Confirm Modal */}
            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Annuler la facture">
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-sm">
                        L'annulation d'une facture est irréversible. Un avoir sera généré automatiquement.
                    </p>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Motif d'annulation <span className="text-red-500">*</span></label>
                        <Input 
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ex: Erreur de saisie, Retourd produit..."
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>Retour</Button>
                        <Button variant="danger" onClick={handleCancelInvoice} disabled={!cancelReason}>Confirmer Annulation</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
