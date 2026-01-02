import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { ChefHat, Check, Clock, ShoppingBag, UtensilsCrossed, AlertCircle, Printer, Search, Banknote } from 'lucide-react';
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
  const [error, setError] = useState('');
  
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
      } catch (e) { alert('Erreur'); }
  };

  const handlePickupSearch = async (e: React.FormEvent) => {
      e.preventDefault();
//...
      setError('');
      setPickupOrder(null);

      try {
          const res = await api.get<{ data: Order[] }>(`/staff/orders?pickup_code=${pickupCode}`);
          if (res.data.data.length > 0) {
              setPickupOrder(res.data.data[0]);
          } else {
              setError('Code introuvable');
          }
      } catch (e) {
          setError('Erreur lors de la recherche');
      } finally {
          setPickupLoading(false);
      }
  };

  const handlePayAndPrint = async (order: Order, skipConfirm = false) => {
      // If already paid, just print directly
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

      // If takeout and not verified, force verification
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
        
        // Prepare Receipt
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
             // Ensure table is properly mapped if it exists, though this often runs for takeout
             table: order.table ? { name: order.table.name } : undefined
        };

        setReceiptOrder(receipt);
        // Trigger Print
        setTimeout(() => window.print(), 500);
        
        setIsPickupModalOpen(false);
        setPickupOrder(null);
        setPickupCode('');
        refetch();
      } catch (e) {
          alert('Erreur lors du paiement');
      }
  };
  
  // Print table bill (consolidated) WITHOUT changing status
  const handlePrintTableBill = async (tableId: number, tableName: string) => {
      try {
          const res = await api.get(`/staff/orders?table_id=${tableId}&status=pending,in_progress,delivered`);
          const orders: any[] = res.data.data;
          
          if (orders.length === 0) {
              alert('Aucune commande à imprimer pour cette table.');
              return;
          }

          // Just print without changing status
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
              status: 'delivered', // Not paid yet - just showing the bill
              totalAmount: totalAmount,
              items: allItems,
              createdAt: new Date().toISOString(),
              table: { name: tableName },
              type: 'dine_in'
          };
          
          setReceiptOrder(consolidatedOrder);
          setTimeout(() => window.print(), 500);
      } catch (e) {
          alert('Erreur lors de la récupération de l\'addition');
      }
  }


  if (loading && !data) return <div className="flex h-96 items-center justify-center text-gray-400">Chargement du KDS...</div>;

  const pendingOrders = data?.data.filter(o => o.status === 'pending') || [];
  const inProgressOrders = data?.data.filter(o => o.status === 'in_progress') || [];
  const deliveredOrders = data?.data.filter(o => o.status === 'delivered') || [];
  // Sort paid orders by updatedAt desc (most recent payment/update first)
  const paidOrders = (data?.data.filter(o => o.status === 'paid') || []).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );


  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
            <UtensilsCrossed className="text-red-600 w-8 h-8" />
            Cuisine & Commandes
        </h1>
        <div className="flex gap-3 items-center">
            <Button onClick={() => setIsPickupModalOpen(true)} className="bg-black text-white hover:bg-gray-800 gap-2">
                <ShoppingBag className="w-4 h-4" />
                Retrait Commande
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Colonne EN ATTENTE */}
        <Column 
            title="En attente" 
            count={pendingOrders.length}
            icon={Clock} 
            color="text-yellow-700" 
            bgColor="bg-yellow-50/50"
            borderColor="border-yellow-200"
            headerColor="bg-yellow-100"
        >
            {pendingOrders.map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onAction={() => handleStatusChange(order.id, 'in_progress')} 
                    actionLabel="DÉMARRER" 
                    variant="pending" 
                />
            ))}
            {pendingOrders.length === 0 && <EmptyState message="Aucune commande en attente" />}
        </Column>

        {/* Colonne EN COURS */}
        <Column 
            title="En préparation" 
            count={inProgressOrders.length}
            icon={ChefHat} 
            color="text-blue-700" 
            bgColor="bg-blue-50/50"
            borderColor="border-blue-200"
            headerColor="bg-blue-100"
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
            {inProgressOrders.length === 0 && <EmptyState message="Rien en préparation" />}
        </Column>

        {/* Colonne SERVIS */}
        <Column 
            title="Déjà servis"
            count={deliveredOrders.length} 
            icon={Check} 
            color="text-green-700" 
            bgColor="bg-green-50/50"
            borderColor="border-green-200"
            headerColor="bg-green-100"
        >
            {deliveredOrders.map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onAction={() => {
                        if (order.type === 'takeout') {
                            // Takeout: single action = hand over and mark paid
                            handlePayAndPrint(order);
                        } else if (order.type === 'dine_in' && order.table) {
                            // Dine-in: primary = print bill only
                            handlePrintTableBill(order.table.id, order.table.name);
                        }
                    }} 
                    actionLabel={order.type === 'takeout' ? 'Remettre au client' : 'Imprimer'}
                    // Only show secondary action for dine-in orders
                    onSecondaryAction={order.type === 'dine_in' ? () => handlePayAndPrint(order) : undefined}
                    secondaryActionLabel="Encaisser"
                    variant="delivered" 
                />
            ))}
            {deliveredOrders.length === 0 && <EmptyState message="Service calme pour l'instant" />}
        </Column>

        {/* Colonne PAYÉES / TERMINÉES */}
        <Column 
            title="Terminées"
            count={paidOrders.length} 
            icon={Check} 
            color="text-gray-500" 
            bgColor="bg-gray-50"
            borderColor="border-gray-200"
            headerColor="bg-gray-100"
        >
            {paidOrders.map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onAction={() => handlePayAndPrint(order)} 
                    actionLabel="Réimprimer"
                    variant="paid" 
                    // readonly
                />
            ))}
            {paidOrders.length === 0 && <EmptyState message="Aucune commande terminée" />}
        </Column>
      </div>

      {/* Pickup Modal */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Retrait Commande à Emporter">
          <div className="space-y-4">
              {!pickupOrder ? (
                  <form onSubmit={handlePickupSearch} className="space-y-4">
                      <Input 
                        label="Code de Retrait" 
                        placeholder="Entrez le code..." 
                        value={pickupCode} 
                        onChange={e => setPickupCode(e.target.value.toUpperCase())}
                        autoFocus
                      />
                      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
                      <Button type="submit" isLoading={pickupLoading} className="w-full">
                          <Search className="w-4 h-4 mr-2" />
                          Rechercher
                      </Button>
                  </form>
              ) : (
                  <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between font-bold text-lg mb-2">
                              <span>Commande #{pickupOrder.dailyNumber}</span>
                              <span className="text-green-600">{pickupOrder.formattedTotal}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-4">
                              Client: {pickupOrder.clientName || 'Anonyme'}
                          </div>
                          
                          {/* Alert if not delivered */}
                          {pickupOrder.status !== 'delivered' && (
                              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md text-sm font-bold flex items-center mb-4">
                                  <Clock className="w-4 h-4 mr-2" />
                                  Commande non prête (Statut: {pickupOrder.status === 'pending' ? 'En attente' : 'En préparation'})
                              </div>
                          )}

                          <div className="space-y-2 border-t border-dashed border-gray-200 pt-2">
                              {pickupOrder.items.map(item => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                      <span>{item.quantity}x {item.menuItem.name}</span>
                                      <span>{item.unitPrice * item.quantity} F</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-3">
                          <Button variant="secondary" onClick={() => setPickupOrder(null)} className="flex-1">
                              Retour
                          </Button>
                          <Button 
                                onClick={() => handlePayAndPrint(pickupOrder)} 
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={pickupOrder.status !== 'delivered'}
                          >
                              <Printer className="w-4 h-4 mr-2" />
                              Payer & Imprimer
                          </Button>
                      </div>
                  </div>
              )}
          </div>
      </Modal>

      {/* Hidden Receipt for Printing (Portal to body) */}
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
                handlePayAndPrint(verifyingOrder, true); // true = skip confirmation since we verified
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
        <Modal isOpen={isOpen} onClose={onClose} title="Vérification Client">
            <div className="space-y-4">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                    🔒 Pour des raisons de sécurité, veuillez saisir le code de retrait fourni par le client pour valider la commande <strong>#{order?.dailyNumber}</strong>.
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code de retrait</label>
                    <Input 
                        value={verifyCode}
                        onChange={(e: any) => setVerifyCode(e.target.value.toUpperCase())}
                        placeholder="Ex: AB12CD"
                        autoFocus
                        className="text-center text-2xl tracking-widest font-black uppercase"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>Annuler</Button>
                    <Button 
                        onClick={onConfirm}
                        disabled={!isMatch}
                        className={`font-bold ${isMatch ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Valider & Payer
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function Column({ title, count, icon: Icon, children, color, bgColor, borderColor, headerColor }: any) {
    return (
        <div className={`rounded-xl border ${borderColor} ${bgColor} flex flex-col h-[calc(100vh-12rem)] shadow-sm`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between font-bold ${color} ${headerColor} flex-shrink-0`}>
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="uppercase tracking-wide text-sm">{title}</span>
                </div>
                <div className="text-xs bg-white/50 px-2 py-1 rounded-md min-w-[1.5rem] text-center">
                    {count}
                </div>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {children}
            </div>
        </div>
    )
}



function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 opacity-50">
            <AlertCircle className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium italic">{message}</p>
        </div>
    )
}

function OrderCard({ order, onAction, actionLabel, variant, readonly = false, onSecondaryAction, secondaryActionLabel }: { order: Order, onAction: () => void, actionLabel: string, variant: 'pending' | 'progress' | 'delivered' | 'paid', readonly?: boolean, onSecondaryAction?: () => void, secondaryActionLabel?: string }) {
    const theme = {
        pending: { border: 'border-yellow-400', header: 'bg-yellow-50', text: 'text-yellow-900', btn: 'bg-black text-white hover:bg-gray-800' },
        progress: { border: 'border-blue-500', header: 'bg-blue-50', text: 'text-blue-900', btn: 'bg-blue-600 text-white hover:bg-blue-700' },
        delivered: { border: 'border-green-500', header: 'bg-green-50', text: 'text-green-900', btn: 'bg-gray-800 text-white hover:bg-black' },
        paid: { border: 'border-gray-300', header: 'bg-gray-50', text: 'text-gray-500', btn: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' }
    }[variant];

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-[6px] ${theme.border} flex flex-col overflow-hidden group hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex justify-between items-start">
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded">#{order.dailyNumber}</span>
                        {order.type === 'takeout' ? (
                             <span className="text-purple-700 text-[10px] font-black uppercase bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" /> Emporter
                             </span>
                        ) : (
                            <span className="text-base font-bold text-gray-900">{order.table?.name || 'Table ?'}</span>
                        )}
                     </div>
                     <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                         {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         {order.type === 'takeout' && order.clientName && (
                            <span className="font-bold text-gray-900 ml-1">• {order.clientName} {order.clientPhone && `(${order.clientPhone})`}</span>
                         )}
                         {order.type === 'dine_in' && order.table?.zone && (
                            <span className="text-gray-400 ml-1">• {order.table.zone}</span>
                         )}
                     </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-gray-900 tracking-tight">{order.formattedTotal || `${order.totalAmount} FCFA`}</div>
                </div>
            </div>

            {/* Items - Always Visible now */}
            <div className="p-4 space-y-3 bg-white flex-1">
                {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <div className="text-gray-900 leading-snug">
                            <span className="font-black text-gray-900 mr-2 bg-gray-100 px-1.5 rounded">{item.quantity}x</span> 
                            <span className="font-semibold">{item.menuItem?.name || 'Nom introuvable'}</span>
                            {item.specialInstructions && (
                                <div className="text-xs text-red-500 font-medium mt-1 bg-red-50 px-2 py-1 rounded inline-block">
                                    ⚠️ {item.specialInstructions}
                                </div>
                            )}
                        </div>
                        <div className="text-gray-500 text-xs tabular-nums font-medium whitespace-nowrap ml-2">
                            {item.quantity * item.unitPrice} FCFA
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Notes Globales */}
            {order.notes && (
                <div className="px-4 pb-3">
                     <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded border border-orange-100 font-medium">
                        📝 Note: {order.notes}
                     </div>
                </div>
            )}

            {/* Actions */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 mt-auto">
                {!readonly && (
                    <div className={onSecondaryAction ? 'flex gap-2' : ''}>
                        <Button
                            onClick={onAction} 
                            className={`${onSecondaryAction ? 'flex-1' : 'w-full'} font-bold uppercase tracking-wide py-3 ${theme.btn}`}
                        >
                            <Printer className="w-4 h-4 mr-1" />
                            {variant === 'pending' ? 'Démarrer la préparation' : actionLabel}
                        </Button>
                        {onSecondaryAction && (
                            <Button
                                onClick={onSecondaryAction} 
                                className="flex-1 font-bold uppercase tracking-wide py-3 bg-green-600 text-white hover:bg-green-700"
                            >
                                <Banknote className="w-4 h-4 mr-1" />
                                {secondaryActionLabel || 'Encaisser'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
