import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import api from '../lib/api';
import { toast } from 'sonner';
import { Package, CheckCircle, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface InventoryItem {
  id: number;
  stockItemId: number;
  theoreticalStock: number;
  physicalStock: number | null;
  discrepancy: number | null;
  stockItem: {
    name: string;
    unit: string;
  };
}

interface Inventory {
  id: number;
  name: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  openedAt: string;
  items: InventoryItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function InventoryModal({ isOpen, onClose, onComplete }: Props) {
  const [activeInventory, setActiveInventory] = useState<Inventory | null>(null);
  const [saving, setSaving] = useState(false);

  const formatQuantity = (qty: number | string | null) => {
    if (qty === null) return '';
    const n = Number(qty);
    return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(1)).toString();
  };

  // Fetch or Start Inventory
  const initInventory = async () => {
    try {
      // Check for existing draft
      const res = await api.get('/admin/stock/inventories');
      const draft = res.data.find((inv: Inventory) => inv.status === 'DRAFT');

      if (draft) {
        const fullInv = await api.get(`/admin/stock/inventories/${draft.id}`);
        setActiveInventory(fullInv.data);
      } else {
        // No draft, but we don't auto-create here to avoid accidental snapshots
        setActiveInventory(null);
      }
    } catch (err) {
      toast.error("Erreur de chargement");
    }
  };

  useEffect(() => {
    if (isOpen) initInventory();
  }, [isOpen]);

  const startNewInventory = async () => {
    setSaving(true);
    try {
      const res = await api.post('/admin/stock/inventories', { name: `Inventaire du ${new Date().toLocaleDateString()}` });
      setActiveInventory(res.data);
      toast.success("Inventaire démarré (Snapshot créé)");
    } catch (err) {
      toast.error("Erreur lors du démarrage");
    } finally {
      setSaving(false);
    }
  };

  const updatePhysicalCount = (itemId: number, value: string) => {
    if (!activeInventory) return;
    const physicalStock = value === '' ? null : parseFloat(value);
    
    setActiveInventory({
      ...activeInventory,
      items: activeInventory.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            physicalStock,
            discrepancy: physicalStock !== null ? physicalStock - item.theoreticalStock : null
          };
        }
        return item;
      })
    });
  };

  const saveDraft = async () => {
    if (!activeInventory) return;
    setSaving(true);
    try {
      const itemsToUpdate = activeInventory.items
        .filter(i => i.physicalStock !== null)
        .map(i => ({ id: i.id, physicalStock: i.physicalStock }));

      await api.patch(`/admin/stock/inventories/${activeInventory.id}/items`, { items: itemsToUpdate });
      toast.success("Brouillon enregistré");
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const closeInventory = async () => {
    if (!activeInventory) return;
    if (!window.confirm("Clôturer l'inventaire ? Les stocks seront ajustés définitivement.")) return;
    
    setSaving(true);
    try {
      // First save current counts
      await saveDraft();
      // Then close
      await api.post(`/admin/stock/inventories/${activeInventory.id}/close`);
      toast.success("Inventaire clôturé ! Stocks mis à jour.");
      onComplete();
      onClose();
    } catch (err) {
      toast.error("Erreur de clôture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Réconciliation d'Inventaire">
      {!activeInventory ? (
        <div className="py-12 text-center animate-in fade-in zoom-in duration-300">
           <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Package className="w-10 h-10 text-stone-300" />
           </div>
           <h3 className="text-xl font-black text-stone-900 uppercase font-display mb-2">Aucun inventaire en cours</h3>
           <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-8 max-w-xs mx-auto">
             Démarrez une session de comptage pour geler les stocks théoriques.
           </p>
           <Button 
            onClick={startNewInventory} 
            isLoading={saving}
            className="h-14 px-10 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all"
           >
             Démarrer le comptage
           </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-4">
            <div>
                 <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Session Active</span>
                 <h4 className="font-bold text-stone-900 uppercase">{activeInventory.name}</h4>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-0 uppercase font-black tracking-widest text-[9px]">En Cours</Badge>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2 premium-scrollbar space-y-2">
             <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">
                        <th className="px-4 py-2">Article</th>
                        <th className="px-4 py-2 text-right">Théorique</th>
                        <th className="px-4 py-2 text-center w-32">Réel</th>
                        <th className="px-4 py-2 text-right">Écart</th>
                    </tr>
                </thead>
                <tbody>
                    {activeInventory.items.map(item => (
                        <tr key={item.id} className="group hover:bg-stone-50/50 transition-colors">
                            <td className="px-4 py-4 bg-white border-y border-l border-stone-100 rounded-l-2xl">
                                <span className="font-bold text-stone-900 uppercase text-xs">{item.stockItem.name}</span>
                            </td>
                            <td className="px-4 py-4 bg-white border-y border-stone-100 text-right">
                                <span className="font-mono font-bold text-stone-400 text-xs">{formatQuantity(item.theoreticalStock)} {item.stockItem.unit}</span>
                            </td>
                            <td className="px-4 py-4 bg-white border-y border-stone-100">
                                <input 
                                    type="number"
                                    step="0.01"
                                    className="w-full h-10 bg-stone-50 border-0 rounded-xl px-3 font-black text-center text-xs focus:ring-2 focus:ring-stone-900 transition-all"
                                    value={item.physicalStock === null ? '' : item.physicalStock}
                                    onChange={(e) => updatePhysicalCount(item.id, e.target.value)}
                                    placeholder="?"
                                />
                            </td>
                            <td className={cn(
                                "px-4 py-4 bg-white border-y border-r border-stone-100 rounded-r-2xl text-right font-black text-xs",
                                item.discrepancy === null ? "text-stone-300" : (item.discrepancy < 0 ? "text-rose-500" : (item.discrepancy > 0 ? "text-emerald-500" : "text-stone-400"))
                            )}>
                                {item.discrepancy !== null ? (item.discrepancy > 0 ? `+${formatQuantity(item.discrepancy)}` : formatQuantity(item.discrepancy)) : '--'}
                                <span className="text-[8px] ml-1 opacity-50 uppercase">{item.stockItem.unit}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="secondary" 
                onClick={saveDraft} 
                isLoading={saving}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 border-2 border-stone-100"
              >
                  <Save className="w-4 h-4" /> Sauvegarder Brouillon
              </Button>
              <Button 
                onClick={closeInventory} 
                isLoading={saving}
                className="flex-1 h-14 bg-stone-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-xl shadow-stone-200"
              >
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> Clôturer & Ajuster
              </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
