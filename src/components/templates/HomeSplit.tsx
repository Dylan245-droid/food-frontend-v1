
import { ArrowRight, ShoppingBag, UtensilsCrossed, Clock, MapPin, Star } from 'lucide-react';
import type { BrandingConfig } from '../../context/BrandingContext';

interface HomeSplitProps {
  branding: BrandingConfig;
  onDineInClick: () => void;
  onTakeoutClick: (e?: any) => void;
  tenantPath: string;
}

export function HomeSplit({ branding, onDineInClick, onTakeoutClick }: HomeSplitProps) {
  return (
    <div className="flex flex-col flex-1">
      {/* Split Hero Section */}
      <div className="flex flex-col-reverse md:flex-row min-h-[70vh]">
        <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white">
          <div className="text-left w-full max-w-lg">
            <div className="mb-6 inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold tracking-wider uppercase">
              Bienvenue chez nous
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-stone-900 leading-none mb-6">
              {branding.name}
              <span className="block text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mt-2 font-serif italic">
                {branding.businessType || 'Restaurant'}.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 mb-8 leading-relaxed">
              {branding.tagline || 'Commandez. Savourez. Profitez.'}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onTakeoutClick}
                className="text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all hover:translate-y-[-2px]"
                style={{ background: 'var(--primary-gradient)' }}
              >
                Commander
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onDineInClick}
                className="bg-white text-stone-800 border-2 border-stone-200 font-bold py-4 px-8 rounded-full flex items-center gap-2 hover:bg-stone-50 transition-colors"
              >
                Sur Place
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8 text-sm text-stone-500 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                {branding.openingHours}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                {branding.address}
              </div>
            </div>
          </div>
        </div>
        <div
          className="md:w-1/2 min-h-[40vh] md:min-h-full bg-cover bg-center relative"
          style={{
            backgroundImage: branding.heroImage ? `url(${branding.heroImage})` : `linear-gradient(135deg, ${branding.primaryColor || '#f97316'}, ${branding.secondaryColor || '#dc2626'})`
          }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
      </div>

      {/* Modern Grid Section */}
      <div className="py-20 px-6 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Click & Collect</h3>
              <p className="text-stone-500 mb-6">Commandez en ligne et récupérez votre repas tout chaud sans attendre.</p>
              <button onClick={onTakeoutClick} className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                Commencer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-6">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Manger sur Place</h3>
              <p className="text-stone-500 mb-6">Scannez le QR code sur votre table et commandez directement depuis votre mobile.</p>
              <button onClick={onDineInClick} className="text-stone-800 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                Scanner ma table <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-orange-100 bg-gradient-to-br from-white to-orange-50">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-6">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-stone-900">Programme Fidélité</h3>
              <p className="text-stone-600 mb-4">Gagnez des points à chaque commande et débloquez des récompenses exclusives.</p>
              <div className="text-sm font-bold text-orange-600 p-2 bg-orange-100 rounded-lg inline-block">
                1000 FCFA = {branding.loyalty_rate_takeout || 5} points
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
