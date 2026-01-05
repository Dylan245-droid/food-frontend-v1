import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UtensilsCrossed, ShoppingBag, Download, ArrowRight, MapPin, ChefHat } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FFF8F3] text-stone-800 font-sans overflow-x-hidden">
      {/* Decorative Background Blobs - Warm & Organic */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[70vw] h-[70vw] bg-orange-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] bg-red-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-yellow-200/20 rounded-full blur-[80px] mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto min-h-screen flex flex-col p-6 md:p-12">
        
        {/* Header / Hero Section - Compact Mobile, Bold Desktop */}
        <header className="pt-4 pb-6 md:pb-12 md:text-center md:pt-16">
          <div className="flex items-center gap-2 mb-2 md:mb-4 md:justify-center">
            <span className="bg-red-100 text-red-800 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wider uppercase border border-red-200 shadow-sm">
              Ouvert
            </span>
            <span className="text-stone-400 text-xs md:text-sm italic">Le plaisir de manger</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-stone-900 leading-[0.9] tracking-tight mb-2 md:mb-6">
            Sauce <br className="md:hidden" />
            <span className="text-red-600 italic font-serif pr-2">Créole.</span>
          </h1>
          <p className="text-sm md:text-lg text-stone-600 font-medium max-w-[90%] md:max-w-xl md:mx-auto leading-relaxed border-l-2 md:border-l-0 md:border-t-4 border-orange-300 pl-3 md:pl-0 md:pt-4 mt-3 md:mt-6">
            L'authenticité dans chaque assiette. Pas de chichis, juste du goût.
          </p>
        </header>

        {/* Main Actions - Stacked Vertical Layout */}
        <main className="flex-1 flex flex-col gap-8 md:gap-12 max-w-4xl mx-auto w-full">
          
          {/* Card 1: Takeout - Express Mobile Layout */}
          <section className="relative group w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl md:rounded-3xl transform rotate-0 md:rotate-1 group-hover:rotate-2 transition-transform duration-300 shadow-xl shadow-orange-900/20"></div>
            <div className="relative bg-[#1A1A1A] rounded-2xl md:rounded-2xl p-5 md:p-8 text-white overflow-hidden shadow-inner border border-white/5 flex flex-col justify-between">
              
              {/* Abstract pattern overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 md:w-32 md:h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex justify-between items-start mb-6 md:mb-6 relative z-10">
                <div className="max-w-[75%] md:max-w-[70%]">
                   <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-orange-400 flex-shrink-0" />
                    À Emporter
                   </h2>
                   <p className="text-stone-400 text-xs md:text-base leading-tight">Pas le temps ? On prépare tout.</p>
                </div>
                {/* QR Trigger - Top Right for easy reach or visual balance */}
                <div 
                  className="bg-white/10 p-2 md:p-2 rounded-xl backdrop-blur-md border border-white/10 cursor-pointer hover:bg-white/20 transition-colors flex-shrink-0 active:scale-95 duration-200"
                  onClick={() => setIsQrModalOpen(true)}
                >
                  <QRCodeSVG value={takeoutUrl} size={32} fgColor="#FFFFFF" bgColor="transparent" className="md:w-[56px] md:h-[56px]" />
                </div>
              </div>

              <Link to="/takeout" className="mt-auto relative z-10">
                <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 md:py-4 rounded-xl flex items-center justify-between px-5 md:px-6 transition-all shadow-lg shadow-orange-900/30 group-hover:translate-x-1 text-base md:text-base active:bg-orange-700 active:scale-[0.98]">
                  <span>Commander maintenant</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </section>

          {/* Card 2: Dine-in - Compact Input & Grid */}
          <section className="relative w-full">
            {/* Ticket/Paper texture effect */}
            <div className="bg-white rounded-2xl md:rounded-t-2xl md:rounded-b-lg p-1 md:p-1 shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-stone-100 flex flex-col">
               <div className="border border-dashed border-stone-200 rounded-xl md:rounded-xl p-5 md:p-8 bg-stone-50/50 flex-1 flex flex-col">
                <div className="flex items-center gap-3 md:gap-3 mb-5 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-200 rounded-full flex items-center justify-center text-stone-600 flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-stone-800">Sur Place</h2>
                    <p className="text-[10px] md:text-sm text-stone-500 font-bold uppercase tracking-wide">Service en salle</p>
                  </div>
                </div>

                <div className="space-y-5 md:space-y-6 flex-1">
                  <div className="relative">
                     <label className="absolute -top-2 md:-top-2.5 left-3 md:left-3 bg-stone-50 px-1 md:px-2 text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-wider">
                       Votre Table
                     </label>
                     <div className="flex gap-2 md:gap-2">
                       <Input 
                          placeholder="A1..." 
                          value={tableCode} 
                          onChange={e => setTableCode(e.target.value.toUpperCase())} 
                          className="h-14 md:h-16 text-xl md:text-xl font-mono tracking-widest bg-white border-stone-200 shadow-sm focus:border-red-400 focus:ring-red-100 pl-4 md:pl-4 rounded-lg md:rounded-lg"
                        />
                        <Button 
                          onClick={handleGo} 
                          disabled={!tableCode}
                          variant="ghost"
                          className="h-14 md:h-16 px-6 md:px-8 bg-stone-800 text-white hover:bg-stone-700 font-bold rounded-lg md:rounded-lg shadow-md md:shadow-md disabled:bg-stone-200 disabled:text-stone-400 text-lg md:text-lg"
                        >
                          GO
                        </Button>
                     </div>
                  </div>

                  {/* Available Tables - Organic Tags but Compact */}
                  {loading ? (
                       <div className="h-8 md:h-8 w-1/2 bg-stone-200/50 rounded animate-pulse"></div>
                  ) : (
                    <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-2 mt-4 md:mt-4">
                        {tablesData?.data.map((table, idx) => (
                          <button 
                              key={table.id}
                              onClick={() => setTableCode(table.code)}
                              className={`
                                text-sm md:text-sm font-bold py-2 md:px-4 md:py-2 rounded-lg md:rounded-md border transition-all duration-200 shadow-sm
                                ${idx % 2 === 0 ? 'bg-white text-green-700 border-green-100 md:rotate-1 hover:border-green-300' : 'bg-white text-blue-700 border-blue-100 md:-rotate-1 hover:border-blue-300'}
                                active:scale-95 hover:md:scale-105 hover:shadow-md hover:z-10
                              `}
                          >
                              {table.name}
                          </button>
                        ))}
                         {tablesData?.data?.length === 0 && (
                            <span className="text-xs md:text-xs text-stone-400 italic">Tout est complet...</span>
                        )}
                    </div>
                  )}
                </div>
               </div>
            </div>
            {/* Ragged edge effect at bottom (simulated) */}
             <div className="h-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100/0 via-stone-200/20 to-stone-100/0 mx-2 -mt-1 rounded-full blur-[2px]"></div>
          </section>

        </main>

        <footer className="py-8 text-center opacity-60">
           <div className="flex justify-center gap-6 mb-4">
              <div className="flex flex-col items-center gap-1">
                 <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <ChefHat className="w-4 h-4" />
                 </div>
                 <span className="text-[10px] font-bold tracking-wider uppercase">Frais</span>
              </div>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <MapPin className="w-4 h-4" />
                 </div>
                 <span className="text-[10px] font-bold tracking-wider uppercase">Local</span>
              </div>
           </div>
           <p className="text-xs font-medium text-stone-400">© 2026 Sauce Créole.</p>
        </footer>
      </div>

       {/* QR Modal - Clean & Functional */}
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
    </div>
  )
}
