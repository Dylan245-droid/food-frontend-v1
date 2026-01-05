import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { ChefHat, Check, Clock, ShoppingBag, UtensilsCrossed, Search, Banknote, Flame, BellRing } from 'lucide-react';
import { Receipt } from '../../components/Receipt';
import type { ReceiptOrder } from '../../components/Receipt';

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
  formattedTotal: string;
  totalAmount: number;
  table?: TableInfo; // Dine-in - relation from backend
  pickupCode?: string; // Takeout
  clientName?: string; // Takeout
  clientPhone?: string; // Takeout
  type: 'dine_in' | 'takeout';
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

  // Verification State
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

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
             table: order.table ? { name: order.table.name } : undefined
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

      const amountDisplay = order.formattedTotal || `${order.totalAmount} FCFA`;
      const clientDisplay = order.clientName ? `pour ${order.clientName}` : `(Commande #${order.dailyNumber})`;

      if (!skipConfirm && !confirm(`Confirmer le paiement de ${amountDisplay} ${clientDisplay} ?`)) return;

      try {
        await api.patch(`/staff/orders/${order.id}/status`, { status: 'paid' });
        
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
             table: order.table ? { name: order.table.name } : undefined
        };

        setReceiptOrder(receipt);
        setTimeout(() => window.print(), 500);
        
        setIsPickupModalOpen(false);
        setPickupOrder(null);
        setPickupCode('');
        refetch();
      } catch {
          alert('Erreur lors du paiement');
      }
  };
  
  const handlePrintTableBill = async (tableId: number, tableName: string) => {
      try {
          const res = await api.get(`/staff/orders?table_id=${tableId}&status=pending,in_progress,delivered`);
          const orders: any[] = res.data.data;
          
          if (orders.length === 0) {
              alert('Aucune commande à imprimer pour cette table.');
              return;
          }

          let totalAmount = 0;
          const allItems: OrderItem[] = orders.flatMap(o => {
              if (o.status === 'cancelled') return [];
              totalAmount += o.totalAmount;
              return o.items.map((i: any) => ({
                  id: i.id,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice || i.price || 0,
                  menuItem: i.menuItem
              }));
          });
          
          const consolidatedOrder: ReceiptOrder = {
              id: 0, 
              dailyNumber: null,
              pickupCode: null,
              status: 'delivered',
              totalAmount: totalAmount,
              items: allItems,
              createdAt: new Date().toISOString(),
              table: { name: tableName },
              type: 'dine_in'
          };
          
          setReceiptOrder(consolidatedOrder);
          setTimeout(() => window.print(), 500);
      } catch {
          alert('Erreur lors de la récupération de l\'addition');
      }
  }


  if (loading && !data) return (
      <div className="flex h-96 items-center justify-center">
          <div className="animate-bounce flex flex-col items-center text-stone-400">
              <ChefHat className="w-12 h-12 mb-2" />
              <span className="font-bold">Ouverture de la cuisine...</span>
          </div>
      </div>
  );

  const pendingOrders = data?.data.filter(o => o.status === 'pending') || [];
  const inProgressOrders = data?.data.filter(o => o.status === 'in_progress') || [];
  const deliveredOrders = data?.data.filter(o => o.status === 'delivered') || [];
  const paidOrders = (data?.data.filter(o => o.status === 'paid') || []).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );


  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
        <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3 uppercase tracking-tight font-display">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                     <UtensilsCrossed className="w-6 h-6" />
                </div>
                Cuisine & Envois
            </h1>
            <p className="text-stone-400 text-sm font-medium ml-14">Gérez le flux de production</p>
        </div>
        <div className="flex gap-3 items-center">
            <Button onClick={() => setIsPickupModalOpen(true)} className="bg-stone-900 text-white hover:bg-stone-800 gap-2 h-12 px-6 rounded-xl font-bold shadow-lg shadow-stone-900/10">
                <ShoppingBag className="w-4 h-4" />
                Retrait Client
            </Button>
        </div>
      </div>

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
                        } else if (order.type === 'dine_in' && order.table) {
                            handlePrintTableBill(order.table.id, order.table.name);
                        }
                    }} 
                    actionLabel={order.type === 'takeout' ? 'REMETTRE' : 'IMPRIMER'}
                    onSecondaryAction={order.type === 'dine_in' ? () => handlePayAndPrint(order) : undefined}
                    secondaryActionLabel="ENCAISSER"
                    variant="delivered" 
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
                    actionLabel="TICKET"
                    variant="paid" 
                />
            ))}
            {paidOrders.length === 0 && <EmptyState message="Historique vide" icon={Check} />}
        </Column>
      </div>

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
                                      <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold uppercase">Pickup</span>
                                      <span className="text-stone-400 text-xs">{new Date(pickupOrder.createdAt).toLocaleTimeString()}</span>
                                   </div>
                                   <h2 className="text-2xl font-black text-stone-900">#{pickupOrder.dailyNumber}</h2>
                                   <p className="font-medium text-stone-600">{pickupOrder.clientName || 'Client Anonyme'}</p>
                              </div>
                              <div className="text-right">
                                  <div className="text-2xl font-black text-orange-600">{pickupOrder.formattedTotal}</div>
                                  <div className={`text-xs font-bold uppercase px-2 py-1 rounded-full inline-block mt-1 ${
                                      pickupOrder.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                      {pickupOrder.status === 'delivered' ? 'PRÊTE' : 'EN COURS'}
                                  </div>
                              </div>
                          </div>
                      
                          <div className="space-y-3 py-4 border-t border-dashed border-stone-200">
                              {pickupOrder.items.map(item => (
                                  <div key={item.id} className="flex justify-between text-base">
                                      <span className="text-stone-800"><span className="font-bold mr-2">{item.quantity}x</span> {item.menuItem.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <Button variant="secondary" onClick={() => setPickupOrder(null)} className="flex-1 h-14 rounded-xl border-stone-200 hover:bg-stone-100">
                              Retour
                          </Button>
                          <Button 
                                onClick={() => handlePayAndPrint(pickupOrder)} 
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
            <Receipt order={receiptOrder} />
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
    </div>
  );
}

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
        progress: { border: 'border-orange-500', bg: 'bg-white', text: 'text-stone-900', btn: 'bg-orange-600 text-white hover:bg-orange-700' },
        delivered: { border: 'border-green-500', bg: 'bg-green-50/30', text: 'text-stone-900', btn: 'bg-white text-stone-900 border border-stone-200 hover:bg-stone-50' },
        paid: { border: 'border-stone-200', bg: 'bg-stone-50', text: 'text-stone-400', btn: 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50' }
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
                        {order.type === 'takeout' ? (
                             <span className="text-purple-700 text-[10px] font-black uppercase bg-purple-100 px-2 py-0.5 rounded flex items-center gap-1">
                                👜 EMPORTER
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

            {!readonly && (
                <div className="p-2 pl-4 bg-stone-50 border-t border-stone-100 mt-auto flex gap-2">
                    <Button
                        onClick={onAction} 
                        className={`font-black uppercase tracking-wide text-xs py-2 h-10 ${onSecondaryAction ? 'flex-1' : 'w-full'} ${theme.btn} rounded-lg shadow-sm`}
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
