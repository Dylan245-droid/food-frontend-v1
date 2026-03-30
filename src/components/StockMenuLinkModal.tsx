import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search,
  Utensils,
  ChevronDown,
  Link
} from 'lucide-react';
import api from '../lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface MenuItem {
  id: number;
  name: string;
  category?: { name: string };
  price: number;
}

interface StockLink {
  menuItemId: number;
  quantity: number;
  menuItem?: MenuItem;
}

interface StockMenuLinkModalProps {
  stockItemId: number;
  stockItemName: string;
  stockItemUnit: string;
  onClose: () => void;
}

const CONTAINERS = [
  { label: 'Unité', factor: 1 },
  { label: 'Demi (0.5)', factor: 0.5 },
  { label: 'Quart (0.25)', factor: 0.25 },
  { label: 'Verre (0.12)', factor: 0.12 },
  { label: 'Pack (6)', factor: 6 },
  { label: 'Carton (12)', factor: 12 },
  { label: 'Casier (24)', factor: 24 },
];

export function StockMenuLinkModal({ stockItemId, stockItemName, stockItemUnit, onClose }: StockMenuLinkModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [links, setLinks] = useState<StockLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, linksRes] = await Promise.all([
          api.get('/admin/menu/items'),
          api.get(`/admin/stock/items/${stockItemId}/links`) 
        ]);
        
        setMenuItems(menuRes.data.data || []);
        
        if (linksRes.data.links) {
          setLinks(linksRes.data.links.map((l: StockLink) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            menuItem: l.menuItem
          })));
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des liaisons");
      } finally {
        setLoading(false);
      }
    };

    if (stockItemId) {
        fetchData();
    }
  }, [stockItemId]);

  const handleAddLink = (menuItem: MenuItem) => {
    if (links.some(l => l.menuItemId === menuItem.id)) {
        toast.error("Ce plat est déjà lié");
        return;
    }
    setLinks([...links, { menuItemId: menuItem.id, quantity: 1, menuItem }]);
    setSearchTerm('');
  };

  const handleRemoveLink = (menuItemId: number) => {
    setLinks(links.filter((l: StockLink) => l.menuItemId !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    setLinks(links.map((l: StockLink) => 
      l.menuItemId === menuItemId ? { ...l, quantity } : l
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/stock/items/${stockItemId}/links`, {
        links: links.map((l: StockLink) => ({ menuItemId: l.menuItemId, quantity: l.quantity }))
      });
      toast.success("Liaisons menu mises à jour");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item: MenuItem) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !links.some((l: StockLink) => l.menuItemId === item.id)
  );

  if (loading) return <div className="p-8 text-center text-stone-400 font-black uppercase tracking-widest text-[10px]">Chargement des cartes...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex gap-3 items-start">
        <Link className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
        <p className="text-stone-600 text-[11px] font-bold leading-relaxed uppercase tracking-wide">
          Définissez quels plats du menu utilisent <span className="text-stone-900 font-black">"{stockItemName}"</span>. 
          Le stock sera déduit automatiquement à chaque vente.
        </p>
      </div>

      {/* Linked Menu Items */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center justify-between">
            Plats liés à cet article
            <span className="bg-stone-100 px-2.5 py-0.5 rounded-full text-stone-600">{links.length}</span>
        </h4>
        
        {links.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center text-stone-300 gap-3 px-6 text-center">
                <Utensils className="w-10 h-10 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Cet article n'est pas encore présent dans le menu.<br/>
                    Cherchez un plat ci-dessous pour le lier.
                </p>
            </div>
        ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {links.map((link: StockLink) => {
                    const item = link.menuItem || menuItems.find((m: MenuItem) => m.id === link.menuItemId);
                    if (!item) return null;
                    return (
                        <div key={link.menuItemId} className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-stone-100 group hover:border-stone-200 transition-all shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black text-stone-900 uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[9px] font-bold text-stone-400 uppercase">{item.category?.name || 'Menu'}</p>
                                </div>
                                <button 
                                    onClick={() => handleRemoveLink(link.menuItemId)}
                                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-50">
                                <div className="flex-1 min-w-[120px]">
                                    <div className="relative group/select">
                                        <select 
                                            onChange={(e) => handleUpdateQuantity(link.menuItemId, parseFloat(e.target.value))}
                                            className="w-full h-10 pl-3 pr-8 bg-stone-50 border-0 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-600 appearance-none cursor-pointer group-hover/select:bg-stone-100 transition-colors"
                                        >
                                            <option value="">Quantité standard...</option>
                                            {CONTAINERS.map(c => (
                                                <option key={c.label} value={c.factor}>{c.label} ({c.factor})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <input 
                                        type="number"
                                        step="0.001"
                                        value={link.quantity}
                                        onChange={(e) => handleUpdateQuantity(link.menuItemId, parseFloat(e.target.value) || 0)}
                                        className="w-24 h-10 px-3 bg-stone-900 text-white border-0 rounded-xl text-sm font-black text-right pr-10 focus:ring-2 focus:ring-stone-400 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/40 uppercase pointer-events-none">
                                        {stockItemUnit}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Add Menu Item */}
      <div className="space-y-3 pt-2">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ajouter à la carte</h4>
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-stone-900 transition-colors" />
            <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="RECHERCHER UN PLAT..."
                className="pl-10 h-12 bg-stone-50 border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
            />
        </div>

        {searchTerm && (
            <div className="bg-white border border-stone-100 rounded-2xl p-2 max-h-[200px] overflow-y-auto shadow-2xl z-20 animate-in fade-in slide-in-from-top-1">
                {filteredMenuItems.length === 0 ? (
                    <p className="p-4 text-center text-[10px] font-black text-stone-300 uppercase">Aucun plat disponible</p>
                ) : (
                    filteredMenuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleAddLink(item)}
                            className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center justify-between group transition-all"
                        >
                            <div>
                                <p className="text-xs font-black text-stone-900 uppercase tracking-tight">{item.name}</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{item.category?.name || 'Menu'}</p>
                            </div>
                            <Plus className="w-4 h-4 text-stone-300 group-hover:text-stone-900" />
                        </button>
                    ))
                )}
            </div>
        )}
      </div>

      <div className="pt-4 flex gap-3">
        <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1 h-14 rounded-2xl text-[10px] uppercase font-black tracking-widest"
        >
            Annuler
        </Button>
        <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-stone-900 h-14 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-xl shadow-stone-200 text-white border-0"
        >
            {saving ? 'Enregistrement...' : 'Enregistrer les Liaisons'}
        </Button>
      </div>
    </div>
  );
}
