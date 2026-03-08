

import { ArrowRight, ShoppingBag, UtensilsCrossed, Clock, ChefHat, MapPin, QrCode } from 'lucide-react';
import type { BrandingConfig } from '../../context/BrandingContext';

interface HomeClassicProps {
  branding: BrandingConfig;
  onDineInClick: () => void;
  onTakeoutClick: (e?: any) => void;
  tenantPath: string;
}

export function HomeClassic({ branding, onDineInClick, onTakeoutClick }: HomeClassicProps) {
  return (
    <>
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center min-h-[50vh] md:min-h-[60vh] flex items-center"
        style={{
          backgroundImage: branding.heroImage
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${branding.heroImage})`
            : `linear-gradient(135deg, ${branding.primaryColor || '#f97316'}, ${branding.secondaryColor || '#dc2626'})`,
          backgroundColor: branding.primaryColor || '#8B4513'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-32 md:pt-20 md:pb-40 w-full">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
              {branding.name}{' '}
              <span className="italic font-serif" style={{ color: branding.secondaryColor || '#f97316' }}>{branding.businessType || 'Restaurant'}.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-2">
              {branding.tagline || 'Commandez. Savourez. Profitez.'}
            </p>
            <p className="text-white/70 mb-8 text-sm md:text-base">
              Cuisine authentique, service rapide, plaisir garanti.
            </p>
            <button
              onClick={onTakeoutClick}
              className="text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ background: 'var(--primary-gradient)' }}
            >
              Commander maintenant
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Service Cards Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 mb-16 w-full">
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
            <button onClick={onTakeoutClick} className="w-full py-3 rounded-xl border-2 border-orange-500 text-orange-600 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
              Commander <ArrowRight className="w-4 h-4" />
            </button>
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
              onClick={onDineInClick}
              className="w-full py-3 rounded-xl border-2 border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              Scanner / Commander <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Why Order Here Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-grow">
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
    </>
  );
}
