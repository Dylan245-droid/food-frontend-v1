import { useState, useEffect } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryId: number;
  category?: { name: string };
  formattedPrice?: string;
}

interface MenuCategory {
  id: number;
  name: string;
}

export default function MenuPage() {
  const { data, loading, refetch } = useFetch<{ data: MenuItem[] }>('/admin/menu/items');
  const { data: categoriesData } = useFetch<{ data: MenuCategory[] }>('/admin/menu/categories');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 0, categoryId: 0, description: '' });
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');

  // Init categoryId with first available category
  useEffect(() => {
      if (categoriesData?.data?.length && formData.categoryId === 0) {
          setFormData(prev => ({ ...prev, categoryId: categoriesData.data[0].id }));
      }
  }, [categoriesData]);

  // ... handlers (handleToggle, handleDelete, handleSubmit) remain unchanged ...
  const handleToggle = async (item: MenuItem) => {
    try {
        await api.patch(`/admin/menu/items/${item.id}/toggle-availability`);
        refetch();
    } catch (e) { alert('Erreur'); }
  };

  const handleDelete = async (id: number) => {
      if(!confirm('Supprimer ce plat ?')) return;
      try { await api.delete(`/admin/menu/items/${id}`); refetch(); } catch(e) { alert('Erreur'); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const catId = formData.categoryId || (categoriesData?.data[0]?.id) || 1;
          await api.post('/admin/menu/items', { 
              ...formData, 
              categoryId: catId,
              price: Number(formData.price) 
          });
          setIsModalOpen(false);
          refetch();
      } catch(e) { alert('Erreur lors de la création'); }
  }

  if (loading) return <div>Chargement...</div>;

  const filteredItems = activeCategory === 'all' 
    ? data?.data 
    : data?.data.filter(item => item.categoryId === activeCategory);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carte & Menu</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Plat
        </Button>
      </div>

      {/* Categories Filter - Sticky & Scrollable */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm py-4 z-20 overflow-x-auto no-scrollbar flex gap-2 border-b border-gray-200 mb-6">
        <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'all' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
        >
            Tout voir
        </button>
        {categoriesData?.data.map(cat => (
            <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
                {cat.name}
            </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems?.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                    <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider">
                        {item.category?.name}
                    </span>
                </div>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                    {item.description || "Aucune description"}
                </p>

                <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-auto">
                    <div>
                        <div className="text-xl font-bold text-gray-900">{item.price} <span className="text-xs font-normal text-gray-500">FCFA</span></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => handleToggle(item)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                item.isAvailable 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                            }`}
                        >
                            {item.isAvailable ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                            {item.isAvailable ? 'En stock' : 'Épuisé'}
                        </button>

                        <button 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            onClick={() => handleDelete(item.id)}
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
        {filteredItems?.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 italic">
                Aucun plat dans cette catégorie
            </div>
        )}
      </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Plat">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nom" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={formData.categoryId}
                        onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}
                    >
                        <option value={0} disabled>Choisir une catégorie...</option>
                        {categoriesData?.data.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <div className="hidden"></div>
                </div>

                <Input label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <Input label="Prix (FCFA)" type="number" step="50" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                
                <Button type="submit" className="w-full">Créer</Button>
            </form>
       </Modal>
    </div>
  );
}
