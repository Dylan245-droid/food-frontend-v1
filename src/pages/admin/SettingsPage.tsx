import { useState, useEffect, useRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings, Save, ChefHat, Palette, MessageSquare, Loader2, Upload, Image } from 'lucide-react';
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
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      // On envoie aussi le footerText généré automatiquement
      await updateBranding({
        ...formData,
        footerText: generatedFooterText,
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
