import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UtensilsCrossed, ShoppingBag, Download, ArrowRight, MapPin, ChefHat, Clock, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../components/ui/Modal';
import { useBranding } from '../context/BrandingContext';

export default function HomePage() {
  const { branding } = useBranding();
  const { data: tablesData, loading } = useFetch<{ data: any[] }>('/tables/available');
  const [tableCode, setTableCode] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDineInModalOpen, setIsDineInModalOpen] = useState(false);
  const navigate = useNavigate();

  // Base URL for QR codes
  const baseUrl = window.location.origin;
  const takeoutUrl = `${baseUrl}/takeout`;

  // Sticky Session Check
  useEffect(() => {
    const activeCode = localStorage.getItem('activeTableCode');
    if (activeCode) {
        navigate(`/dine-in/${activeCode}`);
    }
  }, [navigate]);

  const handleGo = () => {
    if(tableCode) navigate(`/dine-in/${tableCode}`);
  };

  const downloadQrCode = () => {
      const svg = document.getElementById('takeout-qr-code');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          
          const downloadLink = document.createElement('a');
          downloadLink.download = 'qr-emporter.png';
          downloadLink.href = pngFile;
          downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen text-stone-800 font-sans overflow-x-hidden bg-stone-50">
      
      {/* Hero Section with Background */}
      <div 
        className="relative bg-cover bg-center min-h-[50vh] md:min-h-[60vh] flex items-center"
        style={{ 
          backgroundImage: branding.heroImage 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${branding.heroImage})`
            : `linear-gradient(135deg, ${branding.primaryColor || '#f97316'}, ${branding.secondaryColor || '#dc2626'})`,
          backgroundColor: branding.primaryColor || '#8B4513'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 w-full">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
              {branding.name.split(' ')[0]}{' '}
              <span className="italic font-serif text-orange-300">{branding.name.split(' ').slice(1).join(' ') || 'Restaurant'}.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-2">
              {branding.tagline || 'Commandez. Savourez. Profitez.'}
            </p>
            <p className="text-white/70 mb-8 text-sm md:text-base">
              Cuisine authentique, service rapide, plaisir garanti.
            </p>
            <Link to="/takeout">
              <button 
                className="text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ background: 'var(--primary-gradient)' }}
              >
                Commander maintenant
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Service Cards Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Card: À Emporter */}
          <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-7 h-7 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-stone-900">À Emporter</h3>
                <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" /> Prêt en 15-20 min
                </p>
              </div>
            </div>
            <Link to="/takeout" className="block">
              <button className="w-full py-3 rounded-xl border-2 border-orange-500 text-orange-600 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                Commander <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Card: Sur Place */}
          <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-7 h-7 text-stone-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-stone-900">Sur Place</h3>
                <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                  <QrCode className="w-3.5 h-3.5" /> Choisissez votre table
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsDineInModalOpen(true)}
              className="w-full py-3 rounded-xl border-2 border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              Scanner / Commander <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Why Order Here Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center text-stone-900 mb-8">Pourquoi commander ici ?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-stone-700">Commande rapide & sans attente</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-stone-700">Cuisine fraîche & locale</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-stone-700">Suivi en temps réel</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-stone-700">Retrait sur place</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>{branding.openingHours || 'OUVERT - 8h00 - 22h00'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>{branding.address || 'Adresse du restaurant'}</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
              <span>{branding.phone || '+XXX XXX XXX XXX'}</span>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-stone-800">
            <p className="text-xs text-stone-500">{branding.footerText || `© ${new Date().getFullYear()} ${branding.name}`}</p>
          </div>
        </div>
      </footer>

      {/* QR Modal for Takeout */}
      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Scanner pour Emporter">
        <div className="text-center space-y-6 py-2">
          <div className="bg-white p-4 rounded-xl inline-block border-2 border-dashed border-stone-200">
            <QRCodeSVG 
              id="takeout-qr-code"
              value={takeoutUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>
          <Button onClick={downloadQrCode} variant="outline" className="w-full border-stone-200 hover:bg-stone-50 text-stone-600">
            <Download className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </Modal>

      {/* Dine-In Modal with Table Selection */}
      <Modal isOpen={isDineInModalOpen} onClose={() => setIsDineInModalOpen(false)} title="Choisir une Table">
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-stone-600 mb-2">
              Entrez le numéro de table
            </label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: A1, T5..." 
                value={tableCode} 
                onChange={e => setTableCode(e.target.value.toUpperCase())} 
                className="h-14 text-xl font-mono tracking-widest"
                autoFocus
              />
              <Button 
                onClick={handleGo} 
                disabled={!tableCode}
                className="h-14 px-8 text-lg font-bold"
              >
                GO
              </Button>
            </div>
          </div>

          {!loading && tablesData?.data && tablesData.data.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 mb-3">Ou choisissez une table disponible :</p>
              <div className="grid grid-cols-4 gap-2">
                {tablesData.data.map((table) => (
                  <button 
                    key={table.id}
                    onClick={() => { setTableCode(table.code); handleGo(); }}
                    className="py-3 px-2 rounded-lg bg-green-50 border border-green-200 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors"
                  >
                    {table.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tablesData?.data?.length === 0 && (
            <p className="text-center text-stone-400 italic py-4">Toutes les tables sont occupées</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
