import { useState, useMemo, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Users, UtensilsCrossed } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  categoryId: number;
  imageUrl?: string;
}

interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function DineInPage() {
  const { code } = useParams();
  const { data: tableData, loading, error } = useFetch<any>(`/tables/${code}`);
  
  const { data: tableOrders, refetch: refreshOrders } = useFetch<any>(`/tables/${code}/orders`);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const navigate = useNavigate();

  // --- Auto-Session End Logic State ---
  const [showThankYou, setShowThankYou] = useState(false);
  const [hasPlacedOrders, setHasPlacedOrders] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('');

  const menuCategories: MenuCategory[] = tableData?.menu || [];
  const tableInfo = tableData?.table;

  // Set Sticky Session
  useMemo(() => {
    if (code) localStorage.setItem('activeTableCode', code);
  }, [code]);

  // Initialize active category when data loads
  useMemo(() => {
    if (menuCategories.length > 0 && activeCategoryId === 'all') {
        setActiveCategoryId(menuCategories[0].id);
    }
  }, [menuCategories]);

  // Handle exiting the table session
  const ongoingOrders = tableOrders?.data || [];

  // Calculate Grand Total for the table
  const tableGrandTotal = ongoingOrders.reduce((sum: number, order: any) => {
      const orderTotal = order.items.reduce((acc: number, item: any) => {
          const price = item.unitPrice !== undefined ? item.unitPrice : item.price || 0;
          return acc + (price * item.quantity);
      }, 0);
      return sum + orderTotal;
  }, 0);

  const thankYouMessages = [
      "Revenez vite, ce fût un plaisir de vous avoir !",
      "Merci de votre visite ! À très bientôt chez Sauce Créole.",
      "Nous espérons que vous avez passé un excellent moment. À la prochaine !",
      "Toute l'équipe vous remercie. Revenez nous voir vite !",
      "Un grand merci ! Nous avons hâte de vous régaler à nouveau.",
      "Votre satisfaction est notre bonheur. À très bientôt !",
      "Merci d'être passé ! Bon retour et à bientôt.",
      "Au plaisir de vous revoir très prochainement autour d'un bon repas.",
      "Merci pour ce moment partagé. Prenez soin de vous et à bientôt !",
      "Ce fut un plaisir de vous servir. À très vite chez nous !"
  ];

  // Track if we ever had orders
  useEffect(() => {
      if (ongoingOrders.length > 0) {
          setHasPlacedOrders(true);
      }
  }, [ongoingOrders]);

  // Trigger end session if we had orders and now they are gone (paid/cleared)
  useEffect(() => {
      if (hasPlacedOrders && ongoingOrders.length === 0 && !loading) {
          // Pick random message
          const msg = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)];
          setThankYouMessage(msg);
          setShowThankYou(true);
          
          // Clear local storage / session
          localStorage.removeItem('activeTableCode');

          // Redirect after 8 seconds
          const timer = setTimeout(() => {
              navigate('/');
          }, 8000);
          return () => clearTimeout(timer);
      }
  }, [ongoingOrders, hasPlacedOrders, loading]);
  const handleLeaveTable = async () => {
     const hasUnpaidServedOrders = ongoingOrders.some((o: any) => o.status === 'delivered');
     
     if (hasUnpaidServedOrders) {
         alert(`Impossible de quitter la table ${tableInfo?.name || ''} !\n\nVous avez des commandes servies non réglées. Veuillez demander l'addition ou appeler le serveur.`);
         return;
     }

     if (window.confirm('Voulez-vous libérer la table ?\n\n⚠️ Si vous avez des commandes en attente ou en préparation, elles seront annulées.')) {
         try {
             await api.post(`/tables/${code}/leave`);
         } catch(e) {
             console.error("Erreur cleaning session", e);
         } finally {
             localStorage.removeItem('activeTableCode');
             navigate('/');
         }
     }
  };

  // Handle cancelling a single order
  const handleCancelOrder = async (orderId: number) => {
     if (window.confirm('Annuler cette commande ?\n\nCette action est irréversible.')) {
         try {
             await api.post(`/orders/${orderId}/cancel`);
             refreshOrders();
         } catch(e) {
             alert('Erreur lors de l\'annulation');
             console.error("Erreur cancellation", e);
         }
     }
  };

  const handleServerCall = async (type: 'general' | 'bill') => {
      if (!tableInfo?.id) return;
      
      const label = type === 'bill' ? "Demander l'addition" : "Appeler le serveur";
      if (!confirm(`Confirmer : ${label} ?`)) return;

      try {
          await api.post('/client/calls', {
              tableId: tableInfo.id,
              callType: type,
              message: type === 'bill' ? 'Demande addition' : 'Besoin d\'aide'
          });
          alert('Demande envoyée au personnel !');
      } catch (e) {
          alert('Erreur lors de l\'envoi de la demande.');
      }
  }

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
        const existing = prev.find(i => i.menuItemId === itemId);
        if (existing && existing.quantity > 1) {
            return prev.map(i => i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
        }
        return prev.filter(i => i.menuItemId !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
        await api.post(`/tables/${code}/orders`, {
            items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        });
        
        // Success
        alert('Commande envoyée en cuisine !');
        setCart([]);
        setIsCartOpen(false);
        refreshOrders(); // Refresh tracking list immediately
    } catch (error) {
        alert('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
        setSubmitting(false);
    }
  };



  if (loading) return <div className="p-8 text-center text-gray-500">Chargement de la table...</div>;
  if (error) return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
          <div className="text-red-500 mb-4 font-bold">Table introuvable ou inactive.</div>
          <Button 
            variant="secondary"
            onClick={() => {
                localStorage.removeItem('activeTableCode');
                navigate('/');
            }}
          >
              Retour à l'accueil
          </Button>
      </div>
  );

  const activeCategory = menuCategories.find(c => c.id === activeCategoryId);




  return (
    <div className="space-y-6 pb-24">
      {/* Header Table Info */}
      <div className="bg-red-600 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold mb-1">{tableInfo?.name}</h1>
            <p className="opacity-90 text-sm flex items-center gap-1">
                <UtensilsCrossed className="w-4 h-4" /> 
                Zone: {tableInfo?.zone || 'Principale'}
            </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
                <Users className="w-6 h-6" />
            </div>
            <button onClick={handleLeaveTable} className="text-xs text-red-200 underline hover:text-white">
                Quitter
            </button>
        </div>
      </div>

      {/* Quick Actions (Server Calls) */}
      <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-12 shadow-sm"
            onClick={() => handleServerCall('general')}
          >
              <Users className="w-4 h-4 mr-2" />
              Appeler Serveur
          </Button>
          
          {(() => {
              const hasOrders = ongoingOrders.length > 0;
              const allDelivered = ongoingOrders.every((o: any) => o.status === 'delivered');
              const canAskBill = hasOrders && allDelivered;

              return (
                <Button 
                    variant="secondary" 
                    className={`h-12 shadow-sm transition-all ${
                        canAskBill 
                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' 
                        : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed opacity-70'
                    }`}
                    onClick={() => handleServerCall('bill')}
                    disabled={!canAskBill}
                    title={!hasOrders ? "Aucune commande à payer" : !allDelivered ? "Attendez que tout soit servi" : ""}
                >
                    <div className="mr-2 border-2 border-current rounded-sm w-4 h-[10px] relative">
                        <div className="absolute top-[2px] left-0 right-0 h-[1px] bg-current"></div>
                    </div>
                    L'Addition
                </Button>
              );
          })()}
      </div>

       {/* Order Tracking Section (Detailed) */}
       {ongoingOrders.length > 0 && (
           <div className="space-y-4 animate-in slide-in-from-top-2">
               <h3 className="font-bold text-gray-900 flex items-center gap-2">
                   🧾 Commandes de la table
               </h3>
               
               {ongoingOrders.map((order: any) => {
                   // Ensure we handle both structure from API (unitPrice) and potential leftovers
                   const orderItems = order.items.map((item: any) => ({
                       ...item,
                       // API returns unitPrice in OrderItem, mapped as price in CartItem, ensure fallbacks
                       finalPrice: item.unitPrice !== undefined ? item.unitPrice : item.price || 0
                   }));

                   const orderTotal = orderItems.reduce((acc: number, item: any) => acc + (item.finalPrice * item.quantity), 0);
                   
                   return (
                       <div key={order.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                           {/* Order Header */}
                           <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        Commande #{order.dailyNumber || order.id}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                                    order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    order.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                    {order.status === 'pending' ? 'En attente' :
                                     order.status === 'in_progress' ? 'En préparation' : 'Servi'}
                                </span>
                           </div>

                           {/* Order Items */}
                           <div className="p-4 space-y-2">
                               {orderItems.map((item: any) => (
                                   <div key={item.id} className="flex justify-between text-sm">
                                       <div className="text-gray-800">
                                           <span className="font-bold mr-2">{item.quantity}x</span>
                                           {item.menuItem?.name || 'Article'}
                                       </div>
                                       <div className="text-gray-500 font-medium whitespace-nowrap">
                                           {item.finalPrice * item.quantity} FCFA
                                       </div>
                                   </div>
                               ))}
                               
                               <div className="pt-3 mt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                                   <span className="text-xs text-gray-400">Total commande</span>
                                   <span className="font-bold text-gray-900">{orderTotal} FCFA</span>
                               </div>
                               
                               {/* Cancel Button - Only for Pending Orders */}
                               {order.status === 'pending' && (
                                   <button
                                       onClick={() => handleCancelOrder(order.id)}
                                       className="w-full mt-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition-colors"
                                   >
                                       ✕ Annuler cette commande
                                   </button>
                               )}
                           </div>
                       </div>
                   );
               })}
               
               {/* Grand Total Badge */}
               <div className="bg-gray-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                   <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Total à payer</span>
                        <span className="font-bold text-lg">Table {tableInfo?.name}</span>
                   </div>
                   <div className="text-xl font-bold text-green-400">{tableGrandTotal} FCFA</div>
               </div>
           </div>
       )}

      {/* Category Filters (Sticky) */}
      <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-20 overflow-x-auto no-scrollbar flex gap-2">
         {menuCategories.map(cat => (
             <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategoryId === cat.id 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
             >
                 {cat.name}
             </button>
         ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeCategory ? (
            activeCategory.items.map(item => {
              const cartItem = cart.find(i => i.menuItemId === item.id);
              const quantity = cartItem?.quantity || 0;
              
              return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  <p className="text-red-600 font-bold mt-1 text-lg">{item.price} FCFA</p>
                </div>
                
                {quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="h-9 w-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button 
                      size="sm" 
                      onClick={() => addToCart(item)} 
                      variant="secondary"
                      className="h-10 w-10 rounded-full flex items-center justify-center p-0 bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                      <Plus className="w-5 h-5" />
                  </Button>
                )}
              </div>
              );
            })
        ) : (
            <div className="text-center py-12 text-gray-400">Sélectionnez une catégorie</div>
        )}
         {/* Thank You Overlay */}
       {showThankYou && (
           <div className="fixed inset-0 bg-red-600 z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
               <div className="bg-white/20 p-6 rounded-full mb-8 animate-bounce">
                   <Users className="w-16 h-16 text-white" />
               </div>
               <h1 className="text-4xl font-black text-white mb-6 leading-tight">
                   Merci !
               </h1>
               <p className="text-xl text-red-50 font-medium max-w-md leading-relaxed">
                   {thankYouMessage}
               </p>
               <div className="mt-12 w-16 h-1 bg-red-400/50 rounded-full overflow-hidden">
                   <div className="h-full bg-white w-full animate-[progress_8s_linear_forward]"></div>
               </div>
           </div>
       )}
    </div>

      {/* Floating Cart Launcher */}
      {cart.length > 0 && (
        <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-xl flex items-center gap-4 font-bold animate-in slide-in-from-bottom-4 z-50 hover:scale-105 transition-transform"
        >
            <div className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-xs ml-[-4px]">
                {totalItems}
            </div>
            <span>Voir la commande</span>
            <span className="opacity-50">|</span>
            <span>{totalAmount} FCFA</span>
        </button>
      )}

      {/* Cart Modal */}
      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title={`Commande - ${tableInfo?.name}`}>
         <div className="space-y-4">
             {cart.map(item => (
                 <div key={item.menuItemId} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                     <div className="flex-1">
                         <div className="font-medium text-gray-900">{item.name}</div>
                         <div className="text-sm text-gray-500">{item.price * item.quantity} FCFA</div>
                     </div>
                     <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                         <button onClick={() => removeFromCart(item.menuItemId)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                         <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                         <button onClick={() => addToCart({ id: item.menuItemId } as MenuItem)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                     </div>
                 </div>
             ))}

             <div className="border-t border-gray-100 pt-4 mt-4">
                 <div className="flex justify-between text-xl font-bold mb-6 text-gray-900">
                     <span>Total</span>
                     <span>{totalAmount} FCFA</span>
                 </div>

                 <Button onClick={handleCheckout} isLoading={submitting} className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                     Envoyer en cuisine 👨‍🍳
                 </Button>
             </div>
         </div>
      </Modal>
    </div>
  );
}
