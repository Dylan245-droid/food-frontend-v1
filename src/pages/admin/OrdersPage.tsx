import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { ChefHat, Check, Clock, ShoppingBag, UtensilsCrossed, Search, Banknote, Flame, BellRing, User, LayoutGrid, List, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentModal } from '../../components/ui/PaymentModal';
import { Receipt } from '../../components/Receipt';
import type { ReceiptOrder } from '../../components/Receipt';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { useCashSession } from '../../hooks/useCashSession';
import { NoCashSessionAlert } from '../../components/NoCashSessionAlert';
import { formatCurrency } from '../../lib/utils';
import { NewOrderModal } from '../../components/admin/NewOrderModal';

// ... (keep existing interfaces)
interface MenuItem {
    name: string;
    description?: string;
}

interface OrderItem {
    id: number;
    quantity: number;
    unitPrice: number;
    formattedSubtotal: string;
    specialInstructions: string | null;
    menuItem: MenuItem;
}

interface TableInfo {
    id: number;
    name: string;
    zone?: string;
}

interface Order {
  id: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled' | 'paid';
  deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
  formattedTotal: string;
  totalAmount: number;
  table?: TableInfo; // Dine-in - relation from backend
  pickupCode?: string; // Takeout
  clientName?: string; // Takeout
  clientPhone?: string; // Takeout
  type: 'dine_in' | 'takeout' | 'delivery';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  dailyNumber: number;
  notes?: string;
}

export default function OrdersPage() {
  const { data, loading, refetch } = useFetch<{ data: Order[], meta: any }>('/staff/orders?limit=100&status=pending,in_progress,delivered,paid');
  
  // Pickup State
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [pickupOrder, setPickupOrder] = useState<Order | null>(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [, setError] = useState('');
  
  // Printing State
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
  const { branding } = useBranding();
  const { user } = useAuth();

  // Verification State
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');

  const [typeFilter, setTypeFilter] = useState<'all' | 'dine_in' | 'takeout'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // New Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | string>('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Cash Session Check
  const { hasActiveSession, loading: sessionLoading } = useCashSession();
  const navigate = useNavigate();



  // Helper: Check session before payment actions
  const checkSessionBeforePayment = (orderType: string): boolean => {
      if (orderType === 'delivery') return true; // Delivery doesn't need session
      if (sessionLoading) return true; // Still loading, allow for now
      if (!hasActiveSession) {
          toast.error("Vous devez ouvrir une session de caisse avant d'encaisser.", {
              action: {
                  label: 'Ouvrir caisse',
                  onClick: () => navigate('/admin/cash')
              }
          });
          return false;
      }
      return true;
  };

  // Auto-refresh toutes les 30s
  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleStatusChange = async (id: number, status: string) => {
      try {
          await api.patch(`/staff/orders/${id}/status`, { status });
          refetch();
      } catch { alert('Erreur'); }
  };

  const handlePickupSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setPickupOrder(null);
      setPickupLoading(true);

      try {
          const res = await api.get<{ data: Order[] }>(`/staff/orders?pickup_code=${pickupCode}`);
          if (res.data.data.length > 0) {
              setPickupOrder(res.data.data[0]);
          } else {
              setError('Code introuvable');
          }
      } catch {
          setError('Erreur lors de la recherche');
      } finally {
          setPickupLoading(false);
      }
  };

  const handlePayAndPrint = async (order: Order, skipConfirm = false) => {
      // ** CHECK SESSION FIRST ** (except for reprint of already paid orders)
      if (order.status !== 'paid' && !checkSessionBeforePayment(order.type)) {
          return; // Session check failed, user redirected
      }

      if (order.status === 'paid') {
          const receipt: ReceiptOrder = {
             id: order.id,
             dailyNumber: order.dailyNumber,
             pickupCode: order.pickupCode || null,
             status: 'paid',
             totalAmount: order.totalAmount,
             items: order.items,
             createdAt: order.createdAt,
             type: order.type,
             clientName: order.clientName,
             table: order.table ? { name: order.table.name } : undefined,
             subtotal: Math.round(order.totalAmount / 1.18),
             tax: order.totalAmount - Math.round(order.totalAmount / 1.18)
          };
          setReceiptOrder(receipt);
          setTimeout(() => window.print(), 500);
          return;
      }

      if (order.type === 'takeout' && !skipConfirm) {
          setVerifyingOrder(order);
          setVerifyCode('');
          return;
      }

      // Open Payment Modal instead of direct confirm
      // Open Payment Modal logic
      // Whether it is dine-in or confirmed takeout, we verify the payment amount
      setPaymentModalOrder(order);
  };

  const fetchDrivers = async () => {
      setLoadingDrivers(true);
      try {
          // Assuming /admin/users supports role filtering. If not, filter client side.
          const res = await api.get('/admin/users?role=livreur&limit=100');
          setDrivers(res.data.data);
      } catch (e) {
          console.error(e);
          toast.error("Impossible de charger les livreurs");
      } finally {
          setLoadingDrivers(false);
      }
  };

  const handleDeliveryHandover = (order: Order) => {
      setSelectedOrderForAssignment(order);
      setSelectedDriverId(''); // Reset selection
      setIsAssignModalOpen(true);
      fetchDrivers();
  };

  const handleAssignDriver = async () => {
      if (!selectedOrderForAssignment || !selectedDriverId) return;
      try {
          await api.post('/delivery/assign', {
              orderId: selectedOrderForAssignment.id,
              deliveryPersonId: Number(selectedDriverId)
          });
          toast.success("Commande assignée au livreur !");
          setIsAssignModalOpen(false);
          setSelectedOrderForAssignment(null);
          refetch();
      } catch (e) {
          console.error(e);
          toast.error("Erreur lors de l'assignation");
      }
  };
  



  if (loading && !data) return (
      <div className="flex h-96 items-center justify-center">
          <div className="animate-bounce flex flex-col items-center text-stone-400">
              <ChefHat className="w-12 h-12 mb-2" />
              <span className="font-bold">Ouverture de la cuisine...</span>
          </div>
      </div>
  );

  // Apply search and type filter
  const filterOrders = (orders: Order[]) => {
    return orders.filter(order => {
      // Type filter
      if (typeFilter !== 'all') {
          if (typeFilter === 'takeout') {
              // Takeout includes both pure takeout and delivery
              if (order.type !== 'takeout' && order.type !== 'delivery') return false;
          } else if (order.type !== typeFilter) {
              return false;
          }
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPickup = order.pickupCode?.toLowerCase().includes(query);
        const matchesClient = order.clientName?.toLowerCase().includes(query);
        const matchesNumber = order.dailyNumber?.toString().includes(query);
        const matchesTable = order.table?.name?.toLowerCase().includes(query);
        return matchesPickup || matchesClient || matchesNumber || matchesTable;
      }
      return true;
    });
  };

  const pendingOrders = filterOrders(data?.data.filter(o => o.status === 'pending') || []);
  const inProgressOrders = filterOrders(data?.data.filter(o => o.status === 'in_progress') || []);
  const deliveredOrders = filterOrders(data?.data.filter(o => o.status === 'delivered') || []);
  const paidOrders = filterOrders((data?.data.filter(o => o.status === 'paid') || []).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ));


  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Cash Session Alert */}
      {!sessionLoading && <NoCashSessionAlert show={!hasActiveSession} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
        <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3 uppercase tracking-tight font-display">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                     <UtensilsCrossed className="w-6 h-6" />
                </div>
                Cuisine & Envois
            </h1>
            <p className="text-stone-400 text-sm font-medium ml-14">Gérez le flux de production</p>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md w-full md:w-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par code, nom, table..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm"
                />
            </div>
        </div>
        
        <div className="flex gap-3 items-center">
            <Button onClick={() => setIsNewOrderModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 gap-2 h-12 px-6 rounded-xl font-bold shadow-lg">
                <Plus className="w-4 h-4" />
                Nouvelle Commande
            </Button>
            <Button onClick={() => setIsPickupModalOpen(true)} variant="outline" className="gap-2 h-12 px-6 rounded-xl font-bold border-stone-300">
                <ShoppingBag className="w-4 h-4" />
                Retrait Client
            </Button>
        </div>
      </div>

      {/* Filter Chips + View Toggle */}
      <div className="flex gap-2 px-1 justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${typeFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
          >
            Tous ({data?.data?.length || 0})
          </button>
          <button 
            onClick={() => setTypeFilter('dine_in')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${typeFilter === 'dine_in' ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
          >
            🍽️ Sur Place ({data?.data?.filter(o => o.type === 'dine_in').length || 0})
          </button>
          <button 
            onClick={() => setTypeFilter('takeout')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${typeFilter === 'takeout' ? 'bg-purple-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
          >
            👜 À Emporter & Livraison ({data?.data?.filter(o => o.type === 'takeout' || o.type === 'delivery').length || 0})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            title="Vue Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            title="Vue Liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 min-h-0 overflow-x-auto pb-4">
          {/* Colonne EN ATTENTE */}
          <Column 
              title="En attente" 
              count={pendingOrders.length}
              icon={BellRing} 
              color="text-yellow-700" 
              bgColor="bg-yellow-50/50"
              borderColor="border-yellow-200"
              headerColor="bg-yellow-100"
              accentColor="bg-yellow-500"
          >
              {pendingOrders.map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAction={() => handleStatusChange(order.id, 'in_progress')} 
                      actionLabel="LANCER" 
                      variant="pending" 
                      icon={Flame}
                  />
              ))}
              {pendingOrders.length === 0 && <EmptyState message="Cuisine calme" icon={Clock} />}
          </Column>

          {/* Colonne EN COURS */}
          <Column 
              title="Au Feu" 
              count={inProgressOrders.length}
              icon={Flame} 
              color="text-orange-700" 
              bgColor="bg-orange-50/50"
              borderColor="border-orange-200"
              headerColor="bg-orange-100"
              accentColor="bg-orange-500"
          >
              {inProgressOrders.map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAction={() => handleStatusChange(order.id, 'delivered')} 
                      actionLabel="SERVIR" 
                      variant="progress" 
                  />
              ))}
              {inProgressOrders.length === 0 && <EmptyState message="Rien sur le feu" icon={ChefHat} />}
          </Column>

          {/* Colonne SERVIS */}
          <Column 
              title="À Servir / Servis"
              count={deliveredOrders.length} 
              icon={UtensilsCrossed} 
              color="text-green-700" 
              bgColor="bg-green-50/50"
              borderColor="border-green-200"
              headerColor="bg-green-100"
              accentColor="bg-green-500"
          >
              {deliveredOrders.map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAction={() => {
                          if (order.type === 'takeout') {
                              handlePayAndPrint(order);
                          } else if (order.type === 'delivery') {
                               if (order.deliveryStatus !== 'picked_up') {
                                  handleDeliveryHandover(order);
                               } else {
                                  toast.info("Commande déjà en course");
                               }
                          }
                      }} 
                      actionLabel={
                          order.type === 'takeout' ? 'REMETTRE' : 
                          order.type === 'delivery' 
                              ? (order.deliveryStatus === 'picked_up' || order.deliveryStatus === 'assigned' ? undefined : 'CONFIER')
                              : undefined
                      }
                      onSecondaryAction={undefined}
                      secondaryActionLabel={undefined}
                      variant={order.type === 'delivery' && (order.deliveryStatus === 'picked_up' || order.deliveryStatus === 'assigned') ? 'info' : 'delivered'}  
                  />
              ))}
              {deliveredOrders.length === 0 && <EmptyState message="Passe vide" icon={ShoppingBag} />}
          </Column>

          {/* Colonne TERMINÉES */}
          <Column 
              title="Historique"
              count={paidOrders.length} 
              icon={Check} 
              color="text-stone-500" 
              bgColor="bg-stone-100/50"
              borderColor="border-stone-200"
              headerColor="bg-stone-200"
              accentColor="bg-stone-400"
          >
              {paidOrders.map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAction={() => handlePayAndPrint(order)} 
                      actionLabel={
                          order.type === 'delivery' 
                               ? (order.deliveryStatus === 'delivered' ? 'LIVRÉE' : 'EN COURSE')
                               : 'TICKET'
                      }
                      variant="paid" 
                  />
              ))}
              {paidOrders.length === 0 && <EmptyState message="Historique vide" icon={Check} />}
          </Column>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex-1">
          <table className="w-full text-xs">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left py-2 px-3 font-bold text-stone-600">#</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Type</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Client/Table</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Articles</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Total</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Statut</th>
                <th className="text-left py-2 px-3 font-bold text-stone-600">Date</th>
                <th className="text-right py-2 px-3 font-bold text-stone-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filterOrders(data?.data || [])
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(order => (
                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-2 px-3 font-bold text-stone-900">#{order.dailyNumber}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      order.type === 'dine_in' ? 'bg-orange-100 text-orange-700' :
                      order.type === 'takeout' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.type === 'dine_in' ? '🍽️ Salle' : order.type === 'takeout' ? '🥡 Emporter' : '🛵 Livraison'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-stone-700">
                    {order.type === 'dine_in' && order.table ? order.table.name : order.clientName || '-'}
                  </td>
                  <td className="py-2 px-3 text-stone-500">
                    {order.items.length} art.
                  </td>
                  <td className="py-2 px-3 font-bold text-stone-900">
                    {order.formattedTotal || formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'paid' ? 'bg-stone-200 text-stone-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'pending' ? 'En attente' :
                       order.status === 'in_progress' ? 'Au feu' :
                       order.status === 'delivered' ? 'Servi' :
                       order.status === 'paid' ? 'Payé' : 'Annulé'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 text-sm whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td className="py-2 px-3 text-right space-x-1">
                    {order.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(order.id, 'in_progress')}
                          className="bg-orange-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-orange-700"
                        >
                          Lancer
                        </button>
                        <button 
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-200"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    {order.status === 'in_progress' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-700"
                        >
                          Servir
                        </button>
                        <button 
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-200"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <>
                        {order.type === 'takeout' && (
                          <button 
                            onClick={() => handlePayAndPrint(order)}
                            className="bg-stone-900 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-stone-800"
                          >
                            Remettre
                          </button>
                        )}
                        {order.type === 'delivery' && !order.deliveryStatus?.includes('picked') && (
                          <button 
                            onClick={() => handleDeliveryHandover(order)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-700"
                          >
                            Confier
                          </button>
                        )}
                      </>
                    )}
                    {order.status === 'paid' && (
                      <button 
                        onClick={() => handlePayAndPrint(order)}
                        className="bg-stone-200 text-stone-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-stone-300"
                      >
                        Ticket
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filterOrders(data?.data || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Aucune commande
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pickup Modal */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Retrait Commande">
          <div className="space-y-6">
              {!pickupOrder ? (
                  <form onSubmit={handlePickupSearch} className="space-y-6">
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center">
                          <p className="text-stone-500 mb-4 font-medium">Demandez le code au client</p>
                          <Input 
                            value={pickupCode} 
                            onChange={e => setPickupCode(e.target.value.toUpperCase())}
                            autoFocus
                            className="text-center text-3xl font-black uppercase tracking-[0.5em] h-20 bg-white border-2 border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-xl"
                            placeholder="CODE"
                            maxLength={6}
                          />
                      </div>
                      <Button type="submit" isLoading={pickupLoading} className="w-full h-14 text-lg font-bold bg-stone-900 rounded-xl shadow-lg">
                          <Search className="w-5 h-5 mr-2" />
                          Rechercher la commande
                      </Button>
                  </form>
              ) : (
                  <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-sm relative overflow-hidden">
                          {/* Ticket edge effect top */}
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-200 to-stone-100"></div>

                          <div className="flex justify-between items-start mb-6">
                              <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold uppercase">RETRAIT</span>
                                      <span className="text-stone-400 text-xs">{new Date(pickupOrder.createdAt).toLocaleTimeString()}</span>
                                   </div>
                                   <h2 className="text-2xl font-black text-stone-900">#{pickupOrder.dailyNumber}</h2>
                                   <p className="font-medium text-stone-600">{pickupOrder.clientName || 'Client Anonyme'}</p>
                              </div>
                              <div className="text-right">
                                  <div className="text-2xl font-black text-orange-600">
                                      {pickupOrder.formattedTotal || formatCurrency(pickupOrder.totalAmount)}
                                  </div>
                                  <div className={`text-xs font-bold uppercase px-2 py-1 rounded-full inline-block mt-1 ${
                                      pickupOrder.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                      {pickupOrder.status === 'delivered' ? 'PRÊTE' : 'EN COURS'}
                                  </div>
                              </div>
                          </div>
                      
                          <div className="space-y-3 py-4 border-t border-dashed border-stone-200">
                              {pickupOrder.items.map(item => (
                                  <div key={item.id} className="flex justify-between items-center text-base border-b border-dashed border-stone-100 py-2 last:border-0">
                                      <span className="text-stone-800"><span className="font-bold mr-2">{item.quantity}x</span> {item.menuItem.name}</span>
                                      <span className="font-bold text-stone-900">{formatCurrency((item.unitPrice || 0) * item.quantity)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <Button variant="secondary" onClick={() => setPickupOrder(null)} className="flex-1 h-14 rounded-xl border-stone-200 hover:bg-stone-100">
                              Retour
                          </Button>
                          <Button 
                                onClick={() => handlePayAndPrint(pickupOrder, true)} 
                                className="flex-1 h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none"
                                disabled={pickupOrder.status !== 'delivered'}
                          >
                              <Check className="w-5 h-5 mr-2" />
                              Valider le Retrait
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      </Modal>

      {/* Hidden Receipt for Printing */}
      {createPortal(
        <div id="printable-receipt">
            <Receipt order={receiptOrder} branding={branding} cashierName={user?.fullName} />
        </div>,
        document.body
      )}

      <VerificationModal 
        isOpen={!!verifyingOrder}
        onClose={() => {
            setVerifyingOrder(null);
            setVerifyCode('');
        }}
        order={verifyingOrder}
        verifyCode={verifyCode}
        setVerifyCode={setVerifyCode}
        onConfirm={() => {
            if (verifyingOrder) {
                handlePayAndPrint(verifyingOrder, true);
                setVerifyingOrder(null);
                setVerifyCode('');
            }
        }}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={refetch}
      />

      <PaymentModal 
        order={paymentModalOrder}
        onClose={() => setPaymentModalOrder(null)}
        onConfirm={async (amountReceived) => {
            if (!paymentModalOrder) return;
            try {
                // Call API with extra amountReceived param
                await api.patch(`/staff/orders/${paymentModalOrder.id}/status`, { 
                    status: 'paid',
                    amountReceived // New param
                });
                
                // Print Receipt
                const receipt: ReceiptOrder = {
                     id: paymentModalOrder.id,
                     dailyNumber: paymentModalOrder.dailyNumber,
                     pickupCode: paymentModalOrder.pickupCode || null,
                     status: 'paid',
                     totalAmount: paymentModalOrder.totalAmount,
                     items: paymentModalOrder.items,
                     createdAt: paymentModalOrder.createdAt,
                     type: paymentModalOrder.type,
                     clientName: paymentModalOrder.clientName,
                     table: paymentModalOrder.table ? { name: paymentModalOrder.table.name } : undefined,
                     subtotal: Math.round(paymentModalOrder.totalAmount / 1.18),
                     tax: paymentModalOrder.totalAmount - Math.round(paymentModalOrder.totalAmount / 1.18)
                };
                setReceiptOrder(receipt);
                setTimeout(() => window.print(), 500);

                setPaymentModalOrder(null);
                setIsPickupModalOpen(false); // Close Pickup Modal
                setPickupOrder(null); // Clear Pickup Order
                refetch();
            } catch {
                alert('Erreur lors du paiement');
            }
        }}
      />

      {/* Assignment Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assigner un livreur">
          <div className="space-y-6">
              <div className="text-center">
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8" />
                   </div>
                   <h3 className="font-bold text-lg">Commande #{selectedOrderForAssignment?.dailyNumber}</h3>
                   <p className="text-stone-500 text-sm">Sélectionnez le livreur qui prend en charge cette commande.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                  {loadingDrivers ? (
                      <p className="text-center text-stone-400 py-4">Chargement des livreurs...</p>
                  ) : drivers.length === 0 ? (
                      <p className="text-center text-stone-400 py-4">Aucun livreur disponible</p>
                  ) : (
                      drivers.map(driver => (
                          <div 
                              key={driver.id}
                              onClick={() => setSelectedDriverId(driver.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                  selectedDriverId === driver.id 
                                  ? 'border-blue-600 bg-blue-50' 
                                  : 'border-stone-100 hover:border-blue-200'
                              }`}
                          >
                              <div className="flex items-center gap-3">
                                  {driver.avatar ? (
                                      <img src={driver.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                  ) : (
                                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500">
                                          {driver.fullName.charAt(0)}
                                      </div>
                                  )}
                                  <div className="text-left">
                                      <p className="font-bold text-stone-900">{driver.fullName}</p>
                                      <p className="text-xs text-stone-500">{driver.phone || 'Pas de numéro'}</p>
                                  </div>
                              </div>
                              {selectedDriverId === driver.id && (
                                  <div className="bg-blue-600 text-white rounded-full p-1">
                                      <Check className="w-4 h-4" />
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>

              <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="flex-1">Annuler</Button>
                  <Button 
                      onClick={handleAssignDriver}
                      disabled={!selectedDriverId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                      Confier la commande
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
}

// Payment Modal Component


function VerificationModal({ isOpen, onClose, order, verifyCode, setVerifyCode, onConfirm }: any) {
    const isMatch = order && order.pickupCode === verifyCode.toUpperCase();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sécurité Client">
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                </div>
                <div>
                     <p className="text-lg font-bold text-stone-900 mb-1">Code de vérification</p>
                     <p className="text-stone-500">Demandez le code au client pour valider la commande #{order?.dailyNumber}.</p>
                </div>
                
                <Input 
                    value={verifyCode}
                    onChange={(e: any) => setVerifyCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    autoFocus
                    className="text-center text-4xl font-black uppercase tracking-[0.3em] h-20 border-2 border-stone-200 focus:border-blue-500 rounded-xl"
                    maxLength={6}
                />

                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1 h-12 rounded-xl">Annuler</Button>
                    <Button 
                        onClick={onConfirm}
                        disabled={!isMatch}
                        className={`flex-1 h-12 rounded-xl font-bold shadow-lg transition-all ${isMatch ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' : 'bg-stone-200 text-stone-400 shadow-none'}`}
                    >
                        Valider
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function Column({ title, count, icon: Icon, children, color, bgColor, borderColor, headerColor, accentColor }: any) {
    return (
        <div className={`rounded-3xl border ${borderColor} ${bgColor} flex flex-col h-[calc(100vh-12rem)] shadow-sm overflow-hidden group`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between font-bold ${color} ${headerColor} flex-shrink-0 relative`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>
                <div className="flex items-center gap-3 pl-2">
                    <Icon className="w-5 h-5" />
                    <span className="uppercase tracking-wider text-sm font-black">{title}</span>
                </div>
                <div className="text-xs bg-white/80 backdrop-blur px-3 py-1 rounded-full font-bold shadow-sm min-w-[2rem] text-center border border-white/50">
                    {count}
                </div>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {children}
            </div>
        </div>
    )
}

function EmptyState({ message, icon: Icon }: { message: string, icon: any }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12 opacity-60">
            <div className="bg-white/50 p-4 rounded-full mb-3">
                <Icon className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wide">{message}</p>
        </div>
    )
}

function OrderCard({ order, onAction, actionLabel, variant, readonly = false, onSecondaryAction, secondaryActionLabel }: any) {
    const themes: Record<string, any> = {
        pending: { border: 'border-yellow-400', bg: 'bg-white', text: 'text-stone-900', btn: 'bg-stone-900 text-white hover:bg-stone-800' },
        progress: { border: 'border-orange-500', bg: 'bg-white', text: 'text-stone-900', btn: 'text-white hover:opacity-90 shadow-md' },
        delivered: { border: 'border-green-500', bg: 'bg-green-50/30', text: 'text-stone-900', btn: 'bg-white text-white border border-stone-200 hover:bg-stone-50' },
        paid: { border: 'border-stone-200', bg: 'bg-stone-50', text: 'text-stone-400', btn: 'text-white hover:opacity-90 shadow-md transform active:scale-95' }
    };
    const theme = themes[variant] || themes.pending;

    return (
        <div className={`rounded-xl shadow-sm border border-stone-200 ${theme.bg} flex flex-col overflow-hidden relative group hover:shadow-md transition-all`}>
           {/* Left Colored Stripe */}
           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.border.replace('border-', 'bg-')}`}></div>

            <div className="p-3 pl-5 border-b border-stone-100 flex justify-between items-start">
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">#{order.dailyNumber}</span>
                        {order.type === 'takeout' || order.type === 'delivery' ? (
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                                 order.type === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                             }`}>
                                {order.type === 'delivery' ? '🛵 LIVRAISON' : '👜 EMPORTER'}
                             </span>
                        ) : (
                            <span className="text-sm font-bold text-stone-700 bg-stone-100 px-2 rounded">{order.table?.name || '?'}</span>
                        )}
                     </div>
                     <div className="text-xs text-stone-400 font-medium flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                         {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         {order.clientName && <span className="text-stone-600 font-bold">• {order.clientName}</span>}
                     </div>
                </div>
            </div>

            <div className="p-3 pl-5 space-y-2 flex-1">
                {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start text-sm leading-tight">
                        <div className="text-stone-900">
                            <span className="font-black mr-2 bg-stone-100 px-1.5 rounded-md text-stone-600">{item.quantity}</span> 
                            <span className="font-bold">{item.menuItem?.name}</span>
                            {item.specialInstructions && (
                                <div className="text-[10px] text-red-600 font-bold mt-1 bg-red-50 px-2 py-1 rounded border border-red-100 uppercase tracking-wide">
                                    ⚠️ {item.specialInstructions}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {order.notes && (
                <div className="px-3 pl-5 pb-3">
                     <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg border border-yellow-100 font-medium italic">
                        "{order.notes}"
                     </div>
                </div>
            )}

            {!readonly && actionLabel && (
                <div className="p-2 pl-4 bg-stone-50 border-t border-stone-100 mt-auto flex gap-2">
                    <Button
                        onClick={onAction} 
                        className={`font-black uppercase tracking-wide text-xs py-2 h-10 ${onSecondaryAction ? 'flex-1' : 'w-full'} ${theme.btn} rounded-lg shadow-sm`}
                        style={(variant === 'paid' || variant === 'progress') ? { background: 'var(--primary-gradient)' } : undefined}
                    >
                        {variant === 'pending' && <Flame className="w-3 h-3 mr-1" />}
                        {actionLabel}
                    </Button>
                    {onSecondaryAction && (
                        <Button
                            onClick={onSecondaryAction} 
                            className="flex-1 font-black uppercase tracking-wide text-xs py-2 h-10 bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-sm"
                        >
                            <Banknote className="w-3 h-3 mr-1" />
                            {secondaryActionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
