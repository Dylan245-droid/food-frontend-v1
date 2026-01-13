import { useState, useEffect, useRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings, Save, ChefHat, Palette, MessageSquare, Loader2, Upload, Image, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

// Derive base URL from API configuration (same as MenuPage)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9015/api';
const BASE_URL = API_URL.replace('/api', ''); // remove /api suffix to get root

export default function SettingsPage() {
  const { branding, updateBranding, loading: brandingLoading } = useBranding();
  const [formData, setFormData] = useState({
    name: '',
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
    restaurant_coords: '', // Format: "lat, lng"
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer automatiquement le texte de copyright
  const currentYear = new Date().getFullYear();
  const generatedFooterText = `© ${currentYear} ${formData.name || 'Mon Restaurant'}. Tous droits réservés.`;

  useEffect(() => {
    if (branding) {
      setFormData({
        name: branding.name || '',
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
        restaurant_coords: branding.restaurant_lat && branding.restaurant_lng 
            ? `${branding.restaurant_lat}, ${branding.restaurant_lng}` 
            : '',
      });
    }
  }, [branding]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
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
      handleChange('logo', fullUrl);
      toast.success('Logo uploadé avec succès !');
    } catch (err) {
      toast.error("Erreur lors de l'upload du logo");
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
      });
      toast.success('Paramètres enregistrés avec succès !');
      setHasChanges(false);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900">Paramètres du Restaurant</h1>
            <p className="text-stone-500">Personnalisez l'identité de votre établissement</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-stone-900">Identité</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
                      <Image className="w-8 h-8 text-stone-400 mx-auto mb-1" />
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
                    className="h-12 px-6 border-stone-200 hover:border-orange-300 hover:bg-orange-50"
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Aperçu du thème
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div 
                className="h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Principale
              </div>
              <div 
                className="h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secondaire
              </div>
              <div 
                className="h-16 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
              >
                Gradient
              </div>
            </div>
          </div>

          {/* Image de fond Hero */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Image de fond (page d'accueil)
            </label>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center">
                {formData.heroImage && formData.heroImage.length > 0 ? (
                  <img src={formData.heroImage} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Image className="w-6 h-6 text-stone-400 mx-auto mb-1" />
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
                      handleChange('heroImage', fullUrl);
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
                  className="h-10 px-4 border-stone-200 hover:border-purple-300 hover:bg-purple-50"
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
        </div>

        {/* Infos Légales (Tickets/Factures) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <Settings className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-stone-900">Informations légales</h2>
          </div>
          <p className="text-sm text-stone-500">Ces informations apparaissent sur les tickets et factures</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-stone-900">Frais de Livraison (par ville)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Libreville</label>
              <div className="relative">
                <Input value={formData.fee_libreville} onChange={(e) => handleChange('fee_libreville', e.target.value)} type="number" className="h-12 pr-12" />
                <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Owendo</label>
              <div className="relative">
                <Input value={formData.fee_owendo} onChange={(e) => handleChange('fee_owendo', e.target.value)} type="number" className="h-12 pr-12" />
                <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Akanda</label>
              <div className="relative">
                <Input value={formData.fee_akanda} onChange={(e) => handleChange('fee_akanda', e.target.value)} type="number" className="h-12 pr-12" />
                <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Ntoum</label>
              <div className="relative">
                <Input value={formData.fee_ntoum} onChange={(e) => handleChange('fee_ntoum', e.target.value)} type="number" className="h-12 pr-12" />
                <span className="absolute right-4 top-3.5 text-stone-400 text-sm font-bold">FCFA</span>
              </div>
            </div>
            <div className="md:col-span-2 pt-4 border-t border-stone-100">
               <label className="block text-sm font-bold text-stone-700 mb-2">Commission Livreur (%)</label>
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

        {/* Position GPS du Restaurant */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <MapPin className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-stone-900">Position GPS du Restaurant</h2>
          </div>
          <p className="text-sm text-stone-500">Cette position sera affichée sur la carte du livreur. Collez les coordonnées depuis Google Maps ou utilisez votre position actuelle.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Coordonnées (latitude, longitude)</label>
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
                  className="h-12 shrink-0"
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
                      },
                      (err) => {
                        console.error(err);
                        toast.error("Impossible de récupérer la position");
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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
              <label className="block text-sm font-bold text-stone-700 mb-2">
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

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Modifications non enregistrées
            </span>
          )}
          <Button 
            type="submit" 
            disabled={saving || !hasChanges}
            className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
