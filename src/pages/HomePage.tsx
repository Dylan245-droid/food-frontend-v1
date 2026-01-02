import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UtensilsCrossed, ShoppingBag, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../components/ui/Modal';

export default function HomePage() {
  const { data: tablesData, loading } = useFetch<{ data: any[] }>('/tables/available');
  const [tableCode, setTableCode] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
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
    <div className="space-y-8 animate-in fade-in duration-500">
       {/* Hero */}
       <div className="text-center py-8">
         <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Bienvenue à la Sauce Créole</h1>
         <p className="text-gray-600 text-lg">Choisissez votre mode de commande</p>
       </div>

       <div className="grid md:grid-cols-2 gap-6">
         {/* Takeout Card - Now with QR Code */}
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">À Emporter</h2>
            <p className="text-gray-500 mb-4">Commandez maintenant et récupérez au comptoir.</p>
            
            {/* Mini QR Code */}
            <div 
                className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block cursor-pointer hover:bg-gray-100 transition-colors mb-4"
                onClick={() => setIsQrModalOpen(true)}
            >
                <QRCodeSVG 
                    value={takeoutUrl}
                    size={100}
                    level="M"
                />
                <p className="text-xs text-gray-400 mt-2">Cliquer pour agrandir</p>
            </div>
            
            <Link to="/takeout">
                <Button className="w-full">
                    Commander à emporter
                </Button>
            </Link>
         </div>

         {/* Dine In Card (Active Interaction) */}
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
             <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sur Place</h2>
            
            <div className="space-y-3">
                <label className="block text-sm text-gray-500">Entrez votre code table</label>
                <div className="flex gap-2 justify-center max-w-xs mx-auto">
                    <Input 
                        placeholder="CODE" 
                        value={tableCode} 
                        onChange={e => setTableCode(e.target.value)} 
                        className="text-center font-mono uppercase"
                    />
                    <Button onClick={handleGo} disabled={!tableCode}>
                         GO
                    </Button>
                </div>
                
                {/* Available Tables List */}
                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tables Disponibles</h3>
                    {loading ? (
                        <div className="text-sm text-gray-400">Chargement...</div>
                    ) : (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {tablesData?.data.map(table => (
                                <button 
                                    key={table.id}
                                    onClick={() => setTableCode(table.code)}
                                    className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-100 transition-colors"
                                >
                                    {table.name} ({table.capacity}p)
                                </button>
                            ))}
                            {tablesData?.data?.length === 0 && (
                                <span className="text-sm text-gray-400 italic">Aucune table disponible pour le moment.</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
         </div>
       </div>

       {/* Takeout QR Code Modal */}
       <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="QR Code - Commande à emporter">
         <div className="text-center space-y-4">
           <p className="text-gray-500 text-sm">Scannez ce QR code pour accéder à la commande à emporter</p>
           <div className="bg-white p-6 rounded-xl inline-block border border-gray-200">
             <QRCodeSVG 
               id="takeout-qr-code"
               value={takeoutUrl}
               size={200}
               level="H"
               includeMargin={true}
             />
           </div>
           <p className="text-xs text-gray-400 font-mono break-all">{takeoutUrl}</p>
           <Button onClick={downloadQrCode} className="w-full">
             <Download className="w-4 h-4 mr-2" />
             Télécharger en PNG
           </Button>
         </div>
       </Modal>
    </div>
  )
}
