import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ChefHat, ArrowLeft, Bike, ShoppingBag as BagIcon, MapPin, Loader2 } from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import axios from 'axios';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

const CITIES = ['Libreville', 'Akanda', 'Owendo', 'Ntoum'];

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
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
  
  // Order Details
  const { branding } = useBranding();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState(''); // Required for delivery
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('Libreville');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
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

  // Calculate Delivery Fee
  const deliveryFee = isDelivery 
    ? parseInt(branding?.[`fee_${deliveryCity.toLowerCase()}` as keyof typeof branding] as string || '1000') 
    : 0;
  
  const grandTotal = totalAmount + deliveryFee;

  const handleGeolocation = () => {
        if (!navigator.geolocation) {
            toast.error("La géolocalisation n'est pas supportée");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            setDeliveryLat(latitude);
            setDeliveryLng(longitude);
            
            try {
                // Reverse Geocoding with OpenStreetMap
                const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: { 'User-Agent': 'FiafioApp/1.0' }
                });
                if (res.data && res.data.display_name) {
                    setDeliveryAddress(res.data.display_name);
                    toast.success("Adresse trouvée !");
                } else {
                     setDeliveryAddress(`Position GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                     toast.success("Position GPS enregistrée");
                }
            } catch (error) {
                console.error("Geocoding error", error);
                setDeliveryAddress(`Position GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                toast.success("Position GPS enregistrée");
            } finally {
                setIsLocating(false);
            }
        }, (error) => {
            console.error(error);
            toast.error("Impossible de récupérer votre position");
            setIsLocating(false);
        });
    };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
        let res;
        if (isDelivery) {
            // Delivery Order
            res = await api.post('/orders/delivery', {
                items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                clientName,
                clientPhone,
                deliveryAddress,
                deliveryCity,
                deliveryLat,
                deliveryLng,
                notes: 'Commande WEB Livraison'
            });
        } else {
            // Takeout Order
            res = await api.post('/orders/takeout', {
                items: cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                clientName,
                clientPhone,
                notes: 'Commande à emporter WEB'
            });
        }
        
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="animate-pulse flex flex-col items-center"><ChefHat className="w-12 h-12 text-stone-300 mb-4" /><div className="h-2 w-32 bg-stone-200 rounded"></div></div></div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
       {/* Header with Categories - Mobile Horizontal Scroll */}
       <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-stone-200">
           <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                  <div className="bg-stone-900 text-white p-2 rounded-xl">
                      <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                      <h1 className="font-black text-xl text-stone-900 leading-none tracking-tight">Chez Alice</h1>
                      <p className="text-xs text-stone-500 font-medium mt-1">La carte gourmande</p>
                  </div>
              </div>
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">
                  <ShoppingBag className="w-6 h-6 text-stone-800" />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[var(--primary-500)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{totalItems}</span>}
              </button>
           </div>
           
           <div className="flex overflow-x-auto px-4 pb-0 no-scrollbar gap-2 snap-x">
               {menuData?.map(cat => (
                   <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`whitespace-nowrap pb-3 px-1 text-sm font-bold border-b-2 transition-all snap-start ${
                            activeCategoryId === cat.id 
                            ? 'border-stone-900 text-stone-900' 
                            : 'border-transparent text-stone-400 hover:text-stone-600'
                        }`}
                   >
                       {cat.name}
                   </button>
               ))}
           </div>
       </div>

       {/* Content */}
       <div className="p-4 space-y-4">
            {activeCategory?.items.map(item => { // Corrected: activeCategory?.items
                const inCart = cart.find(i => i.menuItemId === item.id);
                return (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100/50 flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="h-24 w-24 bg-stone-100 rounded-xl shrink-0 overflow-hidden relative">
                             {item.imageUrl ? (
                                 <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-stone-300">
                                     <ChefHat className="w-8 h-8 opacity-20" />
                                 </div>
                             )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-stone-900 leading-tight">{item.name}</h3>
                                    <span className="font-mono font-bold text-stone-900">{formatCurrency(item.price)}</span>
                                </div>
                                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description || 'Délicieux plat préparé avec soin.'}</p>
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                {inCart ? (
                                    <div className="flex items-center bg-stone-900 text-white rounded-lg p-1 shadow-lg shadow-stone-900/20">
                                        <button onClick={() => removeFromCart(item.id)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                        <span className="w-8 text-center font-bold text-sm">{inCart.quantity}</span>
                                        <button onClick={() => addToCart(item)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        Ajouter <Plus className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
       </div>

       {/* Floating Cart Button */}
       {cart.length > 0 && (
         <div className="fixed bottom-6 left-6 right-6 md:w-[400px] md:left-1/2 md:-translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
             <button 
                onClick={() => setIsCartOpen(true)}
                style={{ 
                    background: branding?.primaryColor ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor || branding.primaryColor})` : 'var(--primary-gradient)' 
                }}
                className="w-full text-white p-4 rounded-2xl shadow-xl shadow-[var(--primary-500)]/30 flex justify-between items-center hover:scale-[1.02] transition-transform"
             >
                 <div className="flex items-center gap-3">
                     <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <ShoppingBag className="w-6 h-6" />
                     </div>
                     <div className="text-left leading-tight">
                         <div className="font-black uppercase tracking-wide text-xs opacity-90">Voir le panier</div>
                         <div className="font-bold">{totalItems} articles</div>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <span className="font-mono text-lg">{formatCurrency(totalAmount)}</span>
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
             <div className="bg-stone-50 rounded-2xl p-4 max-h-[30vh] overflow-y-auto no-scrollbar space-y-3 border border-stone-100">
                {cart.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-center py-2 border-b border-stone-200/50 last:border-0">
                        <div className="flex-1">
                            <div className="font-bold text-stone-800">{item.name}</div>
                            <div className="text-xs text-stone-500 font-mono">{formatCurrency(item.price * item.quantity)}</div>
                        </div>
                        <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-stone-100">
                            <button onClick={() => removeFromCart(item.menuItemId)} className="p-1 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-red-500"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-4 text-center text-stone-700">{item.quantity}</span>
                            <button onClick={() => addToCart({ id: item.menuItemId } as MenuItem)} className="p-1 hover:bg-stone-50 rounded-lg transition-colors text-stone-600 hover:text-[var(--primary-500)]"><Plus className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="border-t-2 border-dashed border-stone-200 pt-6">
                 <div className="flex p-1 bg-stone-100 rounded-xl mb-6">
                     <button
                        type="button" 
                        onClick={() => setIsDelivery(false)}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isDelivery ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                     >
                        <BagIcon className="w-4 h-4" /> A Emporter
                     </button>
                     <button
                        type="button" 
                        onClick={() => setIsDelivery(true)}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${isDelivery ? 'bg-white text-[var(--primary-600)] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                     >
                        <Bike className="w-4 h-4" /> Livraison
                     </button>
                 </div>

                 <form onSubmit={handleCheckout} className="space-y-4">
                     <Input 
                        label="Votre Nom" 
                        value={clientName} 
                        onChange={e => setClientName(e.target.value)} 
                        required 
                        placeholder="Comment vous appeler ?" 
                        className="bg-stone-50 border-stone-200 focus:border-[var(--primary-500)] focus:ring-[var(--primary-100)]" 
                     />
                     
                     <Input 
                        label={isDelivery ? "Téléphone (Requis pour livraison)" : "Téléphone (Optionnel)"} 
                        value={clientPhone} 
                        onChange={e => setClientPhone(e.target.value)} 
                        required={isDelivery}
                        placeholder="06..." 
                        className="bg-stone-50 border-stone-200 focus:border-[var(--primary-500)] focus:ring-[var(--primary-100)]" 
                     />

                     {isDelivery && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Ville de livraison <span className="text-red-500">*</span></label>
                                 <div className="grid grid-cols-2 gap-2">
                                      {CITIES.map(city => (
                                          <button
                                              key={city}
                                              type="button"
                                              onClick={() => setDeliveryCity(city)}
                                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                  deliveryCity === city 
                                                  ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                                                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                                              }`}
                                          >
                                              {city}
                                          </button>
                                      ))}
                                 </div>
                             </div>

                             <div className="relative">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                    Adresse de livraison <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                                    <textarea 
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-100)] transition-all resize-none text-sm font-medium"
                                        rows={2}
                                        placeholder="Ex: Ancien Sobraga, après le pont, maison bleue..."
                                        value={deliveryAddress}
                                        onChange={e => setDeliveryAddress(e.target.value)}
                                        required={isDelivery}
                                    />
                                </div>
                                <p className="text-[10px] text-stone-400 mt-1 pl-1">Décrivez votre adresse avec des repères (quartier, carrefour, point connu...)</p>
                             </div>

                             {/* Optional GPS Section */}
                             <div className="bg-stone-100/50 p-3 rounded-xl border border-dashed border-stone-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-stone-600">📍 Ajouter ma position GPS <span className="font-normal text-stone-400">(facultatif)</span></p>
                                        <p className="text-[10px] text-stone-400 mt-0.5">Aide le livreur à vous trouver plus facilement sur la carte</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleGeolocation}
                                        disabled={isLocating}
                                        className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                    >
                                        {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-[var(--primary-600)]" />}
                                        {deliveryLat ? '✓ Position enregistrée' : 'Localiser'}
                                    </button>
                                </div>
                             </div>
                         </div>
                     )}

                     {/* Summary */}
                     <div className="bg-stone-50 p-4 rounded-xl space-y-2 mt-4 border border-stone-100">
                          <div className="flex justify-between items-center text-stone-500 text-sm">
                              <span>Sous-total</span>
                              <span className="font-mono">{formatCurrency(totalAmount)}</span>
                          </div>
                          {isDelivery && (
                              <div className="flex justify-between items-center text-[var(--primary-700)] text-sm animate-in slide-in-from-right-2">
                                  <span className="flex items-center gap-2"><Bike className="w-4 h-4" /> Livraison ({deliveryCity})</span>
                                  <span className="font-mono font-bold">+{formatCurrency(deliveryFee)}</span>
                              </div>
                          )}
                          <div className="flex justify-between items-center text-xl font-black text-stone-900 pt-3 border-t border-stone-200/50 mt-2">
                              <span>Total à payer</span>
                              <span className="font-mono">{formatCurrency(grandTotal)}</span>
                          </div>
                     </div>
                     
                     <Button type="submit" isLoading={submitting} className="w-full h-14 text-lg bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold shadow-xl shadow-stone-900/10 mt-4">
                         {isDelivery ? 'Valider la livraison' : 'Valider la commande'}
                     </Button>
                 </form>
             </div>
          </div>
       </Modal>
    </div>
  );
}
