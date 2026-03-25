import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Scale, 
  Search,
  AlertCircle,
  PackagePlus,
  ChevronDown
} from 'lucide-react';
import api from '../lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface StockItem {
  id: number;
  name: string;
  unit: string;
}

interface Ingredient {
  stockItemId: number;
  quantity: number;
}

interface RecipeEditorProps {
  menuItemId: number;
  menuItemName: string;
  onClose: () => void;
}

export function RecipeEditor({ menuItemId, menuItemName, onClose }: RecipeEditorProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick Create State
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickData, setQuickData] = useState({ unit: 'pce', currentStock: 0, minStock: 0, purchasePrice: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, recipeRes] = await Promise.all([
          api.get('/admin/stock/items'),
          api.get(`/admin/stock/recipes/${menuItemId}`) 
        ]);
        
        setStockItems(stockRes.data);
        
        // If the API doesn't return recipes directly in the item, we might need a separate endpoint
        // But for now let's check if it's there
        if (recipeRes.data.recipes) {
            setIngredients(recipeRes.data.recipes.map((r: { stockItemId: number, quantity: number }) => ({
                stockItemId: r.stockItemId,
                quantity: r.quantity
            })));
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des données de recette");
      } finally {
        setLoading(false);
      }
    };

    if (menuItemId) {
        fetchData();
    }
  }, [menuItemId]);

  const handleAddIngredient = (stockItem: StockItem) => {
    if (ingredients.some(ing => ing.stockItemId === stockItem.id)) {
        toast.error("Cet ingrédient est déjà dans la recette");
        return;
    }
    setIngredients([...ingredients, { stockItemId: stockItem.id, quantity: 1 }]);
    setSearchTerm('');
  };

  const handleRemoveIngredient = (stockItemId: number) => {
    setIngredients(ingredients.filter(ing => ing.stockItemId !== stockItemId));
  };

  const handleUpdateQuantity = (stockItemId: number, quantity: number) => {
    setIngredients(ingredients.map(ing => 
      ing.stockItemId === stockItemId ? { ...ing, quantity } : ing
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/admin/stock/recipes', {
        menuItemId,
        ingredients
      });
      toast.success("Recette mise à jour avec succès");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de la recette");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreate = async () => {
    setSaving(true);
    try {
      await api.post('/admin/stock/quick-create-link', {
        menuItemId,
        name: menuItemName,
        ...quickData
      });
      toast.success("Article créé et lié au menu !");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création rapide");
    } finally {
      setSaving(false);
    }
  };

  const filteredStockItems = stockItems.filter((item: StockItem) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !ingredients.some((ing: Ingredient) => ing.stockItemId === item.id)
  );

  if (loading) return <div className="p-8 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">Chargement des ingrédients...</div>;

  if (showQuickCreate) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="font-black text-amber-900 flex items-center gap-2 mb-2"><PackagePlus className="w-5 h-5"/> Création Rapide (Article Unique)</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">L'article <span className="font-black uppercase">"{menuItemName}"</span> sera créé dans l'inventaire et automatiquement lié à ce plat.</p>
            </div>
            
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">Unité de mesure</label>
                    <div className="relative">
                        <select 
                            value={quickData.unit} 
                            onChange={e => setQuickData({...quickData, unit: e.target.value})}
                            className="w-full h-12 px-4 bg-white border-2 border-stone-100 rounded-xl text-xs font-black uppercase tracking-widest text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer hover:border-stone-200"
                        >
                            <option value="pce">Pièce (Unité)</option>
                            <option value="bouteille">Bouteille</option>
                            <option value="canette">Canette</option>
                            <option value="portion">Portion</option>
                            <option value="verre">Verre</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Stock initial" type="number" value={quickData.currentStock} onChange={e => setQuickData({...quickData, currentStock: parseInt(e.target.value) || 0})} />
                    <Input label="Alerte stock bas" type="number" value={quickData.minStock} onChange={e => setQuickData({...quickData, minStock: parseInt(e.target.value) || 0})} />
                </div>
                <Input label="Prix d'achat unitaire (FCFA)" type="number" value={quickData.purchasePrice} onChange={e => setQuickData({...quickData, purchasePrice: parseInt(e.target.value) || 0})} placeholder="Optionnel" />
                <p className="text-[10px] uppercase font-bold text-stone-400 mt-2">*Les modifications futures de la quantité se feront depuis la page Stocks.</p>
            </div>

            <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={() => setShowQuickCreate(false)} className="flex-1 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest">Retour</Button>
                <Button onClick={handleQuickCreate} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest text-white shadow-lg shadow-amber-200 border-0">{saving ? 'Création...' : 'Créer & Lier'}</Button>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
        <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-800 text-xs font-medium leading-relaxed">
          Définissez les ingrédients qui composent ce plat. Le stock sera automatiquement déduit à chaque vente validée.
        </p>
      </div>

      {/* Selected Ingredients */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
            Ingrédients de la recette
            <span className="bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">{ingredients.length}</span>
        </h4>
        
        {ingredients.length === 0 ? (
            <div className="py-8 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center text-stone-300 gap-2 px-4">
                <AlertCircle className="w-8 h-8 opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest mb-2">Aucun ingrédient défini</span>
                
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 w-full text-center mt-2">
                    <p className="text-[11px] font-bold text-stone-500 mb-3 uppercase tracking-wider">Est-ce un article unique ?</p>
                    <button 
                        onClick={() => setShowQuickCreate(true)} 
                        className="w-full bg-white border-2 border-amber-200 text-amber-600 hover:bg-amber-50 text-[10px] uppercase font-black tracking-widest rounded-xl h-10 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                    >
                        <PackagePlus className="w-4 h-4" /> Créer & Lier en 1 clic
                    </button>
                </div>
            </div>
        ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {ingredients.map((ing: Ingredient) => {
                    const item = stockItems.find((s: StockItem) => s.id === ing.stockItemId);
                    if (!item) return null;
                    return (
                        <div key={ing.stockItemId} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-stone-100 group hover:border-amber-200 transition-all">
                            <div className="flex-1">
                                <p className="text-sm font-black text-stone-900 uppercase tracking-tight">{item.name}</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase">Unité: {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input 
                                        type="number"
                                        step="0.001"
                                        value={ing.quantity}
                                        onChange={(e) => handleUpdateQuantity(ing.stockItemId, parseFloat(e.target.value) || 0)}
                                        className="w-24 h-10 px-3 bg-stone-50 border-0 rounded-xl text-sm font-black text-right pr-10 focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-400 uppercase pointer-events-none">
                                        {item.unit}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleRemoveIngredient(ing.stockItemId)}
                                    className="p-2.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Add Ingrédient */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ajouter un ingrédient</h4>
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="RECHERCHER DANS LE STOCK..."
                className="pl-10 h-12 bg-stone-50 border-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
            />
        </div>

        {searchTerm && (
            <div className="bg-white border border-stone-100 rounded-2xl p-2 max-h-[200px] overflow-y-auto shadow-xl z-10">
                {filteredStockItems.length === 0 ? (
                    <p className="p-4 text-center text-[10px] font-black text-stone-300 uppercase">Aucun article disponible</p>
                ) : (
                    filteredStockItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleAddIngredient(item)}
                            className="w-full text-left p-3 hover:bg-stone-50 rounded-xl flex items-center justify-between group transition-all"
                        >
                            <div>
                                <p className="text-xs font-black text-stone-900 uppercase">{item.name}</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Unité: {item.unit}</p>
                            </div>
                            <Plus className="w-4 h-4 text-stone-300 group-hover:text-amber-600" />
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
            className="flex-1 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest"
        >
            Annuler
        </Button>
        <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-stone-900 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest shadow-lg shadow-stone-100"
        >
            {saving ? 'Enregistrement...' : 'Enregistrer la Recette'}
        </Button>
      </div>
    </div>
  );
}
