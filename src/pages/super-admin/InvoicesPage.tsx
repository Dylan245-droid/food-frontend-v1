import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { FileText, Plus, Check, X, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface SubscriptionInvoice {
    id: number;
    invoiceNumber: string;
    amountHt: number;
    amountTtc: number;
    status: 'pending' | 'paid' | 'cancelled' | 'overdue';
    dueDate: string;
    periodStart: string;
    periodEnd: string;
    details: any;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
}

interface Tenant {
    id: string;
    name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    paid: { label: 'Payée', color: 'bg-green-100 text-green-800', icon: Check },
    cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-600', icon: X },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        amountHt: 0,
        amountTtc: 0,
        dueDate: '',
        periodStart: '',
        periodEnd: '',
        description: 'Abonnement mensuel GoTchop'
    });

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/super-admin/invoices');
            setInvoices(res.data.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Erreur lors du chargement des factures');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchTenants();
    }, []);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/super-admin/invoices', {
                tenantId: formData.tenantId,
                amountHt: Number(formData.amountHt),
                amountTtc: Number(formData.amountTtc),
                dueDate: formData.dueDate,
                periodStart: formData.periodStart,
                periodEnd: formData.periodEnd,
                details: { description: formData.description }
            });
            toast.success('Facture créée avec succès');
            setShowModal(false);
            fetchInvoices();
            // Reset form
            setFormData({
                tenantId: '',
                amountHt: 0,
                amountTtc: 0,
                dueDate: '',
                periodStart: '',
                periodEnd: '',
                description: 'Abonnement mensuel GoTchop'
            });
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Erreur lors de la création');
        }
    };

    const handleDownload = async (id: number, invoiceNumber: string) => {
        try {
            const res = await api.get(`/super-admin/invoices/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erreur lors du téléchargement');
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.patch(`/super-admin/invoices/${id}/status`, { status });
            toast.success('Statut mis à jour');
            fetchInvoices();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    return (
        <div>
            {/* ... existing header ... */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Factures Abonnements</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchInvoices}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle Facture
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Factures</p>
                    <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">En Attente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {invoices.filter(i => i.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Payées</p>
                    <p className="text-2xl font-bold text-green-600">
                        {invoices.filter(i => i.status === 'paid').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">En Retard</p>
                    <p className="text-2xl font-bold text-red-600">
                        {invoices.filter(i => i.status === 'overdue').length}
                    </p>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1000px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">N° Facture</th>
                                <th className="px-6 py-3 font-semibold">Restaurant</th>
                                <th className="px-6 py-3 font-semibold">Montant TTC</th>
                                <th className="px-6 py-3 font-semibold">Période</th>
                                <th className="px-6 py-3 font-semibold">Échéance</th>
                                <th className="px-6 py-3 font-semibold">Statut</th>
                                <th className="px-6 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        Aucune facture pour le moment
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => {
                                    const statusInfo = statusConfig[invoice.status];
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <tr key={invoice.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {invoice.invoiceNumber}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-700">
                                                {invoice.tenant?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-gray-900">
                                                {Number(invoice.amountTtc).toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 text-xs">
                                                {invoice.periodStart && format(new Date(invoice.periodStart), 'MMM yyyy', { locale: fr })}
                                            </td>
                                            <td className="px-6 py-3 text-gray-500">
                                                {invoice.dueDate && format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                                                        title="Télécharger PDF"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                    </Button>

                                                    {invoice.status !== 'paid' && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                            title="Marquer comme payée"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    {invoice.status === 'pending' && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(invoice.id, 'overdue')}
                                                            title="Marquer en retard"
                                                        >
                                                            <AlertTriangle className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Nouvelle Facture</h2>
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Restaurant
                                </label>
                                <select
                                    value={formData.tenantId}
                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="">Sélectionner un restaurant</option>
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Montant HT
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amountHt}
                                        onChange={(e) => {
                                            const ht = Number(e.target.value);
                                            setFormData({
                                                ...formData,
                                                amountHt: ht,
                                                amountTtc: Math.round(ht * 1.18)
                                            });
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Montant TTC
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amountTtc}
                                        onChange={(e) => setFormData({ ...formData, amountTtc: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Début Période
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.periodStart}
                                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fin Période
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.periodEnd}
                                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Échéance
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit">
                                    Créer la Facture
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
