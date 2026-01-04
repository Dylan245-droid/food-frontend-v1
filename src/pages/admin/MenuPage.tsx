import { useState, useEffect, useRef } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Eye, EyeOff, Plus, Trash2, BookOpen, Utensils, PenTool, Search, ChefHat } from 'lucide-react';
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
  const { data: menuData, loading, refetch } = useFetch<{ data: MenuItem[] }>('/admin/menu/items');
  const { data: categoriesData } = useFetch<{ data: MenuCategory[] }>('/admin/menu/categories');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', price: 0, categoryId: 0, description: '', imageUrl: '' });
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Init categoryId with first available category
  useEffect(() => {
      if (categoriesData?.data?.length && formData.categoryId === 0) {
          setFormData(prev => ({ ...prev, categoryId: categoriesData.data[0].id }));
      }
  }, [categoriesData]);

  const items = menuData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
        const res = await api.post('/admin/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Assuming dev env port 9015 for backend, or derive from existing URL
        const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
        
        setFormData(prev => ({ ...prev, imageUrl: fullUrl }));
    } catch (err) {
        alert("Erreur lors de l'upload de l'image");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setFormData({
        id: item.id,
        name: item.name,
        price: item.price,
        categoryId: item.categoryId,
        description: item.description || '',
        imageUrl: item.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setFormData({
        id: 0,
        name: '',
        price: 0,
        categoryId: categoriesData?.data?.[0]?.id || 0,
        description: '',
        imageUrl: ''
    });
    setIsModalOpen(true);
  }

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: number) => {
    if(!window.confirm('Supprimer ce plat ?')) return;
    try {
        await api.delete(`/admin/menu/items/${id}`);
        refetch();
    } catch (e) {
        alert('Erreur lors de la suppression');
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
        await api.patch(`/admin/menu/items/${item.id}/toggle-availability`);
        refetch();
    } catch (e) {
        alert('Erreur lors de la mise à jour');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const payload = { 
            ...formData, 
            categoryId: formData.categoryId || (categoriesData?.data[0]?.id) || 1,
            price: Number(formData.price) 
        };
        
        if (formData.id === 0) {
            await api.post('/admin/menu/items', payload);
        } else {
            await api.patch(`/admin/menu/items/${formData.id}`, payload);
        }
        setIsModalOpen(false);
        // Reset form without opening modal
        setFormData({
            id: 0,
            name: '',
            price: 0,
            categoryId: categoriesData?.data?.[0]?.id || 0,
            description: '',
            imageUrl: ''
        });
        refetch();
    } catch (e) {
        alert('Erreur lors de l\'enregistrement');
    }
  };

  if (loading && !menuData) return (
       <div className="flex items-center justify-center h-96">
          <div className="animate-bounce flex flex-col items-center text-stone-400">
              <BookOpen className="w-12 h-12 mb-2" />
              <span className="font-bold">Ouverture du menu...</span>
          </div>
      </div>
  );

  // Derive base URL from API configuration
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9015/api';
  const BASE_URL = API_URL.replace('/api', ''); // remove /api suffix if present to get root

  // Helper to resolve image URL
  // If it's a full URL, return it. If it's a relative path, prepend backend base URL.
  const getImageUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${BASE_URL}${url}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3 font-display">
                <ChefHat className="w-10 h-10 text-orange-600" />
                La Carte <span className="text-stone-300 font-light">du Chef</span>
            </h1>
            <p className="text-stone-500 font-medium ml-1">Gérez vos plats et disponibilités</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Chercher un plat..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-orange-500 outline-none transition-all shadow-sm focus:shadow-md"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
            </div>
            <Button onClick={handleOpenNew} className="bg-stone-900 hover:bg-stone-800 text-white shadow-xl shadow-stone-900/20">
                <Plus className="w-5 h-5 mr-2" /> Nouveau Plat
            </Button>
        </div>
      </div>

      {/* Categories Tabs - Organic Style */}
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 no-scrollbar border-b border-stone-100">
        <button
            onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
            className={`px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-wide transition-all ${
                activeCategory === 'all' 
                ? 'bg-stone-900 text-white shadow-lg scale-105' 
                : 'bg-white text-stone-400 hover:bg-stone-100 border border-stone-100'
            }`}
        >
            Tout voir
        </button>
        {categoriesData?.data.map((cat) => (
            <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-wide transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105 rotate-1' 
                    : 'bg-white text-stone-400 hover:bg-orange-50 hover:text-orange-500 border border-stone-100'
                }`}
            >
                {cat.name}
            </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedItems.map((item) => (
            <div key={item.id} className={`bg-white rounded-3xl shadow-sm border-2 flex flex-col transition-all group relative overflow-hidden ${
                item.isAvailable ? 'border-stone-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1' : 'border-stone-100 opacity-75 grayscale'
            }`}>
                
                {/* Image Header */}
                <div className="h-48 w-full bg-stone-100 relative overflow-hidden group-hover:h-52 transition-all duration-500">
                    {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-300 bg-stone-50">
                             <Utensils className="w-12 h-12 opacity-50" />
                        </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                        <span className="bg-white/90 backdrop-blur text-stone-900 text-[10px] uppercase font-bold px-2 py-1 rounded-lg tracking-wider shadow-sm border border-stone-100">
                            {item.category?.name}
                        </span>
                    </div>
                     {/* Edit Button Overlay */}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                        <button onClick={() => handleEdit(item)} className="bg-white text-stone-900 p-3 rounded-full hover:scale-110 transition-transform shadow-lg font-bold flex items-center gap-2">
                             <PenTool className="w-4 h-4" /> Modifier
                        </button>
                     </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-stone-900 text-lg font-display leading-tight">{item.name}</h3>
                    </div>
                    
                    <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-1 font-medium leading-relaxed">
                        {item.description || "Aucune description"}
                    </p>

                    <div className="flex items-end justify-between pt-2 mt-auto border-t border-dashed border-stone-100">
                        <div>
                            <div className="text-2xl font-black text-orange-600 font-display mt-2">{item.price} <span className="text-xs font-bold text-stone-400">FCFA</span></div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handleToggle(item)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
                                    item.isAvailable 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                }`}
                            >
                                {item.isAvailable ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                                {item.isAvailable ? 'En Stock' : 'Épuisé'}
                            </button>

                            <button 
                                className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100" 
                                onClick={() => handleDelete(item.id)}
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ))}
        {filteredItems.length === 0 && (
            <div className="col-span-full py-24 text-center text-stone-300">
                <div className="bg-stone-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search className="w-10 h-10 opacity-40" />
                </div>
                <p className="font-bold text-xl text-stone-400">Aucun résultat.</p>
                <p>Essayez une autre recherche.</p>
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-600 disabled:opacity-50 hover:bg-stone-50 transition-colors"
            >
                Précédent
            </button>
            <span className="font-mono font-bold text-stone-400 px-4">
                Page {currentPage} / {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white font-bold text-stone-600 disabled:opacity-50 hover:bg-stone-50 transition-colors"
            >
                Suivant
            </button>
        </div>
      )}

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id === 0 ? "Ajouter au Menu" : "Modifier le plat"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-orange-500">
                         <PenTool className="w-6 h-6" />
                    </div>
                    <p className="text-stone-500 text-sm font-medium">{formData.id === 0 ? 'Détails du nouveau plat' : 'Modification du plat'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                         <Input label="Nom du plat" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="font-bold text-lg" />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 h-[42px] appearance-none"
                                value={formData.categoryId}
                                onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}
                            >
                                <option value={0} disabled>Choisir une catégorie...</option>
                                {categoriesData?.data.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 relative">
                        <Input label="Prix" type="number" step="50" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value || '0')})} required className="font-mono font-bold text-right pr-16 h-[42px]" />
                        <div className="absolute right-4 top-[32px] text-gray-400 font-bold text-sm pointer-events-none">FCFA</div>
                    </div>
                </div>

                <Input label="Description" placeholder="Ingrédients, allergènes..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                {/* Visual Image Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Photo du plat</label>
                    <div className="relative group">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        {formData.imageUrl ? (
                            <div className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-stone-100 group-hover:border-orange-200 transition-all bg-stone-50">
                                <img src={getImageUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white text-stone-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-stone-50"
                                    >
                                        <PenTool className="w-4 h-4" /> Changer
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, imageUrl: ''}); }}
                                        className="bg-white text-red-500 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" /> Retirer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-32 w-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 gap-2 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer relative"
                            >
                                <Utensils className="w-8 h-8" />
                                <span className="text-sm font-bold">Cliquez pour ajouter une photo</span>
                                <span className="text-xs">ou collez une URL ci-dessous</span>
                            </div>
                        )}
                        
                        {/* Fallback URL Input (keep logic but make it discreet) */}
                         <div className="mt-2 text-xs text-right opacity-50 hover:opacity-100 transition-opacity">
                            <input 
                                type="text"
                                className="w-full bg-transparent text-right outline-none text-stone-400 placeholder-stone-300"
                                placeholder="...ou collez une URL d'image ici"
                                value={formData.imageUrl}
                                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            />
                         </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                     <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl">Annuler</Button>
                     <Button type="submit" className="flex-1 bg-stone-900 h-12 rounded-xl font-bold shadow-lg">{formData.id === 0 ? 'Créer le plat' : 'Enregistrer'}</Button>
                </div>
            </form>
       </Modal>
    </div>
  );
}
