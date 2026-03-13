import { useState, useEffect, useRef } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Eye, EyeOff, Plus, Trash2, BookOpen, Utensils, PenTool, Search, ChefHat } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { cn, formatCurrency } from '../../lib/utils';

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
    const { data: categoriesData, refetch: refetchCategories } = useFetch<{ data: MenuCategory[] }>('/admin/menu/categories');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: 0, name: '', price: 0, categoryId: 0, description: '', imageUrl: '' });

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

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

    const handleEditCategory = (e: React.MouseEvent, category: MenuCategory) => {
        e.stopPropagation();
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setIsCategoryModalOpen(true);
    };

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
        if (!window.confirm('Supprimer ce plat ?')) return;
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

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            if (editingCategory) {
                await api.patch(`/admin/menu/categories/${editingCategory.id}`, { name: newCategoryName });
                alert('Catégorie mise à jour !');
            } else {
                await api.post('/admin/menu/categories', { name: newCategoryName });
                alert('Catégorie ajoutée !');
            }
            await refetchCategories();
            setIsCategoryModalOpen(false);
            setNewCategoryName('');
            setEditingCategory(null);
        } catch (e) {
            alert('Erreur lors de l\'opération');
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
    const API_URL = import.meta.env.VITE_API_URL || '';
    const BASE_URL = API_URL.replace('/api', ''); // remove /api suffix if present to get root

    // Helper to resolve image URL
    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-stone-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-4 font-display">
                        <div className="bg-orange-500 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-100">
                            <ChefHat className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        La Carte <span className="text-stone-300 font-light hidden xs:inline">du Chef</span>
                    </h1>
                    <p className="text-stone-400 text-sm font-bold mt-2 ml-1">Gérez vos plats et disponibilités</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto relative z-10">
                    {/* Search Bar */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Chercher un plat..."
                            className="w-full h-12 pl-11 pr-4 bg-stone-50/50 border border-stone-100 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <Button onClick={handleOpenNew} className="bg-stone-900 hover:bg-stone-800 text-white shadow-xl shadow-stone-200 h-12 px-6 rounded-2xl font-black uppercase tracking-wider text-xs active:scale-95 transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Nouveau Plat
                    </Button>
                </div>
            </div>

            {/* Categories Tabs - Swipable */}
            <div className="flex items-center gap-3 overflow-x-auto pb-6 premium-scrollbar px-1 -mx-1">
                <button
                    onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'all'
                        ? 'bg-stone-900 text-white shadow-lg shadow-stone-200 -translate-y-0.5'
                        : 'bg-white text-stone-400 hover:text-stone-600 border border-stone-100'
                        }`}
                >
                    Tout voir
                </button>
                {categoriesData?.data.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group ${activeCategory === cat.id
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 -translate-y-0.5'
                            : 'bg-white text-stone-400 hover:text-orange-500 border border-stone-100 hover:bg-orange-50/30'
                            }`}
                    >
                        {cat.name}
                        {activeCategory === cat.id && (
                            <span
                                onClick={(e) => handleEditCategory(e, cat)}
                                className="p-1.5 rounded-xl bg-orange-600 hover:bg-stone-900 text-white transition-colors"
                                title="Modifier"
                            >
                                <PenTool className="w-3 h-3" />
                            </span>
                        )}
                    </button>
                ))}
                <button
                    onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsCategoryModalOpen(true); }}
                    className="flex-shrink-0 w-10 h-10 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-400 flex items-center justify-center transition-all border border-stone-100 active:scale-95"
                    title="Ajouter"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group bg-white rounded-[2rem] border transition-all duration-500 flex flex-col relative overflow-hidden",
                            item.isAvailable
                                ? "border-stone-100 hover:border-stone-200 hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1"
                                : "border-stone-50 opacity-80"
                        )}
                    >
                        {/* Image Header */}
                        <div className="h-48 w-full bg-stone-50 relative overflow-hidden shrink-0">
                            {item.imageUrl ? (
                                <img
                                    src={getImageUrl(item.imageUrl)}
                                    alt={item.name}
                                    className={cn(
                                        "w-full h-full object-cover transition-all duration-1000 group-hover:scale-110",
                                        !item.isAvailable && "grayscale brightness-75 opacity-60"
                                    )}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-stone-200 bg-stone-50">
                                    <Utensils className="w-12 h-12 opacity-30" />
                                </div>
                            )}

                            {/* Glassmorphic Category Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-white/40 backdrop-blur-md text-stone-900 text-[9px] uppercase font-black px-3 py-1.5 rounded-xl tracking-[0.15em] shadow-sm border border-white/40">
                                    {item.category?.name}
                                </span>
                            </div>

                            {/* Status Badge - Floating */}
                            {!item.isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <span className="bg-stone-900/90 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl backdrop-blur-sm">
                                        Rupture de Stock
                                    </span>
                                </div>
                            )}

                            {/* Premium Edit Overlay */}
                            <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3 backdrop-blur-[3px]">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="bg-white text-stone-900 px-6 py-3 rounded-2xl scale-90 group-hover:scale-100 transition-all duration-500 shadow-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-stone-50 active:scale-95"
                                >
                                    <PenTool className="w-4 h-4" />
                                    Modifier
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-transparent to-stone-50/30">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-black text-stone-900 text-lg tracking-tight leading-[1.1] font-display group-hover:text-orange-600 transition-colors uppercase">
                                    {item.name}
                                </h3>
                            </div>

                            <p className="text-stone-400 text-xs line-clamp-2 mb-6 flex-1 font-bold uppercase tracking-wide leading-relaxed">
                                {item.description || "Aucune description créative..."}
                            </p>

                            {/* Robust Price & Actions Zone */}
                            <div className="space-y-4 pt-4 border-t border-stone-100 relative mt-auto">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                        <span className="text-2xl font-black text-stone-900 font-display tracking-tighter truncate">
                                            {formatCurrency(item.price).split('\u00A0')[0]}
                                        </span>
                                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none">
                                            FCFA
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggle(item)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border active:scale-95",
                                                item.isAvailable
                                                    ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:border-green-200'
                                                    : 'bg-stone-100 text-stone-400 border-stone-200 hover:bg-stone-200'
                                            )}
                                        >
                                            {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {item.isAvailable ? 'En Vente' : 'Masqué'}
                                        </button>

                                        <button
                                            className="p-2.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-90"
                                            onClick={() => handleDelete(item.id)}
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
                            <Input label="Nom du plat" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="font-bold text-lg" />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-900 h-[42px] appearance-none"
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                >
                                    <option value={0} disabled>Choisir une catégorie...</option>
                                    {categoriesData?.data.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 md:col-span-1 relative">
                            <Input label="Prix" type="number" step="50" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value || '0') })} required className="font-mono font-bold text-right pr-16 h-[42px]" />
                            <div className="absolute right-4 top-[32px] text-gray-400 font-bold text-sm pointer-events-none">FCFA</div>
                        </div>
                    </div>

                    <Input label="Description" placeholder="Ingrédients, allergènes..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

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
                                            onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, imageUrl: '' }); }}
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

                            <div className="mt-2 text-xs text-right opacity-50 hover:opacity-100 transition-opacity">
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-right outline-none text-stone-400 placeholder-stone-300"
                                    placeholder="...ou collez une URL d'image ici"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
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

            {/* Category Creation/Edit Modal */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }} title={editingCategory ? "Modifier la catégorie" : "Nouvelle Catégorie"}>
                <form onSubmit={handleCategorySubmit} className="space-y-6">
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center mb-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-stone-500">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <p className="text-stone-500 text-sm font-medium">{editingCategory ? "Modifier le nom de la section" : "Ajouter une section au menu"}</p>
                    </div>
                    <Input
                        label="Nom de la catégorie"
                        placeholder="Ex: Entrées, Desserts..."
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        required
                        autoFocus
                    />
                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="secondary" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }} className="flex-1 h-12 rounded-xl">Annuler</Button>
                        <Button type="submit" className="flex-1 bg-stone-900 h-12 rounded-xl font-bold shadow-lg">{editingCategory ? "Mettre à jour" : "Créer"}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
