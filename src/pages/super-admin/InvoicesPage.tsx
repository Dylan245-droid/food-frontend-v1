// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
    FileText, Plus, Check, X, Clock, AlertTriangle,
    RotateCcw, Download, Filter, Search, ChevronRight,
    TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../../lib/utils';

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

const statusConfig: Record<string, { label: string; color: string; icon: any; dot: string }> = {
    pending: { label: 'Attente', color: 'bg-stone-50 text-stone-600 border-stone-100', icon: Clock, dot: 'bg-amber-400' },
    paid: { label: 'Payée', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Check, dot: 'bg-emerald-500' },
    cancelled: { label: 'Annulée', color: 'bg-stone-50 text-stone-400 border-stone-100', icon: X, dot: 'bg-stone-300' },
    overdue: { label: 'Retard', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertTriangle, dot: 'bg-red-500' },
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<any[]>([]);
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

    const [filters, setFilters] = useState({
        tenantId: '',
        status: '',
        month: '',
        year: new Date().getFullYear().toString()
    });

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.tenantId) params.append('tenantId', filters.tenantId);
            if (filters.status) params.append('status', filters.status);
            if (filters.month) params.append('month', filters.month);
            if (filters.year) params.append('year', filters.year);

            const res = await api.get(`/super-admin/invoices?${params.toString()}`);
            setInvoices(res.data.data || []);
        } catch (error) {
            toast.error('Échec de synchronisation');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            setTenants(res.data.data || []);
        } catch (error) { }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [filters]);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/super-admin/invoices', {
                ...formData,
                amountHt: Number(formData.amountHt),
                amountTtc: Number(formData.amountTtc),
                details: { description: formData.description }
            });
            toast.success('Facture générée');
            setShowModal(false);
            fetchInvoices();
        } catch (error) {
            toast.error('Erreur de création');
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
            toast.error('Erreur export');
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.patch(`/super-admin/invoices/${id}/status`, { status });
            toast.success('Statut mis à jour');
            fetchInvoices();
        } catch (error) {
            toast.error('Action impossible');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <FileText className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Facturation</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
                            Gestion des Abonnements • {invoices.length} Documents
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
                    <button
                        onClick={fetchInvoices}
                        className="h-14 px-8 bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nouvelle Facture</span>
                    </button>
                </div>
            </div>

            {/* Invoices Filters - Premium Stone Grid */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-wrap gap-5 items-end">
                <div className="flex-1 min-w-[240px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> Restaurant Source
                    </p>
                    <select
                        value={filters.tenantId}
                        onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Tous les établissements</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-48">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2">État de paiement</p>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="paid">Payée</option>
                        <option value="overdue">En retard</option>
                        <option value="cancelled">Annulée</option>
                    </select>
                </div>
                <div className="w-full sm:w-48">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2 text-center">Période (Mois)</p>
                    <select
                        value={filters.month}
                        onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all appearance-none cursor-pointer text-center"
                    >
                        <option value="">Tous les mois</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {format(new Date(2024, i, 1), 'MMMM', { locale: fr })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-32">
                    <button
                        onClick={() => setFilters({ tenantId: '', status: '', month: '', year: '2026' })}
                        className="w-full h-14 flex items-center justify-center text-stone-300 hover:text-stone-900 transition-colors"
                        title="Reset"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Summary - Surgical Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { label: 'Total Volume', val: invoices.length, color: 'stone-900', icon: FileText },
                    { label: 'En Attente', val: invoices.filter(i => i.status === 'pending').length, color: 'amber-500', icon: Clock },
                    { label: 'Validées / Payées', val: invoices.filter(i => i.status === 'paid').length, color: 'emerald-500', icon: Check },
                    { label: 'Critique / Retard', val: invoices.filter(i => i.status === 'overdue').length, color: 'red-500', icon: AlertTriangle },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center justify-between group">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-1">{stat.label}</p>
                            <h4 className="text-2xl font-black text-stone-900">{stat.val}</h4>
                        </div>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-stone-50 transition-all group-hover:scale-110", `bg-${stat.color.split('-')[0]}-50 text-${stat.color}`)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Invoices Table - Premium High-Contrast */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden min-h-[300px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest pl-8">Référence Document</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Établissement Source</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Montant Collecté</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Période / Échéance</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status Flux</th>
                                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right pr-8">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-24 text-center"><div className="w-10 h-10 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center text-[11px] font-black text-stone-300 uppercase tracking-widest italic">Aucun document financier trouvé</td></tr>
                            ) : (
                                invoices.map((invoice, idx) => {
                                    const statusInfo = statusConfig[invoice.status];
                                    return (
                                        <tr key={invoice.id} className="hover:bg-stone-50/50 transition-all group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 15}ms` }}>
                                            <td className="p-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-stone-900 text-sm uppercase tracking-tight truncate max-w-[150px]">{invoice.invoiceNumber}</div>
                                                        <div className="text-[9px] text-stone-300 font-bold uppercase tracking-widest mt-1">Généré le {format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-stone-900"></div>
                                                    <span className="font-black text-stone-800 text-xs uppercase tracking-tight">{invoice.tenant?.name || 'N/A'}</span>
                                                </div>
                                                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1 ml-4">{invoice.tenant?.slug}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="font-black text-stone-900 text-sm tracking-tighter">{formatCurrency(invoice.amountTtc)}</div>
                                                <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">Montant TTC Collecté</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                                                    <div className="px-2 py-0.5 bg-stone-50 border border-stone-100 rounded-lg text-[9px] font-black uppercase text-stone-500 tracking-wider">
                                                        Cycle: {invoice.periodStart && format(new Date(invoice.periodStart), 'MMMM yyyy', { locale: fr })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-stone-600 uppercase tracking-widest">
                                                        <Calendar className="w-3.5 h-3.5 text-stone-300" />
                                                        {invoice.dueDate && format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 justify-center mx-auto border max-w-[120px]",
                                                    statusInfo.color
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusInfo.dot)}></div>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="p-6 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                                                        className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center border border-stone-100/50"
                                                        title="Exporter PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {invoice.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                            className="h-10 px-5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-50 border border-emerald-600"
                                                        >
                                                            Recouvrer
                                                        </button>
                                                    )}
                                                    {invoice.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleStatusChange(invoice.id, 'overdue')}
                                                            className="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:text-white hover:bg-red-500 transition-all flex items-center justify-center border border-red-100/50"
                                                            title="Marquer retard"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
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

            {/* Modal Redesign - Surgical Aesthetic */}
            {showModal && (
                <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 w-full max-w-xl border border-white/10 relative overflow-hidden group/modal">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-stone-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Générer Flux</h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900"></div>
                                    Création manuelle de document
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all hover:rotate-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2">Restaurant Destinataire</label>
                                    <select
                                        value={formData.tenantId}
                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">SÉLECTIONNER UN ÉTABLISSEMENT</option>
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2">Montant HT (FCFA)</label>
                                    <input
                                        type="number"
                                        value={formData.amountHt}
                                        onChange={(e) => {
                                            const ht = Number(e.target.value);
                                            setFormData({ ...formData, amountHt: ht, amountTtc: Math.round(ht * 1.18) });
                                        }}
                                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2">Montant TTC Total</label>
                                    <input
                                        type="number"
                                        value={formData.amountTtc}
                                        onChange={(e) => setFormData({ ...formData, amountTtc: Number(e.target.value) })}
                                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-3 ml-2">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-14 bg-stone-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-stone-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-8">
                                <button
                                    type="submit"
                                    className="h-14 px-10 bg-stone-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-stone-200 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    <Zap className="w-4 h-4 text-orange-400" />
                                    <span>Générer le flux</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
