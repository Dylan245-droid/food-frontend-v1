import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle,
  History,
  ClipboardList,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { InventoryModal } from '../../components/InventoryModal';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface StockItem {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchasePrice: number | null;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [stats, setStats] = useState({ totalValue: 0, lowStockCount: 0, movementsCount: 0, totalIn: 0, totalOut: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  
  // Form States
  const [itemForm, setItemForm] = useState({ id: 0, name: '', unit: 'kg', minStock: 0, purchasePrice: 0, currentStock: 0 });
  const [adjForm, setAdjForm] = useState({ quantity: 0, reason: '', dateStr: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/admin/stock/items'),
        api.get('/admin/stock/stats')
      ]);
      setItems(itemsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des stocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenItemModal = (item?: StockItem) => {
    if (item) {
      setItemForm({ 
        id: item.id, 
        name: item.name, 
        unit: item.unit, 
        currentStock: item.currentStock || 0,
        minStock: parseFloat(item.minStock as any) || 0, 
        purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice as any) : 0 
      });
    } else {
      setItemForm({ id: 0, name: '', unit: 'pce', currentStock: 0, minStock: 0, purchasePrice: 0 });
    }
    setIsItemModalOpen(true);
  };

  const handleOpenAdjModal = (item: StockItem, type: 'IN' | 'OUT') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    
    // Default to current local datetime
    const now = new Date();
    // Format to YYYY-MM-DDThh:mm (which is what datetime-local expects)
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);

    setAdjForm({ quantity: 0, reason: '', dateStr: localDateTime });
    setIsAdjustmentModalOpen(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (itemForm.id === 0) {
        await api.post('/admin/stock/items', itemForm);
        toast.success("Article créé");
      } else {
        await api.patch(`/admin/stock/items/${itemForm.id}`, itemForm);
        toast.success("Article mis à jour");
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erreur d'enregistrement");
    }
  };

  const saveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
   const handleAdjustment = async () => {
    if (!selectedItem || adjForm.quantity <= 0) {
        toast.error("Veuillez entrer une quantité valide.");
        return;
    }
    if (!adjForm.reason.trim()) {
        toast.error("Veuillez renseigner la raison du mouvement.");
        return;
    }

    setLoading(true);
    try {
      await api.post('/admin/stock/movement', {
        stockItemId: selectedItem.id,
        type: adjustmentType,
        quantity: adjForm.quantity,
        reason: adjForm.reason,
        date: adjForm.dateStr
      });
      toast.success(adjustmentType === 'IN' ? "Entrée enregistrée" : "Sortie enregistrée");
      setIsAdjustmentModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de l'ajustement");
    } finally {
        setLoading(false);
    }
   };
   handleAdjustment();
  };

  const uniqueUnits = Array.from(new Set(items.map(i => i.unit.toLowerCase()))).sort();

  const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesUnit = selectedUnit === 'all' || item.unit.toLowerCase() === selectedUnit;
      let matchesFilter = true;
      
      if (selectedCategory === 'low_stock') {
          matchesFilter = Number(item.currentStock) <= Number(item.minStock) && Number(item.currentStock) > 0;
      } else if (selectedCategory === 'out_of_stock') {
          matchesFilter = Number(item.currentStock) <= 0;
      }
      
      return matchesSearch && matchesUnit && matchesFilter;
  });

  const getStockStatus = (item: StockItem) => {
    if (Number(item.currentStock) <= 0) return { label: 'Rupture', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    if (Number(item.currentStock) <= Number(item.minStock)) return { label: 'Stock Bas', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    return { label: 'OK', color: 'bg-emerald-100 text-emerald-700', icon: Package };
  };

  const API_URL = import.meta.env.VITE_API_URL || '';
  const BASE_URL = API_URL.replace('/api', '');

  const getImageUrl = (url?: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${BASE_URL}${url}`;
  };

  const formatQuantity = (qty: number | string) => {
    return parseFloat(Number(qty).toString()).toString();
  };

  return (
    <SubscriptionGuard feature="stock_enabled">
      <div className="min-h-screen bg-stone-50/50 p-4 md:p-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-900 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-stone-200">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight leading-none uppercase font-display">Gestion des Stocks</h1>
            <p className="text-stone-400 text-[10px] md:text-xs font-bold mt-1 truncate tracking-wide uppercase">
              {items.length} Références • Suivi des marchandises & Ingrédients
            </p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setIsInventoryOpen(true)}
            className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-6 bg-white border-2 border-stone-100 hover:border-stone-200 text-stone-900 shadow-sm rounded-xl font-black uppercase tracking-widest text-[9px] items-center justify-center gap-2 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Inventaires
          </Button>
          <Button 
            onClick={() => handleOpenItemModal()}
            className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-6 bg-stone-900 hover:bg-black text-white shadow-lg shadow-stone-200 rounded-xl font-black uppercase tracking-widest text-[9px] items-center justify-center gap-2 transition-all active:scale-95 flex"
          >
            <Plus className="w-4 h-4" />
            Nouvel Article
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Valeur Totale Stock', value: `${stats.totalValue.toLocaleString()} FCFA`, icon: ArrowUpCircle, color: 'text-emerald-600' },
          { label: 'Alertes Stock Bas', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Mouvements (7 jrs)', value: stats.movementsCount, icon: History, color: 'text-blue-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 md:p-5 rounded-[1.5rem] border-stone-100 shadow-sm flex items-center justify-between group hover:border-stone-200 transition-all">
            <div>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-lg md:text-xl font-black text-stone-900 tracking-tight">{stat.value}</h3>
            </div>
            <div className={cn("w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center transition-all group-hover:scale-110 shrink-0", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-stone-900 transition-colors" />
              <Input 
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Rechercher un article..." 
                className="h-10 md:h-11 pl-9 bg-white border-stone-100 rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-sm"
              />
            </div>
            
            <div className="relative shrink-0">
                <select 
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                    className="h-10 md:h-11 pl-4 pr-10 bg-white border-2 border-stone-100 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-sm focus:ring-2 focus:ring-stone-200 outline-none appearance-none cursor-pointer text-stone-600 hover:border-stone-200 transition-all w-full sm:w-auto"
                >
                    <option value="all">Toutes les unités</option>
                    {uniqueUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto premium-scrollbar pb-1 md:pb-0 hide-scrollbar w-full md:w-auto">
            {[
                { id: 'all', label: 'Tous' },
                { id: 'low_stock', label: 'Stock Bas' },
                { id: 'out_of_stock', label: 'En Rupture' }
            ].map(filter => (
                <button 
                    key={filter.id}
                    onClick={() => setSelectedCategory(filter.id)}
                    className={cn(
                        "h-10 md:h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all whitespace-nowrap border-2",
                        selectedCategory === filter.id 
                            ? "bg-stone-900 border-stone-900 text-white" 
                            : "bg-white border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-600 shadow-sm"
                    )}
                >
                    {filter.label}
                </button>
            ))}
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item, idx) => {
          const status = getStockStatus(item);
          return (
            <Card key={item.id} className="group overflow-hidden rounded-3xl border-stone-100 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 20}ms` }}>
              <div className="p-4 md:p-5 flex flex-col h-full bg-gradient-to-b from-transparent to-stone-50/20">
                <div className="flex justify-between items-start mb-3">
                  <Badge className={cn("rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border-0", status.color)}>
                    {status.label}
                  </Badge>
                  <button 
                    onClick={() => handleOpenItemModal(item)}
                    className="text-stone-300 hover:text-stone-900 transition-colors p-1 -mt-1 -mr-1"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4 border-b border-stone-50 pb-3">
                    {item.imageUrl ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-stone-200 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                            <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center shrink-0 border border-stone-200 shadow-inner group-hover:shadow-md group-hover:scale-105 transition-all">
                            <span className="text-sm font-black text-stone-400 font-display transition-colors group-hover:text-stone-600">{item.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-stone-900 tracking-tight leading-4 uppercase mb-1 font-display group-hover:text-amber-600 transition-colors line-clamp-2">{item.name}</h3>
                        <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-stone-300 inline-block"></span>
                            {item.unit}
                        </p>
                    </div>
                </div>

                {item.description && (
                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed line-clamp-2 mb-4 -mt-1 px-1">
                        {item.description}
                    </p>
                )}

                <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Stock Actuel</span>
                            <span className={cn("text-2xl font-black tracking-tighter transition-colors", status.color.replace('bg-', 'text-').split(' ')[1])}>
                                {formatQuantity(item.currentStock)} <span className="text-xs uppercase ml-1 opacity-60">{item.unit}</span>
                            </span>
                        </div>
                        <div className="text-right">
                           {item.purchasePrice !== null && (
                            <>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Prix Achat</span>
                                <span className="text-xs font-black text-stone-900 uppercase">{item.purchasePrice} FCFA</span>
                            </>
                           )}
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={cn("h-full transition-all duration-1000 ease-out", status.color.split(' ')[0])} 
                            style={{ width: `${Math.min((item.currentStock / (Math.max(item.minStock, 1) * 2)) * 100, 100)}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                        <button 
                            onClick={() => handleOpenAdjModal(item, 'IN')}
                            className="flex-1 flex h-9 bg-white hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm border border-stone-200 items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            Entrée
                        </button>
                        <button 
                            onClick={() => handleOpenAdjModal(item, 'OUT')}
                            className="flex-1 flex h-9 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm border border-stone-200 items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            Sortie
                        </button>
                    </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
          <p className="font-black text-stone-400 uppercase tracking-widest text-xs">Mise à jour en cours...</p>
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-stone-100 mt-10">
              <Package className="w-16 h-16 text-stone-100 mb-4" />
              <p className="font-black text-stone-300 uppercase tracking-widest text-sm">Aucun article trouvé</p>
          </div>
      )}

      {/* Item Create/Edit Modal */}
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        title={itemForm.id === 0 ? "Nouvel Article" : "Modifier l'article"}
      >
        <form onSubmit={saveItem} className="space-y-6">
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-stone-500">
                    <Package className="w-6 h-6" />
                </div>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Informations de base</p>
            </div>

            <Input 
                label="Désignation" 
                value={itemForm.name} 
                onChange={e => setItemForm({...itemForm, name: e.target.value})} 
                required 
                className="font-bold text-lg uppercase"
            />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">Unité</label>
                    <div className="relative">
                        <select 
                            value={itemForm.unit} 
                            onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                            required
                            className="w-full h-12 px-4 bg-white border border-stone-200 rounded-xl text-xs font-black uppercase tracking-widest text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all cursor-pointer hover:border-stone-300 hover:shadow-sm"
                        >
                            <option value="pce">Pièce (Unité)</option>
                            <option value="bouteille">Bouteille</option>
                            <option value="canette">Canette</option>
                            <option value="portion">Portion</option>
                            <option value="verre">Verre</option>
                            <option value="kg">Kilogramme (kg)</option>
                            <option value="g">Gramme (g)</option>
                            <option value="l">Litre (l)</option>
                            <option value="cl">Centilitre (cl)</option>
                            <option value="ml">Millilitre (ml)</option>
                            <option value="carton">Carton</option>
                            <option value="pack">Pack</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                </div>
                {itemForm.id === 0 ? (
                    <Input 
                        label="Stock Initial" 
                        type="number" 
                        step="0.01"
                        value={itemForm.currentStock} 
                        onChange={e => setItemForm({...itemForm, currentStock: parseFloat(e.target.value) || 0})} 
                        className="font-bold h-12"
                    />
                ) : (
                    <Input 
                        label="Stock Minimum" 
                        type="number" 
                        step="0.01"
                        value={itemForm.minStock} 
                        onChange={e => setItemForm({...itemForm, minStock: parseFloat(e.target.value) || 0})} 
                        className="font-bold h-12"
                    />
                )}
            </div>

            <div className={cn("grid gap-4", itemForm.id === 0 ? "grid-cols-2" : "grid-cols-1")}>
                {itemForm.id === 0 && (
                    <Input 
                        label="Stock Minimum" 
                        type="number" 
                        step="0.01"
                        value={itemForm.minStock} 
                        onChange={e => setItemForm({...itemForm, minStock: parseFloat(e.target.value) || 0})} 
                        className="font-bold h-12"
                    />
                )}
                <Input 
                    label="Prix d'achat unitaire (FCFA)" 
                    type="number" 
                    step="0.01"
                    value={itemForm.purchasePrice} 
                    onChange={e => setItemForm({...itemForm, purchasePrice: parseFloat(e.target.value) || 0})} 
                    className="font-mono font-bold h-12"
                />
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsItemModalOpen(false)} className="flex-1 h-14 rounded-2xl">Annuler</Button>
                <Button type="submit" className="flex-1 bg-stone-900 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white">Enregistrer</Button>
            </div>
        </form>
      </Modal>

      {/* Manual Adjustment Modal */}
      <Modal 
        isOpen={isAdjustmentModalOpen} 
        onClose={() => setIsAdjustmentModalOpen(false)} 
        title={adjustmentType === 'IN' ? "Entrée de Stock" : "Sortie de Stock"}
      >
        <form onSubmit={saveAdjustment} className="space-y-6">
            <div className={cn(
                "p-6 rounded-2xl border text-center mb-4",
                adjustmentType === 'IN' ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
            )}>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                    {adjustmentType === 'IN' ? <ArrowUpCircle className="w-6 h-6 text-emerald-500" /> : <ArrowDownCircle className="w-6 h-6 text-rose-500" />}
                </div>
                <h4 className="font-bold text-stone-900 uppercase">{selectedItem?.name}</h4>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-1">Ajustement manuel du stock</p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Input 
                        label={adjustmentType === 'IN' ? "Quantité à ajouter" : "Quantité à déduire"} 
                        type="number" 
                        min="0.01"
                        step="0.01"
                        value={adjForm.quantity || ''} 
                        onChange={e => setAdjForm({...adjForm, quantity: parseFloat(e.target.value) || 0})} 
                        className="font-bold h-14 text-xl pr-16"
                        autoFocus
                    />
                    <div className="absolute right-4 top-[38px] text-[10px] font-black uppercase text-stone-300 tracking-widest pointer-events-none">{selectedItem?.unit}</div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Input 
                        label="Date et Heure du mouvement *" 
                        type="datetime-local"
                        value={adjForm.dateStr} 
                        onChange={e => setAdjForm({...adjForm, dateStr: e.target.value})} 
                        className="font-bold h-12"
                        required
                    />
                    <Input 
                        label="Raison détaillée *" 
                        value={adjForm.reason} 
                        onChange={e => setAdjForm({...adjForm, reason: e.target.value})} 
                        placeholder={adjustmentType === 'IN' ? "Ex: Livraison fournisseur, Initialisation..." : "Ex: Casse, Péremption, Consommation personnel..."}
                        className="font-bold h-12"
                        required
                    />
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 h-14 rounded-2xl">Annuler</Button>
                <Button 
                    type="submit" 
                    className={cn(
                        "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white",
                        adjustmentType === 'IN' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    )}
                >
                    Confirmer
                </Button>
            </div>
        </form>
      </Modal>

      <InventoryModal 
        isOpen={isInventoryOpen} 
        onClose={() => setIsInventoryOpen(false)} 
        onComplete={fetchData}
      />
    </div>
    </SubscriptionGuard>
  );
}
