import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ChefHat, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
}

// ... (keep MenuCategory and CartItem interfaces)

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

export default function TakeoutPage() {
  // ... (keep state and effects)
  const { data: menuData, loading } = useFetch<MenuCategory[]>('/menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const navigate = useNavigate();

  // Initialize active category
  useEffect(() => {
     if (menuData && menuData.length > 0 && activeCategoryId === 0) {
         setActiveCategoryId(menuData[0].id);
     }
  }, [menuData, activeCategoryId]);

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
        const res = await api.post('/orders/takeout', {
            items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
            clientName,
            clientPhone,
            notes: 'Commande à emporter WEB'
        });
        
        const pickupCode = res.data.order.pickupCode;
        localStorage.setItem('lastPickupCode', pickupCode);
        navigate(`/track/${pickupCode}`);
    } catch (error) {
        alert('Erreur lors de la commande');
    } finally {
        setSubmitting(false);
    }
  };

  const activeCategory = menuData?.find(c => c.id === activeCategoryId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-orange-600 bg-[#FFF8F3]">
        <div className="animate-bounce">
            <ChefHat className="w-12 h-12 mb-2 mx-auto opacity-50" />
            <p className="font-bold text-lg">Préparation du menu...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F3] text-stone-800 pb-24 relative overflow-x-hidden">
        {/* Background Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-orange-100/40 rounded-full blur-[80px] mix-blend-multiply"></div>
            <div className="absolute top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-yellow-100/40 rounded-full blur-[80px] mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center text-stone-500 hover:text-orange-600 transition-colors bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </button>

            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                        <h1 className="text-4xl md:text-5xl font-black text-stone-900 leading-tight font-display tracking-tight">
                        À Emporter <span className="text-orange-500">.</span>
                    </h1>
                    <p className="text-stone-500 mt-2 font-medium text-lg">Les saveurs créoles, directement chez vous.</p>
                </div>
                <div className="bg-orange-100 p-4 rounded-full rotate-3 shadow-lg shadow-orange-100 hidden md:block">
                    <ShoppingBag className="w-8 h-8 text-orange-600" />
                </div>
            </header>

            {/* Category Filters - Horizontal Scroll with Organic Style */}
            <div className="sticky top-0 bg-[#FFF8F3]/95 backdrop-blur-sm pt-2 pb-6 z-20 overflow-x-auto no-scrollbar flex gap-3 -mx-4 px-4 mask-linear-fade md:mx-0 md:px-0">
                {menuData?.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`
                            px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300
                            ${activeCategoryId === cat.id 
                                ? 'bg-stone-900 text-white shadow-xl shadow-stone-900/20 scale-105' 
                                : 'bg-white text-stone-600 border border-stone-100 hover:bg-orange-50 hover:border-orange-100 hover:text-orange-600 shadow-sm'
                            }
                        `}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {activeCategory ? (
                    activeCategory.items.map(item => {
                    const cartItem = cart.find(i => i.menuItemId === item.id);
                    const quantity = cartItem?.quantity || 0;
                    
                    return (
                    <div 
                        key={item.id} 
                        onClick={() => addToCart(item)}
                        className="group bg-white rounded-[2rem] shadow-sm border border-stone-100 hover:border-orange-200 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden cursor-pointer flex flex-col h-full"
                    >
                         {/* Image Header */}
                         <div className="h-48 bg-stone-100 relative overflow-hidden shrink-0">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                                    <ChefHat className="w-16 h-16 opacity-50" />
                                </div>
                            )}
                            
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         </div>
                        
                        <div className="p-5 flex flex-col flex-1 relative">
                             {/* Floating Price Tag */}
                            <div className="absolute -top-6 right-4 bg-white shadow-lg shadow-stone-200/50 px-4 py-2 rounded-2xl border border-stone-50 flex flex-col items-center min-w-[4rem]">
                                <span className="font-black text-xl text-stone-900 leading-none">{item.price}</span>
                                <span className="text-[10px] font-bold text-stone-400 uppercase">FCFA</span>
                            </div>

                            <h3 className="font-black text-xl text-stone-900 mb-2 font-display pr-16 leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h3>
                            
                            {item.description && (
                                <p className="text-sm text-stone-500 leading-relaxed mb-4 line-clamp-2 flex-1 font-medium">{item.description}</p>
                            )}
                            
                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-dashed border-stone-100">
                                {quantity > 0 ? (
                                    <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl shadow-lg shadow-stone-900/10 w-full justify-between animate-in zoom-in duration-200">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                            className="h-10 w-12 rounded-lg bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-black text-white text-lg w-full text-center">{quantity}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                            className="h-10 w-12 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                        variant="secondary"
                                        className="w-full h-12 rounded-xl bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-600 font-bold border-transparent hover:shadow-lg transition-all"
                                    >
                                        Ajouter au panier
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    );
                    })
                ) : (
                    <div className="col-span-full py-24 text-center text-stone-400">
                         <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                         <p className="text-xl font-bold opacity-50">La carte est vide pour le moment.</p>
                    </div>
                )}
            </div>
      </div>

      {/* Floating Cart Launcher - Glassmorpism */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 w-full px-6 pointer-events-none z-30">
            <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full pointer-events-auto max-w-md mx-auto bg-stone-900/90 text-white p-4 rounded-3xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-10 group"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-900/20 group-hover:scale-110 transition-transform">
                        {totalItems}
                    </div>
                    <span className="font-bold">Voir le panier</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-lg">{totalAmount} <span className="text-xs opacity-60">FCFA</span></span>
                    <div className="bg-white/10 p-2 rounded-full">
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                </div>
            </button>
        </div>
      )}

      {/* Cart Modal - Styled */}
      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Votre Panier Gourmand">
         <div className="space-y-6">
             <div className="bg-stone-50 rounded-2xl p-4 max-h-[40vh] overflow-y-auto no-scrollbar space-y-3 border border-stone-100">
                {cart.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-center py-2 border-b border-stone-200/50 last:border-0">
                        <div className="flex-1">
                            <div className="font-bold text-stone-800">{item.name}</div>
                            <div className="text-xs text-stone-500 font-mono">{item.price * item.quantity} FCFA</div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-stone-100">
                            <button onClick={() => removeFromCart(item.menuItemId)} className="p-1 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-red-500"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-4 text-center text-stone-700">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.menuItemId } as MenuItem)} className="p-1 hover:bg-stone-50 rounded-lg transition-colors text-stone-600 hover:text-orange-500"><Plus className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="border-t-2 border-dashed border-stone-200 pt-6">
                 <div className="flex justify-between items-end mb-8">
                     <span className="text-stone-500 font-medium">Total à payer</span>
                     <span className="text-3xl font-black text-stone-900 tracking-tight">{totalAmount} <span className="text-sm font-normal text-stone-400">FCFA</span></span>
                 </div>

                 <form onSubmit={handleCheckout} className="space-y-4">
                     <Input label="Votre Nom" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Comment vous appeler ?" className="bg-stone-50 border-stone-200 focus:border-orange-500 focus:ring-orange-100" />
                     <Input label="Téléphone (optionnel)" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="06..." className="bg-stone-50 border-stone-200 focus:border-orange-500 focus:ring-orange-100" />
                     
                     <Button type="submit" isLoading={submitting} className="w-full h-14 text-lg bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold shadow-xl shadow-stone-900/10 mt-4">
                         Valider la commande
                     </Button>
                 </form>
             </div>
         </div>
      </Modal>
    </div>
  );
}
