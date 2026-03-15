// @ts-nocheck
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PaymentModal } from '../../components/ui/PaymentModal';
import api from '../../lib/api';
import { Plus, RefreshCw, Trash2, UserCheck, MapPin, Download, ExternalLink, Unlock, User, Printer, AlertCircle, Armchair, ChevronRight, Loader2, QrCode, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Receipt } from '../../components/Receipt';
import type { ReceiptOrder, OrderItem } from '../../components/Receipt';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useCashSession } from '../../hooks/useCashSession';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AssignedServer {
  id: number;
  fullName: string;
}

interface Table {
  id: number;
  name: string;
  zone: string;
  capacity: number;
  code: string;
  isActive: boolean;
  isOccupied: boolean;
  activeOrdersCount: number;
  pendingCount: number;
  inProgressCount: number;
  deliveredCount: number;
  canBeFreed: boolean;
  assignedServer: AssignedServer | null;
}

interface UserData {
  id: number;
  fullName: string;
  role: string;
}

export default function TablesPage() {
  const [searchParams] = useSearchParams();
  const isMyTables = searchParams.get('filter') === 'mine';
  const endpoint = isMyTables ? '/staff/tables/me' : '/admin/tables';
  const { data, loading, refetch } = useFetch<{ data: Table[] }>(endpoint);
  const { data: usersData } = useFetch<{ data: UserData[] }>('/admin/users');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState<{ id: number, totalAmount: number, unpaidOrders: any[] } | null>(null);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ name: '', zone: 'Intérieur', capacity: 4 });
  const [assignServerId, setAssignServerId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
  const { branding } = useBranding();
  const { user } = useAuth();
  const { hasActiveSession, loading: sessionLoading } = useCashSession();
  const { isTableLimitReached, planName, maxTables } = useSubscription();
  const navigate = useNavigate();
  const baseUrl = window.location.origin;

  const checkSessionBeforePayment = (): boolean => {
    if (sessionLoading) return true;
    if (!hasActiveSession) {
      toast.error("Veuillez ouvrir une session de caisse", {
        action: { label: 'Ouvrir', onClick: () => navigate('/admin/cash') }
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/tables', formData);
      setIsModalOpen(false);
      setFormData({ name: '', zone: 'Intérieur', capacity: 4 });
      refetch();
      toast.success("Table créée");
    } catch { toast.error('Erreur lors de la création'); }
    finally { setSubmitting(false); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !assignServerId) return;
    try {
      await api.post(`/admin/tables/${selectedTable.id}/assign`, { userId: assignServerId });
      setIsAssignModalOpen(false);
      refetch();
      toast.success('Serveur assigné !');
    } catch { toast.error('Erreur d\'assignation'); }
  };

  const handleFreeTable = async (tableId: number) => {
    if (!confirm('Libérer cette table ?')) return;
    try {
      await api.post(`/admin/tables/${tableId}/free`);
      refetch();
      toast.success('Table libérée');
    } catch { toast.error('Erreur de libération'); }
  };

  const handlePrintBill = async (table: Table) => {
    if (!table.activeOrdersCount) return;
    try {
      const res = await api.get(`/staff/orders?table_id=${table.id}&status=pending,in_progress,delivered`);
      const orders: any[] = res.data.data;
      if (orders.length === 0) return toast.error('RIEN À IMPRIMER');

      let totalAmount = 0;
      const allItems: OrderItem[] = orders.flatMap(o => {
        if (o.status === 'cancelled') return [];
        totalAmount += o.totalAmount;
        return o.items.map((i: any) => ({
          id: i.id, quantity: i.quantity, unitPrice: i.unitPrice || i.price || 0, menuItem: i.menuItem
        }));
      });

      setReceiptOrder({ id: 0, status: 'delivered', totalAmount, items: allItems, createdAt: new Date().toISOString(), table: { name: table.name }, type: 'dine_in' });
    } catch { toast.error('Erreur d\'impression'); }
  };

  const handleCollectPayment = async (table: Table) => {
    if (!table.activeOrdersCount) return;
    if (!checkSessionBeforePayment()) return;
    try {
      const res = await api.get(`/staff/orders?table_id=${table.id}&status=pending,in_progress,delivered`);
      const unpaidOrders = res.data.data.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
      if (unpaidOrders.length === 0) return toast.info('Déjà payé');
      const totalAmount = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      setPaymentModalData({ id: table.id, totalAmount, unpaidOrders });
    } catch { toast.error('Erreur client'); }
  };

  useEffect(() => {
    if (receiptOrder) {
      setTimeout(() => { window.print(); setReceiptOrder(null); }, 100);
    }
  }, [receiptOrder]);

  const openQrModal = (table: Table) => { setSelectedTable(table); setIsQrModalOpen(true); };

  if (loading && !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-stone-100" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-4 sm:p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="flex items-center gap-4 md:gap-6 relative z-10">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <LayoutDashboard className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Plan de Salle</h1>
            <p className="text-[10px] md:text-sm font-bold mt-2 truncate tracking-wide uppercase text-stone-400">Occupation et statistiques</p>
          </div>
        </div>

        {!isMyTables && (
          <div className="flex gap-2 relative z-10 shrink-0">
            <button
              onClick={() => {
                if (isTableLimitReached(data?.data.length || 0)) {
                  toast.error("Limite de tables atteinte");
                  return;
                }
                setIsModalOpen(true);
              }}
              className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Table</span>
            </button>
          </div>
        )}
      </div>

      {/* Tables Grid - Surgery View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {data?.data.map((table, idx) => (
          <div
            key={table.id}
            className={cn(
              "group rounded-[2.5rem] p-6 border-2 transition-all duration-500 relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 shadow-sm",
              table.isOccupied
                ? "bg-stone-900 border-stone-900 text-white shadow-2xl shadow-stone-200"
                : "bg-white border-stone-100 text-stone-900 hover:border-stone-900 hover:-translate-y-1"
            )}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Status Indicator */}
            <div className={cn(
              "absolute top-6 right-6 w-3 h-3 rounded-full",
              table.isOccupied ? "bg-orange-500 animate-pulse shadow-[0_0_12px_rgba(249,115,22,0.8)]" : "bg-emerald-500"
            )}></div>

            <div className="flex flex-col mb-8 relative z-10">
              <h3 className="text-3xl font-black font-display uppercase tracking-tight mb-2 leading-none">{table.name}</h3>
              <div className={cn(
                "flex items-center gap-3 text-[10px] font-black uppercase tracking-widest",
                table.isOccupied ? "text-stone-500" : "text-stone-400"
              )}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {table.zone}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  {table.capacity}p
                </div>
              </div>
            </div>

            <div className="flex-1 mb-8">
              {table.isOccupied ? (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'ATT', val: table.pendingCount, color: 'text-orange-400' },
                    { label: 'COURS', val: table.inProgressCount, color: 'text-blue-400' },
                    { label: 'SERVI', val: table.deliveredCount, color: 'text-emerald-400' }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                      <span className={cn("text-lg font-black leading-none mb-1", stat.color)}>{stat.val}</span>
                      <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">{stat.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center opacity-20 group-hover:opacity-100 transition-all duration-700">
                  <Armchair className="w-12 h-12 text-stone-200 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Disponible</span>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-3">
              {table.isOccupied && (
                <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest truncate">
                    {table.assignedServer?.fullName || 'Non assigné'}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {table.isOccupied ? (
                  <>
                    <button onClick={() => handlePrintBill(table)} className="flex-1 bg-white/10 hover:bg-white text-white hover:text-stone-900 h-11 rounded-xl flex items-center justify-center transition-all border border-white/10">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleCollectPayment(table)} className="flex-[3] bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-900/20 active:scale-95 transition-all">
                      Payer
                    </button>
                    <button onClick={() => handleFreeTable(table.id)} className="flex-1 bg-white/5 hover:bg-red-500/20 text-stone-500 hover:text-red-500 h-11 rounded-xl flex items-center justify-center transition-all border border-white/5">
                      <Unlock className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openQrModal(table)} className="flex-[3] bg-stone-900 group-hover:bg-black text-white h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-stone-800">
                      <QrCode className="w-4 h-4 text-orange-400" />
                      QR Link
                    </button>
                    <button onClick={() => setSelectedTable(table) || setIsAssignModalOpen(true)} className="flex-1 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 h-11 rounded-xl flex items-center justify-center transition-all">
                      <UserCheck className="w-4 h-4" />
                    </button>
                    {!isMyTables && (
                      <button onClick={() => handleDelete(table.id)} className="flex-1 bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 h-11 rounded-xl flex items-center justify-center transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals - Standard System Styling */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Table">
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <Input label="NOM DE LA TABLE" placeholder="Ex: Terrasse 1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="h-14 font-black uppercase tracking-widest xs:text-sm" />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">ZONE DE SERVICE</label>
            <div className="grid grid-cols-2 gap-2">
              {['Intérieur', 'Terrasse', 'Piscine', 'VIP'].map(z => (
                <button key={z} type="button" onClick={() => setFormData({ ...formData, zone: z })} className={cn("h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", formData.zone === z ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-400 hover:bg-stone-100")}>{z}</button>
              ))}
            </div>
          </div>
          <Input label="CAPACITÉ (COUVERTURES)" type="number" min={1} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} required className="h-14 font-black uppercase tracking-widest text-xs" />
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</button>
            <button type="submit" disabled={submitting} className="flex-1 h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200">Créer</button>
          </div>
        </form>
      </Modal>

      {/* QR Modal, Assign, Payment - keep existing logic but apply brand styling */}
      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="QR Code Table">
        <div className="flex flex-col items-center py-6 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">SELF-ORDER</div>
            <QRCodeSVG value={`${baseUrl}/r/${user?.tenant?.slug || 'default'}/t/${selectedTable?.code}`} size={220} level="H" includeMargin />
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-stone-900 font-display mb-1 uppercase tracking-tight">{selectedTable?.name}</h2>
            <p className="text-stone-400 font-bold uppercase tracking-[0.15em] text-[10px]">{selectedTable?.zone} • {selectedTable?.capacity} COUVERTS</p>
          </div>
          <div className="flex gap-4 w-full px-4">
            <button onClick={() => window.open(`${baseUrl}/r/${user?.tenant?.slug}/t/${selectedTable?.code}`)} className="flex-1 h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all">
              <ExternalLink className="w-4 h-4 text-orange-400" /> Tester
            </button>
            <button onClick={() => toast.info('Impression QR non supportée via navigateur')} className="flex-1 h-16 bg-stone-50 text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
              <Printer className="w-4 h-4" /> Stick IT
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assignation Serveur`}>
        <form onSubmit={handleAssign} className="space-y-6 pt-4">
          <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center mb-6 px-10">Choisir le responsable de ce secteur pour ce service.</p>
            <select
              className="w-full h-16 bg-white rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black uppercase tracking-widest text-center text-xs"
              value={assignServerId}
              onChange={e => setAssignServerId(Number(e.target.value))}
            >
              <option value="0">--- Sélectionner ---</option>
              {usersData?.data?.filter(u => u.role === 'serveur').map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200">
            Valider
          </button>
        </form>
      </Modal>

      {paymentModalData && (
        <PaymentModal
          order={paymentModalData as any}
          title={`Encaissement Table ${selectedTable?.name || ''}`}
          onClose={() => setPaymentModalData(null)}
          onConfirm={async (amountReceived, method) => {
            try {
              await api.post(`/admin/tables/${paymentModalData.id}/pay`, { amountReceived, paymentMethod: method });
              setPaymentModalData(null);
              refetch();
              toast.success('Paiement encaissé !');
            } catch { toast.error('Erreur encaissement'); }
          }}
        />
      )}

      {createPortal(
        <div id="printable-receipt">
          <Receipt order={receiptOrder} branding={branding} cashierName={user?.fullName} />
        </div>,
        document.body
      )}
    </div>
  );
}
