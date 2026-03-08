import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Clock, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../components/ui/Modal';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { HomeClassic } from '../components/templates/HomeClassic';
import { HomeSplit } from '../components/templates/HomeSplit';
import { HomeMinimal } from '../components/templates/HomeMinimal';
import { HomeImmersive } from '../components/templates/HomeImmersive';


export default function HomePage() {
  const { branding } = useBranding();
  const { user } = useAuth(); // Import user
  const { data: tablesData, loading } = useFetch<{ data: any[] }>('/tables/available');
  const [tableCode, setTableCode] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDineInModalOpen, setIsDineInModalOpen] = useState(false);
  const navigate = useNavigate();

  const isStaff = user && ['admin', 'super_admin', 'serveur', 'caissier', 'cuisine'].includes(user.role);

  const blockStaffAction = () => {
      toast.error("Action impossible pour le staff", {
          description: "Veuillez passer par le Dashboard pour prendre une commande."
      });
  };

  const handleDineInClick = () => {
      if (isStaff) {
          blockStaffAction();
          return;
      }
      setIsDineInModalOpen(true);
  };

  const handleTakeoutClick = (e?: React.MouseEvent) => {
      if (isStaff) {
          e?.preventDefault();
          blockStaffAction();
          return;
      }
      navigate(`${tenantPath}/takeout`);
  };

  // Base URL for QR codes
  const baseUrl = window.location.origin;

  // Multi-tenant path handling
  const path = window.location.pathname;
  const match = path.match(/^\/r\/([^\/]+)/);
  const tenantSlug = match ? match[1] : null;
  const tenantPath = tenantSlug ? `/r/${tenantSlug}` : '';
  const takeoutUrl = `${baseUrl}${tenantPath}/takeout`;

  // Sticky Session Check
  useEffect(() => {
    const activeCode = localStorage.getItem('activeTableCode');
    if (activeCode) {
        navigate(`${tenantPath}/dine-in/${activeCode}`);
    }
  }, [navigate, tenantPath]);

  const handleGo = (code?: string) => {
    const targetCode = code || tableCode;
    if(targetCode) navigate(`${tenantPath}/dine-in/${targetCode}`);
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
    <div className="text-stone-800 font-sans overflow-x-hidden bg-stone-50 flex-1 flex flex-col">
      
      {/* Hero Section with Background */}
      {/* Template Dispatcher */}
      {(() => {
        const style = branding.heroStyle || 'classic';
        // Pass handleTakeoutClick explicitly
        const props = { 
            branding, 
            onDineInClick: handleDineInClick,
            onTakeoutClick: handleTakeoutClick, // New prop
            tenantPath 
        };

        switch (style) {
          case 'split':
            return <HomeSplit {...props} />;
          case 'minimal':
            return <HomeMinimal {...props} />;
          case 'immersive':
            return <HomeImmersive {...props} />;

          case 'classic':
          default:
            return <HomeClassic {...props} />;
        }
      })()}

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 w-full">
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
                onKeyDown={(e) => e.key === 'Enter' && handleGo()}
                className="h-14 text-xl font-mono tracking-widest w-full"
                autoFocus
              />
            </div>
          </div>

          {!loading && tablesData?.data && tablesData.data.length > 0 && (
            <div>
              <p className="text-sm text-stone-500 mb-3">Ou choisissez une table disponible :</p>
              <div className="grid grid-cols-4 gap-2">
                {tablesData.data.map((table) => (
                  <button 
                    key={table.id}
                    onClick={() => { setTableCode(table.code); handleGo(table.code); }}
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
