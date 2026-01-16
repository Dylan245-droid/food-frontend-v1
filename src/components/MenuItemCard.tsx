import { Minus, Plus, ChefHat } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useBranding } from '../context/BrandingContext';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  inCart: CartItem | undefined;
  onAdd: (item: MenuItem) => void;
  onRemove: (itemId: number) => void;
}

export function MenuItemCard({ item, inCart, onAdd, onRemove }: MenuItemCardProps) {
  const { branding } = useBranding();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt={item.name} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-200">
            <ChefHat className="w-12 h-12 opacity-50" />
          </div>
        )}
        
        {/* Quantity Badge (if in cart) */}
        {inCart && (
          <div className="absolute top-3 right-3 bg-stone-900 text-white font-bold text-xs px-2 py-1 rounded-full shadow-lg">
            x{inCart.quantity}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
            <h3 className="font-bold text-lg text-stone-900 leading-tight mb-1 line-clamp-1" title={item.name}>{item.name}</h3>
            <p className="text-sm text-stone-500 line-clamp-2 mb-3 h-10">{item.description || 'Délicieux plat préparé avec soin.'}</p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-stone-100">
            <span className="font-mono font-bold text-stone-900 text-lg">{formatCurrency(item.price)}</span>
            
            {inCart ? (
                <div className="flex items-center bg-stone-100 rounded-xl p-1 shadow-inner">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} 
                        className="p-1.5 hover:bg-white rounded-lg transition-colors text-stone-600 shadow-sm"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-stone-900">{inCart.quantity}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd(item); }} 
                        className="p-1.5 bg-white rounded-lg transition-colors text-stone-900 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                    className="text-white font-bold text-sm py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[var(--primary-500)]/20 hover:shadow-[var(--primary-500)]/40 hover:-translate-y-0.5"
                    style={{ background: branding?.primaryColor ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor || branding.primaryColor})` : 'var(--primary-gradient)' }}
                >
                    Ajouter <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
