import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  categoryId: number;
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

export default function TakeoutPage() {
  const { data: menuData, loading } = useFetch<MenuCategory[]>('/menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(0);
  const navigate = useNavigate();

  // Initialize active category
  useState(() => {
     if (menuData && menuData.length > 0 && activeCategoryId === 0) {
         setActiveCategoryId(menuData[0].id);
     }
  });

  // Update active category when data loads
  if (menuData && menuData.length > 0 && activeCategoryId === 0) {
      setActiveCategoryId(menuData[0].id);
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
        // Sauvegarder le code pour l'utilisateur
        localStorage.setItem('lastPickupCode', pickupCode);
        navigate(`/track/${pickupCode}`);
    } catch (error) {
        alert('Erreur lors de la commande');
    } finally {
        setSubmitting(false);
    }
  };

  const activeCategory = menuData?.find(c => c.id === activeCategoryId);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement du menu...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg mb-8">
        <h1 className="text-2xl font-bold mb-2">À Emporter 🥡</h1>
        <p className="opacity-90">Commandez en ligne, récupérez au comptoir.</p>
      </div>

      {/* Category Filters */}
      <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-20 overflow-x-auto no-scrollbar flex gap-2">
         {menuData?.map(cat => (
             <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategoryId === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
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
                  <p className="text-blue-600 font-bold mt-1 text-lg">{item.price} FCFA</p>
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
                      className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
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
      </div>

      {/* Floating Cart Launcher */}
      {cart.length > 0 && (
        <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-bold animate-in slide-in-from-bottom-4"
        >
            <div className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {totalItems}
            </div>
            <span>Voir le panier</span>
            <span className="opacity-75">|</span>
            <span>{totalAmount} FCFA</span>
        </button>
      )}

      {/* Cart Modal */}
      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Votre Panier">
         <div className="space-y-4">
             {cart.map(item => (
                 <div key={item.menuItemId} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                     <div className="flex-1">
                         <div className="font-medium">{item.name}</div>
                         <div className="text-sm text-gray-500">{item.price * item.quantity} FCFA</div>
                     </div>
                     <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                         <button onClick={() => removeFromCart(item.menuItemId)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="w-3 h-3" /></button>
                         <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                         <button onClick={() => addToCart({ id: item.menuItemId } as MenuItem)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="w-3 h-3" /></button>
                     </div>
                 </div>
             ))}

             <div className="border-t border-gray-100 pt-4 mt-4">
                 <div className="flex justify-between text-lg font-bold mb-6">
                     <span>Total</span>
                     <span>{totalAmount} FCFA</span>
                 </div>

                 <form onSubmit={handleCheckout} className="space-y-4">
                     <Input label="Votre Nom *" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Pour vous appeler" />
                     <Input label="Téléphone (optionnel)" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="06..." />
                     
                     <Button type="submit" isLoading={submitting} className="w-full h-12 text-lg">
                         Commander à emporter
                     </Button>
                 </form>
             </div>
         </div>
      </Modal>
    </div>
  );
}
