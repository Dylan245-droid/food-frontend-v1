import { useState, useMemo, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, UtensilsCrossed, Bell, Receipt, CheckCircle, Clock, XCircle, ChefHat } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';

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
  const { branding } = useBranding();
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
  const [isActiveOrdersOpen, setIsActiveOrdersOpen] = useState(false);

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
      branding.thankYouMessage,
      "Nous espérons que vous avez passé un excellent moment.",
      "Toute l'équipe vous remercie. Revenez nous voir vite !",
      "Un grand merci ! Nous avons hâte de vous régaler à nouveau."
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
          const msg = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)];
          setThankYouMessage(msg);
          setShowThankYou(true);
          localStorage.removeItem('activeTableCode');
          const timer = setTimeout(() => {
              navigate('/');
          }, 8000);
          return () => clearTimeout(timer);
      }
  }, [ongoingOrders, hasPlacedOrders, loading]);

  const handleLeaveTable = async () => {
     const hasUnpaidServedOrders = ongoingOrders.some((o: any) => o.status === 'delivered');
     
     if (hasUnpaidServedOrders) {
         alert(`Impossible de quitter la table ${tableInfo?.name || ''} !\n\nVous avez des commandes servies non réglées. Veuillez demander l'addition.`);
         return;
     }

     if (window.confirm('Voulez-vous libérer la table ?\n\n⚠️ Si vous avez des commandes en attente, elles seront annulées.')) {
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

  const handleCancelOrder = async (orderId: number) => {
     if (window.confirm('Annuler cette commande ?\n\nCette action est irréversible.')) {
         try {
             await api.post(`/orders/${orderId}/cancel`);
             refreshOrders();
         } catch(e) {
             alert('Erreur lors de l\'annulation');
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
        alert('Commande envoyée en cuisine !');
        setCart([]);
        setIsCartOpen(false);
        refreshOrders();
    } catch (error) {
        alert('Erreur lors de la commande.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F3]">
          <div className="animate-pulse flex flex-col items-center text-stone-400">
              <UtensilsCrossed className="w-12 h-12 mb-4" />
              <span className="font-medium">Dressage de la table...</span>
          </div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 max-w-sm">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <XCircle className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-stone-900 mb-2">Table introuvable</h2>
             <p className="text-stone-500 mb-6">Le code table semble incorrect ou la session est expirée.</p>
             <Button onClick={() => { localStorage.removeItem('activeTableCode'); navigate('/'); }} className="w-full">
                 Retour à l'accueil
             </Button>
          </div>
      </div>
  );

  const activeCategory = menuCategories.find(c => c.id === activeCategoryId);

  const renderOngoingOrdersList = () => (
      <div className="space-y-3">
           {ongoingOrders.map((order: any) => {
               const orderItems = order.items.map((item: any) => ({
                   ...item,
                   finalPrice: item.unitPrice !== undefined ? item.unitPrice : item.price || 0
               }));
               const isPending = order.status === 'pending';
               const isInProgress = order.status === 'in_progress';

               return (
                   <div key={order.id} className="bg-stone-50/50 border border-stone-100 rounded-xl p-3 relative">
                       <div className={`absolute left-0 top-3 bottom-3 w-1 ${
                           isPending ? 'bg-yellow-400' : isInProgress ? 'bg-blue-400' : 'bg-green-400'
                       } rounded-r-full`}></div>

                       <div className="flex justify-between items-start mb-2 pl-3">
                           <span className="text-xs font-mono text-stone-400">#{order.dailyNumber || order.id}</span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isPending ? 'bg-yellow-100 text-yellow-700' : 
                                isInProgress ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                           }`}>
                               {isPending ? 'Reçu' : isInProgress ? 'Prépa' : 'Servi'}
                           </span>
                       </div>

                       <div className="space-y-1 mb-2 pl-3">
                           {orderItems.map((item: any) => (
                               <div key={item.id} className="flex justify-between text-xs">
                                   <span className="text-stone-700">
                                       <span className="font-bold mr-1">{item.quantity}x</span> 
                                       {item.menuItem?.name}
                                   </span>
                               </div>
                           ))}
                       </div>

                       {isPending && (
                           <button 
                               onClick={() => handleCancelOrder(order.id)}
                               className="text-[10px] text-red-400 hover:text-red-600 font-medium underline decoration-red-200 underline-offset-2 pl-3"
                           >
                               Annuler
                           </button>
                       )}
                   </div>
               );
           })}
           
           <div className="bg-stone-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg mt-4">
                <span className="text-stone-400 text-xs font-medium">Total table</span>
                <span className="font-mono text-lg font-bold">{tableGrandTotal} <span className="text-xs opacity-50">FCFA</span></span>
           </div>
      </div>
  );

  return (
    <div className="min-h-screen text-stone-800 pb-12 overflow-x-hidden relative" style={{ background: 'var(--bg-app)' }}>
      
       {/* Background Decoration */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-multiply opacity-30" style={{ background: 'var(--primary-100)' }}></div>
          <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-multiply opacity-30" style={{ background: 'var(--secondary-100)' }}></div>
       </div>

       <div className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-8">
           
           {/* Header Card - Ticket Style */}
           <header className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-stone-100 mb-6 relative overflow-hidden md:flex md:justify-between md:items-center">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--gradient-brand)' }}></div>
                
                <div className="flex justify-between items-start w-full">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-stone-200">
                                Zone {tableInfo?.zone || 'Principale'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-stone-900">{tableInfo?.name}</h1>
                    </div>
                    
                    <button onClick={handleLeaveTable} className="text-xs text-stone-400 font-medium hover:text-red-500 transition-colors border border-dashed border-stone-200 px-3 py-1.5 rounded-lg md:ml-auto">
                        Libérer la table
                    </button>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6 md:mt-0 md:ml-6 md:w-auto md:flex">
                    <button 
                        onClick={() => handleServerCall('general')}
                        className="flex items-center justify-center gap-2 py-3 px-6 bg-stone-50 hover:bg-[var(--primary-50)] text-stone-600 hover:text-[var(--primary-700)] rounded-xl transition-colors text-sm font-bold border border-stone-100 md:w-auto"
                        style={{ '--primary-50': 'var(--primary-50)', '--primary-700': 'var(--primary-700)' } as React.CSSProperties}
                    >
                        <Bell className="w-4 h-4" />
                        Appeler
                    </button>
                    
                    {(() => {
                        const hasOrders = ongoingOrders.length > 0;
                        const allDelivered = ongoingOrders.every((o: any) => o.status === 'delivered');
                        const canAskBill = hasOrders && allDelivered;

                        return (
                            <button 
                                onClick={() => handleServerCall('bill')}
                                disabled={!canAskBill}
                                className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border transition-colors md:w-auto ${
                                    canAskBill 
                                    ? 'bg-stone-50 hover:bg-green-50 text-stone-600 hover:text-green-600 border-stone-100' 
                                    : 'bg-stone-50/50 text-stone-300 border-transparent cursor-not-allowed'
                                }`}
                            >
                                <Receipt className="w-4 h-4" />
                                L'Addition
                            </button>
                        );
                    })()}
                </div>
           </header>

           <div className="flex flex-col lg:flex-row gap-8 items-start">
               {/* Menu Section */}
               <div className="flex-1 w-full">
                   {/* Menu Categories */}
                   <div className="sticky top-0 bg-[#FFF8F3]/95 backdrop-blur-sm pt-2 pb-6 z-20 overflow-x-auto no-scrollbar flex gap-2 -mx-4 px-4 mask-linear-fade md:mx-0 md:px-0">
                        {menuCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategoryId(cat.id)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border
                                    ${activeCategoryId === cat.id 
                                        ? 'text-white shadow-md transform -translate-y-0.5 border-transparent' 
                                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700'
                                    }
                                `}
                                style={activeCategoryId === cat.id ? { background: 'var(--primary-900)' } : undefined}

                            >
                                {cat.name}
                            </button>
                        ))}
                   </div>

                   {/* Menu Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-6">
                        {activeCategory ? (
                            activeCategory.items.map(item => {
                                const cartItem = cart.find(i => i.menuItemId === item.id);
                                const quantity = cartItem?.quantity || 0;
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => addToCart(item)}
                                        className="group bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 flex flex-col"
                                    >
                                        {/* Image Area */}
                                        <div className="h-40 bg-stone-100 relative overflow-hidden">
                                             {item.imageUrl ? (
                                                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                             ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                                                    <UtensilsCrossed className="w-12 h-12 opacity-50" />
                                                </div>
                                             )}
                                             {/* Dark Gradient for Text Readability if we wanted overlay, but here we keep text below */}
                                             {quantity > 0 && (
                                                 <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-900/20 animate-in zoom-in">
                                                     {quantity} commandé(s)
                                                 </div>
                                             )}
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-stone-900 text-lg leading-tight flex-1">{item.name}</h3>
                                                <span className="font-black text-lg whitespace-nowrap ml-3" style={{ color: 'var(--primary-600)' }}>
                                                    {item.price} <span className="text-xs font-bold text-stone-400">FCFA</span>
                                                </span>
                                            </div>
                                            
                                            <p className="text-sm text-stone-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                                                {item.description || "Délicieuse préparation maison."}
                                            </p>
                                            
                                            <div className="mt-auto pt-4 border-t border-dashed border-stone-100 flex items-center justify-between">
                                                {quantity === 0 ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                                        className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-600 font-bold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Ajouter
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-stone-900 p-1.5 rounded-xl text-white w-full justify-between shadow-lg shadow-stone-900/10">
                                                         <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="w-10 h-9 flex items-center justify-center bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                                                         <span className="font-bold text-lg">{quantity}</span>
                                                         <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="w-10 h-9 flex items-center justify-center bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                                                         <span className="font-bold text-lg">{quantity}</span>
                                                         <button 
                                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }} 
                                                            className="w-10 h-9 flex items-center justify-center rounded-lg transition-colors text-white"
                                                            style={{ background: 'var(--primary)', color: 'white' }}
                                                         >
                                                            <Plus className="w-4 h-4" />
                                                         </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-24 text-center text-stone-400">
                                 <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                 <p className="text-xl font-bold opacity-50">La carte est vide.</p>
                            </div>
                        )}
                   </div>
               </div>

               {/* Ongoing Orders Sidebar (Desktop) / Top block (Mobile) */}
               {/* Ongoing Orders Sidebar (Desktop Only) */}
               {ongoingOrders.length > 0 && (
                   <div className="hidden lg:block lg:w-80 lg:sticky lg:top-6 lg:order-last animate-in slide-in-from-right-4 duration-700">
                       <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
                           <div className="flex items-center gap-2 mb-4 px-1">
                               <Clock className="w-4 h-4 text-stone-400" />
                               <h3 className="font-bold text-stone-500 text-sm uppercase tracking-wide">Commandes suivies</h3>
                           </div>
                           {renderOngoingOrdersList()}
                       </div>
                   </div>
               )}


           {/* Floating Active Orders Button (Mobile/Tablet) */}
           {ongoingOrders.length > 0 && (
                <>
                    <div className={"fixed z-30 transition-all duration-300 " + (cart.length > 0 ? 'bottom-28' : 'bottom-6') + " right-4 lg:hidden animate-in slide-in-from-bottom-20"}>
                        <button 
                            onClick={() => setIsActiveOrdersOpen(true)}
                            className="bg-white text-stone-900 p-3 rounded-full shadow-xl border-2 hover:scale-110 transition-transform flex items-center justify-center relative group"
                            style={{ borderColor: 'var(--primary-100)' }}
                        >
                             <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--primary)' }}></div>
                             <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {ongoingOrders.length}
                             </div>
                             <ChefHat className="w-6 h-6" style={{ color: 'var(--primary-600)' }} />
                        </button>
                    </div>

                    <Modal isOpen={isActiveOrdersOpen} onClose={() => setIsActiveOrdersOpen(false)} title="Suivi Cuisine">
                        <div className="space-y-4">
                             <div className="p-4 rounded-xl border flex items-start gap-3 mb-4" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                                 <Clock className="w-5 h-5 mt-0.5" style={{ color: 'var(--primary-600)' }} />
                                 <div>
                                     <h4 className="font-bold text-sm" style={{ color: 'var(--primary-900)' }}>En préparation</h4>
                                     <p className="text-xs leading-relaxed" style={{ color: 'var(--primary-700)' }}>
                                         Vos commandes sont en train d'être cuisinées avec amour.
                                     </p>
                                 </div>
                             </div>
                             {renderOngoingOrdersList()}
                        </div>
                    </Modal>
                </>
           )}
           </div>

           {/* Cart Launcher */}
           {cart.length > 0 && (
                <div className="fixed bottom-6 inset-x-0 px-4 pointer-events-none z-30">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full max-w-md mx-auto pointer-events-auto bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-stone-900" style={{ background: 'var(--primary)' }}>
                                {totalItems}
                            </div>
                            <span className="font-bold">Voir mon plateau</span>
                        </div>
                        <span className="font-mono font-bold text-lg">{totalAmount} FCFA</span>
                    </button>
                </div>
            )}

            {/* Cart Modal */}
            <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Votre Plateau">
                <div className="space-y-6">
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {cart.map(item => (
                            <div key={item.menuItemId} className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-stone-900">{item.name}</div>
                                    <div className="text-sm text-stone-500">{item.price} FCFA</div>
                                </div>
                                <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-1 border border-stone-100">
                                    <button onClick={() => removeFromCart(item.menuItemId)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-stone-200 text-stone-500"><Minus className="w-4 h-4" /></button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => addToCart({ id: item.menuItemId } as MenuItem)} className="w-8 h-8 flex items-center justify-center bg-stone-800 text-white rounded-md shadow-md"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-stone-200 pt-6">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-stone-500 font-medium">Total commande</span>
                            <span className="text-3xl font-black text-stone-900">{totalAmount} <span className="text-sm font-normal text-stone-400">FCFA</span></span>
                        </div>

                        <Button onClick={handleCheckout} isLoading={submitting} className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200">
                            Envoyer en cuisine 👨‍🍳
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Thank You Overlay */}
            {showThankYou && (
               <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                   <div className="bg-white/10 p-6 rounded-full mb-8">
                       <CheckCircle className="w-16 h-16 text-green-400" />
                   </div>
                   <h1 className="text-4xl font-black text-white mb-6 leading-tight">Merci !</h1>
                   <p className="text-xl text-stone-300 font-medium max-w-md leading-relaxed mb-12">
                       {thankYouMessage}
                   </p>
                   <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                       <div className="h-full bg-green-400 w-full animate-[progress_8s_linear_forward]"></div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
}
