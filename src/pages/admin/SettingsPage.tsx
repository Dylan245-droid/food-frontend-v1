// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings2, ChefHat, Loader2, MapPin, UtensilsCrossed, ShoppingBag, Truck, Check, Upload, Palette, Gift, Info, MessageSquare, Image as ImageIcon, Globe, Lock, Bell, Sparkles, ChevronRight, Save, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import UpgradeModal from '../../components/UpgradeModal';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_URL.replace('/api', '');

export default function SettingsPage() {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [formData, setFormData] = useState({
    name: '', businessType: '', tagline: '', logo: '', primaryColor: '', secondaryColor: '',
    thankYouMessage: '', receiptFooter: '', address: '', phone: '', nif: '', openingHours: '',
    heroImage: '', fee_libreville: '', fee_owendo: '', fee_akanda: '', fee_ntoum: '',
    delivery_commission: '', loyalty_rate_dine_in: '', loyalty_rate_takeout: '',
    loyalty_rate_delivery: '', restaurant_coords: '', font: '', borderRadius: '', heroStyle: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [locating, setLocating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const generatedFooterText = `© ${currentYear} ${formData.name || 'Mon Restaurant'}. Tous droits réservés.`;

  useEffect(() => {
    if (branding) {
      let bType = branding.businessType || 'Restaurant';
      if (bType.includes('Traditionnel')) bType = 'Restaurant';
      if (bType.includes('Fast-Food')) bType = 'Fast-Food';
      if (bType.includes('Boulangerie')) bType = 'Boulangerie';
      if (bType.includes('Café')) bType = 'Cafe';
      if (bType.includes('Dark Kitchen')) bType = 'Dark Kitchen';

      setFormData({
        name: branding.name || '',
        businessType: bType,
        tagline: branding.tagline || '',
        logo: branding.logo || '',
        primaryColor: branding.primaryColor || '#f97316',
        secondaryColor: branding.secondaryColor || '#3b82f6',
        thankYouMessage: branding.thankYouMessage || '',
        receiptFooter: branding.receiptFooter || '',
        address: branding.address || '',
        phone: branding.phone || '',
        nif: branding.nif || '',
        openingHours: branding.openingHours || '',
        heroImage: branding.heroImage || '',
        fee_libreville: branding.fee_libreville || '1000',
        fee_owendo: branding.fee_owendo || '1000',
        fee_akanda: branding.fee_akanda || '1000',
        fee_ntoum: branding.fee_ntoum || '1000',
        delivery_commission: branding.delivery_commission || '100',
        loyalty_rate_dine_in: branding.loyalty_rate_dine_in || '10',
        loyalty_rate_takeout: branding.loyalty_rate_takeout || '5',
        loyalty_rate_delivery: branding.loyalty_rate_delivery || '2',
        restaurant_coords: branding.restaurant_lat && branding.restaurant_lng
          ? `${branding.restaurant_lat}, ${branding.restaurant_lng}` : '',
        font: branding.font || 'Stack Sans Notch',
        borderRadius: branding.borderRadius || '1rem',
        heroStyle: branding.heroStyle || 'classic',
      });
    }
  }, [branding]);

  const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/admin/upload-logo', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
      handleChange('logo', `${fullUrl}?t=${Date.now()}`);
      toast.success('Logo mis à jour !');
    } catch { toast.error("Erreur lors de l'upload du logo"); }
    finally { setUploading(false); }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    setUploadingHero(true);
    try {
      const res = await api.post('/admin/upload-hero', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
      handleChange('heroImage', `${fullUrl}?t=${Date.now()}`);
      toast.success('Image de fond mise à jour !');
    } catch { toast.error("Erreur lors de l'upload de l'image"); }
    finally { setUploadingHero(false); }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      let lat, lng;
      if (formData.restaurant_coords) {
        const parts = formData.restaurant_coords.split(',').map(s => s.trim());
        if (parts.length === 2) { lat = parts[0]; lng = parts[1]; }
      }
      await updateBranding({ ...formData, footerText: generatedFooterText, restaurant_lat: lat, restaurant_lng: lng });
      toast.success('Configuration enregistrée !');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  if (brandingLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-stone-200" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header - Surgery View */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-white p-4 sm:p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="flex items-center gap-4 md:gap-6 relative z-10">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <Settings2 className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Configuration</h1>
            <p className="text-[10px] md:text-sm font-bold mt-2 truncate tracking-wide uppercase text-stone-400">Paramètres du système</p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex-1 sm:flex-none h-14 px-10 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Envoi...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Navigation / Side clustering (Tablets+) */}
        <div className="lg:col-span-3 space-y-4 hidden lg:block sticky top-24">
          {[
            { label: 'Identité', icon: ChefHat, target: 'identity' },
            { label: 'Design System', icon: Palette, target: 'design' },
            { label: 'Logistique', icon: Truck, target: 'logistics' },
            { label: 'Intelligence', icon: Sparkles, target: 'intelligence' },
            { label: 'Légal & Bio', icon: Lock, target: 'legal' }
          ].map((item) => (
            <a
              key={item.target}
              href={`#${item.target}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-stone-100 hover:bg-white text-stone-400 hover:text-stone-900 font-black uppercase tracking-widest text-[10px] transition-all group"
            >
              <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              {item.label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-9 space-y-8">

          {/* SECTION: IDENTITY */}
          <div id="identity" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Identité Culinaire</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Nom, concept et branding visuel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <Input
                label="NOM DE L'ÉTABLISSEMENT"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Le Gourmet"
                className="h-14 font-black uppercase tracking-widest text-xs"
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">CONCEPT / TYPE</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  className="w-full h-14 px-6 bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black uppercase tracking-widest text-xs appearance-none transition-all"
                >
                  <option value="Restaurant">Restaurant Traditionnel</option>
                  <option value="Fast-Food">Fast-Food / Snack</option>
                  <option value="Boulangerie">Boulangerie / Pâtisserie</option>
                  <option value="Cafe">Café / Salon de Thé</option>
                  <option value="Dark Kitchen">Dark Kitchen</option>
                  <option value="Food Truck">Food Truck</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  label="SLOGAN (ACCROCHE)"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="La meilleure table de la ville..."
                  className="h-14 font-black uppercase tracking-widest text-xs"
                />
              </div>
            </div>

            {/* Logo Surgery Upload */}
            <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border border-stone-100 flex flex-col sm:flex-row gap-8 items-center">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden shrink-0 group/logo cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-4 group-hover/logo:scale-110 transition-transform duration-700" />
                ) : <ImageIcon className="w-10 h-10 text-stone-200" />}
                <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity backdrop-blur-sm">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs mb-2">Logo de Marque</h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed mb-6">Supporte PNG, SVG, JPG. Recommandé : 1:1, Fond transparent.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 px-8 rounded-xl bg-white border-stone-200 text-stone-900 font-black uppercase tracking-widest text-[9px] shadow-sm hover:shadow-md transition-all"
                >
                  {uploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Changer Logo
                </Button>
              </div>
            </div>

            {/* Hero Image Upload */}
            <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border border-stone-100 flex flex-col sm:flex-row gap-8 items-center mt-8">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden shrink-0 group/hero cursor-pointer relative"
                onClick={() => heroFileInputRef.current?.click()}
              >
                {formData.heroImage ? (
                  <img src={formData.heroImage} alt="Hero" className="w-full h-full object-cover group-hover/hero:scale-110 transition-transform duration-700" />
                ) : <ImageIcon className="w-10 h-10 text-stone-200" />}
                <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity backdrop-blur-sm">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs mb-2">Image de Fond (Background)</h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed mb-6">Image d'arrière-plan affichée sur votre page d'accueil. Recommandé : 1920×1080px.</p>
                <input type="file" ref={heroFileInputRef} onChange={handleHeroUpload} accept="image/*" className="hidden" />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => heroFileInputRef.current?.click()}
                  className="h-12 px-8 rounded-xl bg-white border-stone-200 text-stone-900 font-black uppercase tracking-widest text-[9px] shadow-sm hover:shadow-md transition-all"
                >
                  {uploadingHero ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Changer Image
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION: DESIGN SYSTEM */}
          <div id="design" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Design System</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Intelligence visuelle et expérience client</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">COULEUR MAÎTRESSE</label>
                <div className="flex gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-14 h-14 rounded-xl border-none cursor-pointer bg-white p-0.5"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="h-12 border-none bg-transparent font-black tracking-[0.2em] text-xs"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">COULEUR D'ACCENT</label>
                <div className="flex gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-14 h-14 rounded-xl border-none cursor-pointer bg-white p-0.5"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="h-12 border-none bg-transparent font-black tracking-[0.2em] text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Theme Cards - Surgery Selection */}
            <div className="space-y-4 mb-10">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">THÈME DE L'INTERFACE CLIENT</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'classic', label: 'Classic', icon: Globe },
                  { id: 'split', label: 'Split View', icon: LayoutGrid },
                  { id: 'minimal', label: 'Minimalist', icon: Sparkles },
                  { id: 'immersive', label: 'Dark Mode+', icon: Lock }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleChange('heroStyle', theme.id)}
                    className={cn(
                      "p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300",
                      formData.heroStyle === theme.id ? "bg-stone-900 border-stone-900 text-white shadow-xl" : "bg-white border-stone-100 text-stone-400 hover:border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <theme.icon className={cn("w-6 h-6", formData.heroStyle === theme.id ? "text-orange-400" : "text-stone-300")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">TYPOGRAPHIE GLOBALE</label>
                <select
                  value={formData.font}
                  onChange={(e) => handleChange('font', e.target.value)}
                  className="w-full h-14 px-6 bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black uppercase tracking-widest text-xs appearance-none transition-all"
                >
                  <option value="Stack Sans Notch">Cuvée Food (Défaut)</option>
                  <option value="Inter">Modern Sans (Inter)</option>
                  <option value="Montserrat">Geometric (Montserrat)</option>
                  <option value="Playfair Display">Elegant Serif (Playfair)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">RAYON DE COURBURE (BORDURES)</label>
                <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
                  {[
                    { label: 'Box', val: '0px' },
                    { label: 'Soft', val: '0.5rem' },
                    { label: 'Lush', val: '1.5rem' },
                    { label: 'Full', val: '99px' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleChange('borderRadius', opt.val)}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        formData.borderRadius === opt.val ? "bg-white text-stone-900 shadow-sm" : "text-stone-300 hover:text-stone-500"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: LOGISTICS */}
          <div id="logistics" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Logistique & Expansion</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Zones de livraison et commissions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { id: 'fee_libreville', label: 'Libreville' },
                { id: 'fee_owendo', label: 'Owendo' },
                { id: 'fee_akanda', label: 'Akanda' },
                { id: 'fee_ntoum', label: 'Ntoum' }
              ].map((zone) => (
                <div key={zone.id} className="space-y-3 p-4 bg-stone-50 rounded-3xl border border-stone-100 transition-colors hover:bg-white group/zone">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 group-hover/zone:text-blue-500 transition-colors">{zone.label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData[zone.id]}
                      onChange={(e) => handleChange(zone.id, e.target.value)}
                      className="w-full h-12 bg-white rounded-xl border-none focus:ring-4 focus:ring-blue-100 font-black text-sm pr-12 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300 uppercase">XAF</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50/50 p-6 md:p-8 rounded-[2rem] border border-blue-50 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs mb-2">Incitations Livreurs</h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">Commission fixe retenue sur chaque course livrée.</p>
              </div>
              <div className="w-full md:w-48 relative">
                <input
                  type="number"
                  value={formData.delivery_commission}
                  onChange={(e) => handleChange('delivery_commission', e.target.value)}
                  className="w-full h-14 bg-white rounded-2xl border-none focus:ring-4 focus:ring-blue-100 font-black text-center text-lg pr-12 shadow-sm"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-blue-500">%</span>
              </div>
            </div>
          </div>

          {/* SECTION: INTELLIGENCE */}
          <div id="intelligence" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Gift className="w-48 h-48 text-stone-900" />
            </div>
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center text-white">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Intelligence Loyauté</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Programme de points et engagement</p>
              </div>
            </div>

            <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 mb-10 flex gap-4 items-start relative z-10">
              <Info className="w-5 h-5 text-stone-400 shrink-0 mt-1" />
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest leading-loose">
                Taux de gain par tranche de <span className="text-stone-900">1,000 XAF</span>. <br />
                Ces points alimentent le portefeuille digital du client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {[
                { id: 'loyalty_rate_dine_in', label: 'Sur Place', icon: UtensilsCrossed },
                { id: 'loyalty_rate_takeout', label: 'À Emporter', icon: ShoppingBag },
                { id: 'loyalty_rate_delivery', label: 'Livraison', icon: Truck }
              ].map((rate) => (
                <div key={rate.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col gap-4 group/rate hover:border-stone-900 transition-all">
                  <div className="flex items-center gap-3">
                    <rate.icon className="w-4 h-4 text-stone-300 group-hover/rate:text-stone-900 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover/rate:text-stone-900 transition-colors">{rate.label}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData[rate.id]}
                      onChange={(e) => handleChange(rate.id, e.target.value)}
                      className="w-full h-12 bg-stone-50 rounded-xl border-none focus:ring-4 focus:ring-stone-100 font-black text-center pr-12 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300 uppercase">Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: LEGAL & BIO */}
          <div id="legal" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-stone-100 shadow-sm group">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Legal & Bio</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">Informations publiques et légales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="md:col-span-2">
                <Input
                  label="ADRESSE PHYSIQUE"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Quartier, Rue, Étage..."
                  className="h-14 font-black uppercase tracking-widest text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="HORAIRES D'OUVERTURE"
                  value={formData.openingHours}
                  onChange={(e) => handleChange('openingHours', e.target.value)}
                  placeholder="Ex: Lun-Sam: 11h-23h, Dim: Fermé"
                  className="h-14 font-black uppercase tracking-widest text-xs"
                />
              </div>
              <Input
                label="LIGNE DIRECTE"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+241 07..."
                className="h-14 font-black uppercase tracking-widest text-xs"
              />
              <Input
                label="N° FISCAL / NIF"
                value={formData.nif}
                onChange={(e) => handleChange('nif', e.target.value)}
                placeholder="NIF-XXXXXXXX"
                className="h-14 font-black uppercase tracking-widest text-xs"
              />
            </div>

            <div className="space-y-4 mb-10">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">GÉO-POSITIONNEMENT (COORDINATES)</label>
              <div className="flex gap-4">
                <Input
                  value={formData.restaurant_coords}
                  onChange={(e) => handleChange('restaurant_coords', e.target.value)}
                  placeholder="Lat, Lng (Ex: 0.40, 9.45)"
                  className="h-14 font-black tracking-widest text-xs bg-stone-50 border-none flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return toast.error("Non supporté");
                    setLocating(true);
                    navigator.geolocation.getCurrentPosition((pos) => {
                      handleChange('restaurant_coords', `${pos.coords.latitude}, ${pos.coords.longitude}`);
                      toast.success("Position capturée !");
                      setLocating(false);
                    });
                  }}
                  className="h-14 px-6 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  {locating ? <Loader2 className="animate-spin w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  GPS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> PIED DE TICKET
                </label>
                <textarea
                  value={formData.receiptFooter}
                  onChange={(e) => handleChange('receiptFooter', e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-bold text-xs p-6 placeholder:text-stone-300 transition-all resize-none"
                  placeholder="Message de fin de ticket..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Bell className="w-3 h-3" /> MERCI CLIENT
                </label>
                <textarea
                  value={formData.thankYouMessage}
                  onChange={(e) => handleChange('thankYouMessage', e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-bold text-xs p-6 placeholder:text-stone-300 transition-all resize-none"
                  placeholder="Merci de votre confiance..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Mobile Bar - Surgery Feature */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-stone-100 lg:hidden z-50 animate-in slide-in-from-bottom-full duration-500">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="w-full h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-stone-200 flex items-center justify-center gap-4 active:scale-95 transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-orange-400" />}
            SAUVEGARDER MA CONFIG
          </button>
        </div>
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="Options Avancées"
        description={`Mettez à jour votre plan pour débloquer toutes les fonctionnalités de personnalisation.`}
      />
    </div>
  );
}
