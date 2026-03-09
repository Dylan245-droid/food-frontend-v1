import { useState, useEffect, useRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings2, ChefHat, Loader2, MapPin, Truck, Check, Upload, Palette, Gift, Info, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

// Derive base URL from API configuration (same as MenuPage)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9015/api';
const BASE_URL = API_URL.replace('/api', ''); // remove /api suffix to get root

export default function SettingsPage() {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    tagline: '',
    logo: '',
    primaryColor: '',
    secondaryColor: '',
    thankYouMessage: '',
    receiptFooter: '',
    address: '',
    phone: '',
    nif: '',
    openingHours: '',
    heroImage: '',
    fee_libreville: '',
    fee_owendo: '',
    fee_akanda: '',
    fee_ntoum: '',
    delivery_commission: '',
    loyalty_rate_dine_in: '',
    loyalty_rate_takeout: '',
    loyalty_rate_delivery: '',
    restaurant_coords: '', // Format: "lat, lng"
    font: '',
    borderRadius: '',
    heroStyle: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer automatiquement le texte de copyright
  const currentYear = new Date().getFullYear();
  const generatedFooterText = `© ${currentYear} ${formData.name || 'Mon Restaurant'}. Tous droits réservés.`;

  useEffect(() => {
    if (branding) {
      // Robustness: Map old longer values from registration to short keys used in select
      let businessType = branding.businessType || 'Restaurant';
      if (businessType === 'Restaurant Traditionnel') businessType = 'Restaurant';
      if (businessType === 'Fast-Food / Snack') businessType = 'Fast-Food';
      if (businessType === 'Boulangerie / Pâtisserie') businessType = 'Boulangerie';
      if (businessType === 'Café / Salon de Thé') businessType = 'Cafe';
      if (businessType.includes('Dark Kitchen')) businessType = 'Dark Kitchen';

      setFormData({
        name: branding.name || '',
        businessType: businessType,
        tagline: branding.tagline || '',
        logo: branding.logo || '',
        primaryColor: branding.primaryColor || '',
        secondaryColor: branding.secondaryColor || '',
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
          ? `${branding.restaurant_lat}, ${branding.restaurant_lng}`
          : '',
        font: branding.font || 'Stack Sans Notch',
        borderRadius: branding.borderRadius || '1rem',
        heroStyle: branding.heroStyle || 'classic',
      });
    }
  }, [branding]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/admin/upload-logo', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
      // Append timestamp to force reload image
      handleChange('logo', `${fullUrl}?t=${Date.now()}`);
      toast.success('Logo uploadé avec succès !');
    } catch (err: any) {
      console.error('Upload Logo Error:', err);
      toast.error(err?.response?.data?.message || "Erreur lors de l'upload du logo");
      if (err?.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Parse coords
      let restaurant_lat: string | undefined;
      let restaurant_lng: string | undefined;
      if (formData.restaurant_coords) {
        const parts = formData.restaurant_coords.split(',').map(s => s.trim());
        if (parts.length === 2) {
          restaurant_lat = parts[0];
          restaurant_lng = parts[1];
        }
      }

      await updateBranding({
        ...formData,
        footerText: generatedFooterText,
        restaurant_lat,
        restaurant_lng,
        heroStyle: formData.heroStyle as any, // Cast to match literal type
      });
      toast.success('Paramètres enregistrés avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (brandingLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-stone-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10 w-full xs:w-auto">
          <div className="bg-stone-900 p-3 rounded-2xl text-white shadow-xl shadow-stone-100 shrink-0 self-start md:self-center">
            <Settings2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight font-display leading-tight">
              <span className="truncate">Configuration</span>
            </h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-1 md:mt-2 truncate text-left">Identité, logistique et paramètres système</p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 w-full sm:w-auto shrink-0">
          <Button
            onClick={(e) => handleSubmit(e)}
            disabled={saving}
            className="flex-1 sm:flex-none h-11 md:h-14 px-6 md:px-10 bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-100 rounded-2xl font-bold uppercase tracking-wider text-[10px] md:text-xs active:scale-95 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : <Check className="w-4 h-4 mr-2" />}
            {saving ? 'Envoi...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Section */}
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h2 className="text-base md:text-lg font-bold text-stone-900">Identité</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Nom du restaurant
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Mon Restaurant"
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Type de commerce
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Restaurant">Restaurant Traditionnel</option>
                <option value="Fast-Food">Fast-Food / Snack</option>
                <option value="Boulangerie">Boulangerie / Pâtisserie</option>
                <option value="Pizzeria">Pizzeria</option>
                <option value="Cafe">Café / Salon de Thé</option>
                <option value="Dark Kitchen">Dark Kitchen (livraison uniquement)</option>
                <option value="Food Truck">Food Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Slogan
              </label>
              <Input
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="Saveurs authentiques"
                className="h-12"
              />
            </div>

            {/* Logo Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Logo du restaurant
              </label>
              <div className="flex gap-4 items-start">
                {/* Aperçu du logo */}
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center">
                  {formData.logo && formData.logo.length > 0 ? (
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Replace with placeholder on error
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          e.currentTarget.remove();
                          parent.innerHTML = '<div class="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400 mx-auto mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs text-red-500 font-medium block">Erreur</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                      <span className="text-xs text-stone-500 font-medium">Aucun logo</span>
                    </div>
                  )}
                </div>

                {/* Bouton d'upload */}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm border-stone-200 hover:border-orange-300 hover:bg-orange-50 w-full xs:w-auto"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? 'Upload en cours...' : 'Choisir une image'}
                  </Button>
                  <p className="text-xs text-stone-400">PNG, JPG ou SVG. Taille recommandée : 512x512px</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Appearance Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <Palette className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-stone-900">Apparence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Couleur principale */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Couleur principale
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-stone-200 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  placeholder="#f97316"
                  className="h-12 flex-1 font-mono"
                />
              </div>
            </div>

            {/* Couleur secondaire */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Couleur secondaire
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-stone-200 cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="h-12 flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Aperçu des couleurs et gradient */}
          <div className="mt-4">
            <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
              Aperçu du thème
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="h-14 md:h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-[10px] md:text-sm"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Principale
              </div>
              <div
                className="h-14 md:h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-[10px] md:text-sm"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secondaire
              </div>
              <div
                className="h-14 md:h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-[10px] md:text-sm"
                style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
              >
                Gradient
              </div>
            </div>
          </div>

          {/* Typography & Shapes */}
          <div className="pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Selector */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Police d'écriture
              </label>
              <select
                value={formData.font}
                onChange={(e) => handleChange('font', e.target.value)}
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <option value="Inter">Inter (Moderne & Net)</option>
                <option value="Lato">Lato (Rond & Amical)</option>
                <option value="Montserrat">Montserrat (Géométrique)</option>
                <option value="Playfair Display">Playfair Display (Élégant / Serrif)</option>
                <option value="Oswald">Oswald (Compact & Fort)</option>
                <option value="Raleway">Raleway (Fin & Artistique)</option>
                <option value="Open Sans">Open Sans (Standard)</option>
                <option value="Stack Sans Notch">Par Défaut</option>
              </select>
            </div>

            {/* Border Radius Selector */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                Arrondi des boutons
              </label>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                {[
                  { label: 'Carré', value: '0px' },
                  { label: 'S', value: '0.5rem' },
                  { label: 'M', value: '1rem' },
                  { label: 'L', value: '1.5rem' },
                  { label: 'Rond', value: '9999px' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('borderRadius', opt.value)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.borderRadius === opt.value
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Style Selector -> Renamed to Themes */}
          <div className="pt-6 border-t border-stone-100">
            <label className="block text-sm font-bold text-stone-700 mb-4">
              Thème du Restaurant
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { id: 'classic', label: 'Classique', desc: 'Efficace & Familier. Idéal pour tout type de restauration.' },
                { id: 'split', label: 'Moderne Split', desc: 'Tendance. Met en avant votre message et vos visuels.' },
                { id: 'minimal', label: 'Boutique (Minimal)', desc: 'Épuré & Chic. Pour une ambiance haut de gamme.' },
                { id: 'immersive', label: 'Immersif', desc: 'Visuel fort. Expérience plein écran captivante.' }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleChange('heroStyle', style.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${formData.heroStyle === style.id
                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                    : 'border-stone-200 hover:border-orange-200 hover:bg-stone-50'
                    }`}
                >
                  <div className="font-bold text-stone-900 mb-1">{style.label}</div>
                  <div className="text-xs text-stone-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image de fond Hero */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
              Image de fond (page d'accueil)
            </label>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center">
                {formData.heroImage && formData.heroImage.length > 0 ? (
                  <img src={formData.heroImage} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                    <span className="text-[10px] text-stone-500 font-medium">Aucune</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  id="heroImageInput"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    setUploading(true);
                    try {
                      const res = await api.post('/admin/upload-hero', uploadData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
                      handleChange('heroImage', `${fullUrl}?t=${Date.now()}`);
                      toast.success('Image uploadée !');
                    } catch (err: any) {
                      console.error('Upload error:', err?.response?.data || err?.message || err);
                      toast.error(err?.response?.data?.message || "Erreur lors de l'upload");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById('heroImageInput')?.click()}
                  disabled={uploading}
                  className="h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm border-stone-200 hover:border-purple-300 hover:bg-purple-50 w-full xs:w-auto"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Choisir une image
                </Button>
                {formData.heroImage && (
                  <button type="button" onClick={() => handleChange('heroImage', '')} className="text-xs text-red-500 hover:text-red-700 font-medium block">
                    Supprimer
                  </button>
                )}
                <p className="text-xs text-stone-400">Si vide, le dégradé des couleurs sera utilisé.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Infos Légales (Tickets/Factures) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <Settings2 className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-stone-900">Informations légales</h2>
              </div>
              <p className="text-sm text-stone-500">Ces informations apparaissent sur les tickets et factures</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    Adresse
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Quartier, Ville, Pays"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    Téléphone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    Horaires d'ouverture
                  </label>
                  <Input
                    value={formData.openingHours}
                    onChange={(e) => handleChange('openingHours', e.target.value)}
                    placeholder="Ouvert 8h - 22h"
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    NIF / RCCM
                  </label>
                  <Input
                    value={formData.nif}
                    onChange={(e) => handleChange('nif', e.target.value)}
                    placeholder="Numéro d'identification fiscale"
                    className="h-12"
                  />
                  <p className="text-xs text-stone-400 mt-1">Affiché sur les factures pro</p>
                </div>
              </div>
            </div>

            {/* Frais de Livraison */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-stone-900">Frais de Livraison (par ville)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Libreville</label>
                  <div className="relative">
                    <Input value={formData.fee_libreville} onChange={(e) => handleChange('fee_libreville', e.target.value)} type="number" className="h-12 pr-12" />
                    <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Owendo</label>
                  <div className="relative">
                    <Input value={formData.fee_owendo} onChange={(e) => handleChange('fee_owendo', e.target.value)} type="number" className="h-12 pr-12" />
                    <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Akanda</label>
                  <div className="relative">
                    <Input value={formData.fee_akanda} onChange={(e) => handleChange('fee_akanda', e.target.value)} type="number" className="h-12 pr-12" />
                    <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Ntoum</label>
                  <div className="relative">
                    <Input value={formData.fee_ntoum} onChange={(e) => handleChange('fee_ntoum', e.target.value)} type="number" className="h-12 pr-12" />
                    <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 border-t border-stone-100">
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Commission Livreur (%)</label>
                  <div className="relative max-w-xs">
                    <Input
                      value={formData.delivery_commission}
                      onChange={(e) => handleChange('delivery_commission', e.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      className="h-12 pr-12"
                    />
                    <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">%</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Pourcentage des frais de livraison reversé au livreur (déduit du montant à rendre en caisse).</p>
                </div>
              </div>
            </div>

            {/* Programme de Fidélité */}
            <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Gift className="w-32 h-32 text-purple-900" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-800">Programme de Fidélité</h2>
                  <p className="text-stone-500 font-medium">Récompensez vos clients fidèles</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-purple-900">Comment ça marche ?</h4>
                    <p className="text-sm text-purple-700 leading-relaxed mt-1">
                      Définissez combien de points un client gagne pour chaque tranche de <span className="font-bold">1000 FCFA</span> dépensés, selon le type de commande.
                      <br />
                      Exemple: Si vous mettez <span className="font-bold">10 points</span> pour "Sur Place", une commande de 5000 FCFA rapporte 50 points.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">🍽️ Sur Place</label>
                  <div className="relative">
                    <Input
                      value={formData.loyalty_rate_dine_in}
                      onChange={(e) => handleChange('loyalty_rate_dine_in', e.target.value)}
                      type="number"
                      className="h-12 pr-20 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <span className="absolute right-4 top-3.5 text-purple-400 text-xs font-bold">pts / 1000F</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">🛍️ À Emporter</label>
                  <div className="relative">
                    <Input
                      value={formData.loyalty_rate_takeout}
                      onChange={(e) => handleChange('loyalty_rate_takeout', e.target.value)}
                      type="number"
                      className="h-12 pr-20 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <span className="absolute right-4 top-3.5 text-purple-400 text-xs font-bold">pts / 1000F</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">🛵 Livraison</label>
                  <div className="relative">
                    <Input
                      value={formData.loyalty_rate_delivery}
                      onChange={(e) => handleChange('loyalty_rate_delivery', e.target.value)}
                      type="number"
                      className="h-12 pr-20 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <span className="absolute right-4 top-3.5 text-purple-400 text-xs font-bold">pts / 1000F</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Position GPS du Restaurant */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <MapPin className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-stone-900">Position GPS du Restaurant</h2>
              </div>
              <p className="text-sm text-stone-500">Cette position sera affichée sur la carte du livreur. Collez les coordonnées depuis Google Maps ou utilisez votre position actuelle.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">Coordonnées (latitude, longitude)</label>
                  <div className="flex gap-3">
                    <Input
                      value={formData.restaurant_coords}
                      onChange={(e) => handleChange('restaurant_coords', e.target.value)}
                      placeholder="0.37458607679368766, 9.458258923706834"
                      className="h-12 flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm shrink-0"
                      disabled={locating}
                      onClick={() => {
                        if (!navigator.geolocation) {
                          toast.error("Géolocalisation non supportée");
                          return;
                        }
                        setLocating(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                            handleChange('restaurant_coords', coords);
                            toast.success("Position récupérée !");
                            setLocating(false);
                          }
                        );
                      }}
                    >
                      {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      <span className="ml-2 hidden md:inline">Ma position</span>
                    </Button>
                  </div>
                  <p className="text-xs text-stone-400 mt-2">💡 Astuce : Sur Google Maps, cliquez droit sur le restaurant → "Copier les coordonnées" et collez ici.</p>
                </div>
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-stone-900">Messages</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    Message de remerciement (client)
                  </label>
                  <Input
                    value={formData.thankYouMessage}
                    onChange={(e) => handleChange('thankYouMessage', e.target.value)}
                    placeholder="Merci de votre visite ! À très bientôt."
                    className="h-12"
                  />
                  <p className="text-xs text-stone-400 mt-1">Affiché après la commande sur place</p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-stone-700 mb-2">
                    Pied de ticket
                  </label>
                  <Input
                    value={formData.receiptFooter}
                    onChange={(e) => handleChange('receiptFooter', e.target.value)}
                    placeholder="À bientôt !"
                    className="h-12"
                  />
                  <p className="text-xs text-stone-400 mt-1">Affiché en bas du ticket de caisse</p>
                </div>
              </div>
            </div>

            {/* Copyright Preview - Auto-generated */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 p-6 rounded-3xl border border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-700 mb-1">Pied de page (auto-généré)</h3>
                  <p className="text-stone-500 text-sm">{generatedFooterText}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-stone-200 text-xs text-stone-500">
                  Année + Nom du restaurant
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
