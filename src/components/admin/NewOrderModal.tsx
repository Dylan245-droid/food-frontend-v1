import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShoppingBag, Truck, ArrowRight, ArrowLeft, Plus, Minus, Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface Category {
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

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

type OrderType = 'takeout' | 'delivery';
type Step = 'type' | 'client' | 'menu' | 'confirm' | 'success';

// Image URL helper
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9015/api';
const BASE_URL = API_URL.replace('/api', '');

const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

export function NewOrderModal({ isOpen, onClose, onOrderCreated }: NewOrderModalProps) {
  // Steps
  const [step, setStep] = useState<Step>('type');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  
  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('libreville');
  
  // Menu
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Result
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('type');
      setOrderType(null);
      setClientName('');
      setClientPhone('');
      setDeliveryAddress('');
      setDeliveryCity('libreville');
      setCart([]);
      setNotes('');
      setCreatedOrder(null);
    }
  }, [isOpen]);

  // Load menu
  useEffect(() => {
    if (step === 'menu' && categories.length === 0) {
      setLoadingMenu(true);
      api.get('/menu')
        .then(res => {
          // API returns array directly: [{ id, name, items: [...] }, ...]
          const cats = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setCategories(cats.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            items: (cat.items || []).map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              description: item.description,
              imageUrl: item.imageUrl,
            }))
          })));
        })
        .catch((err) => {
          console.error('Menu load error:', err);
          toast.error('Erreur de chargement du menu');
        })
        .finally(() => setLoadingMenu(false));
    }
  }, [step, categories.length]);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart(cart.map(c => {
      if (c.menuItemId === menuItemId) {
        const newQty = c.quantity + delta;
        return { ...c, quantity: Math.max(0, newQty) };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const getItemQuantity = (menuItemId: number) => {
    return cart.find(c => c.menuItemId === menuItemId)?.quantity || 0;
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Ajoutez au moins un article');
      return;
    }

    setSubmitting(true);
    try {
      const items = cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity }));
      
      let response;
      if (orderType === 'takeout') {
        response = await api.post('/orders/takeout', {
          items,
          clientName,
          clientPhone: clientPhone || undefined,
          notes: notes || undefined,
        });
      } else {
        response = await api.post('/orders/delivery', {
          items,
          clientName,
          clientPhone,
          deliveryAddress: deliveryAddress,
          deliveryCity: deliveryCity,
          notes: notes || undefined,
        });
      }

      setCreatedOrder(response.data.order);
      setStep('success');
      onOrderCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (createdOrder?.pickupCode) {
      navigator.clipboard.writeText(createdOrder.pickupCode);
      toast.success('Code copié !');
    }
  };

  const handleNewOrder = () => {
    setStep('type');
    setOrderType(null);
    setClientName('');
    setClientPhone('');
    setDeliveryAddress('');
    setCart([]);
    setNotes('');
    setCreatedOrder(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 'success' ? '' : 'Nouvelle Commande'}>
      <div className="min-h-[400px]">
        
        {/* Step 1: Type Selection */}
        {step === 'type' && (
          <div className="space-y-4">
            <p className="text-stone-600 text-center mb-6">Quel type de commande ?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setOrderType('takeout'); setStep('client'); }}
                className="p-6 rounded-2xl border-2 border-stone-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                </div>
                <span className="font-bold text-stone-900">À Emporter</span>
                <span className="text-xs text-stone-500">Retrait au comptoir</span>
              </button>
              <button
                onClick={() => { setOrderType('delivery'); setStep('client'); }}
                className="p-6 rounded-2xl border-2 border-stone-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <span className="font-bold text-stone-900">Livraison</span>
                <span className="text-xs text-stone-500">Livrer au client</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Client Info */}
        {step === 'client' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
              <span className={`px-2 py-1 rounded-full ${orderType === 'takeout' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {orderType === 'takeout' ? '🥡 À Emporter' : '🛵 Livraison'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Nom du client *</label>
              <Input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nom complet"
                className="h-12"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Téléphone {orderType === 'delivery' && '*'}</label>
              <Input
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="+241 XX XX XX XX"
                className="h-12"
              />
            </div>

            {orderType === 'delivery' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Adresse de livraison *</label>
                  <Input
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Quartier, rue, repères..."
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Ville</label>
                  <select
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="libreville">Libreville</option>
                    <option value="owendo">Owendo</option>
                    <option value="akanda">Akanda</option>
                    <option value="ntoum">Ntoum</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('type')} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button
                onClick={() => setStep('menu')}
                disabled={!clientName || (orderType === 'delivery' && (!clientPhone || !deliveryAddress))}
                className="flex-1 h-12 bg-stone-900 text-white"
              >
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Menu Selection */}
        {step === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">Client: <b>{clientName}</b></span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>

            {loadingMenu ? (
              <div className="py-12 text-center text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Chargement du menu...
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-5 -mx-2 px-2">
                {categories.map(cat => (
                  <div key={cat.id}>
                    <h4 className="font-bold text-stone-900 text-sm mb-2 px-1">{cat.name}</h4>
                    {/* Horizontal scrollable row */}
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {cat.items.map(item => {
                        const qty = getItemQuantity(item.id);
                        return (
                          <div 
                            key={item.id} 
                            className={`flex-shrink-0 w-32 rounded-xl border-2 snap-start transition-all overflow-hidden ${qty > 0 ? 'border-orange-500 bg-orange-50' : 'border-stone-100 bg-white hover:border-stone-300'}`}
                          >
                            {/* Product Image */}
                            <div className="w-full h-20 bg-stone-100 relative">
                              {item.imageUrl ? (
                                <img 
                                  src={getImageUrl(item.imageUrl)} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <ShoppingBag className="w-8 h-8" />
                                </div>
                              )}
                              {qty > 0 && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                                  {qty}
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <p className="font-medium text-stone-900 text-xs truncate">{item.name}</p>
                              <p className="text-[10px] text-stone-500 mb-2">{formatCurrency(item.price)}</p>
                            
                              {qty === 0 ? (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-full py-1.5 rounded-lg bg-stone-900 text-white text-[10px] font-bold hover:bg-stone-800 flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Ajouter
                                </button>
                              ) : (
                                <div className="flex items-center justify-between bg-stone-100 rounded-lg p-0.5">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-6 h-6 rounded-md bg-white flex items-center justify-center hover:bg-stone-50 shadow-sm"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-bold text-xs">{qty}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 shadow-sm"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Notes (optionnel)</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Instructions spéciales..."
                className="h-12"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('client')} className="h-12 px-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitting}
                className="flex-1 h-12 bg-green-600 text-white hover:bg-green-700"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Créer la commande · {formatCurrency(total)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && createdOrder && (
          <div className="text-center py-6 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-stone-900 mb-2">Commande créée !</h2>
              <p className="text-stone-500">#{createdOrder.dailyNumber}</p>
            </div>

            <div className="bg-stone-100 rounded-2xl p-6">
              <p className="text-sm text-stone-500 mb-2">Code de retrait</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black tracking-widest text-stone-900">
                  {createdOrder.pickupCode}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50"
                  title="Copier"
                >
                  <Copy className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <p className="text-sm text-orange-600 font-medium mt-3">
                📞 Dictez ce code au client
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewOrder} className="flex-1 h-12">
                Nouvelle commande
              </Button>
              <Button onClick={onClose} className="flex-1 h-12 bg-stone-900 text-white">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
