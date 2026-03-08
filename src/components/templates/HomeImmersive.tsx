
import { ChevronDown } from 'lucide-react';
import type { BrandingConfig } from '../../context/BrandingContext';

interface HomeImmersiveProps {
  branding: BrandingConfig;
  onDineInClick: () => void;
  onTakeoutClick: (e?: any) => void;
  tenantPath: string;
}

export function HomeImmersive({ branding, onDineInClick, onTakeoutClick }: HomeImmersiveProps) {
  return (
    <div className="flex flex-col flex-1 bg-black">
      {/* Immersive Hero */}
      <div
        className="relative h-screen w-full bg-cover bg-center flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-20"
        style={{
          backgroundImage: branding.heroImage
            ? `linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2), rgba(0,0,0,0.1)), url(${branding.heroImage})`
            : `linear-gradient(135deg, ${branding.primaryColor || '#f97316'}, ${branding.secondaryColor || '#dc2626'})`
        }}
      >
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-block px-4 py-1.5 border border-white/30 rounded-full text-white/80 text-xs font-bold tracking-[0.2em] mb-6 uppercase backdrop-blur-md">
            {branding.businessType || 'Experience Culinaire'}
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white leading-tight mb-6 break-words">
            {branding.name}
          </h1>
          <p className="text-lg md:text-2xl text-white/70 font-light mb-10 max-w-2xl">
            {branding.tagline || 'Laissez-vous guider par vos sens.'}
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={onTakeoutClick}
              className="bg-white text-black font-bold py-4 px-10 rounded-full text-lg hover:bg-stone-200 transition-colors w-full md:w-auto"
            >
              Commander Maintenant
            </button>
            <button
              onClick={onDineInClick}
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/20 transition-colors w-full md:w-auto"
            >
              Manger sur Place
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <ChevronDown className="w-8 h-8" />
        </div>
      </div>

      {/* Dark Mode Content */}
      <div className="bg-stone-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">L'art de la table, <br />simplifié.</h2>
            <p className="text-stone-400 text-lg leading-relaxed mb-8">
              Nous avons repensé l'expérience de restauration pour vous offrir fluidité et plaisir. Que ce soit en livraison ou sur place, profitez de notre cuisine d'exception sans les contraintes habituelles.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black text-white mb-1">15 min</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Temps moyen</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white mb-1">Fresh</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Produits Locaux</div>
              </div>
            </div>
          </div>
          <div className="relative aspect-square rounded-full border border-white/10 flex items-center justify-center p-12">
            <div className="relative z-10 text-center">
              <div className="text-lg font-serif italic text-white/60 mb-2">"Une expérience inoubliable"</div>
              <div className="text-sm font-bold text-white uppercase tracking-widest">- Le Guide Food</div>
            </div>
            <div className="absolute inset-4 rounded-full border border-white/5 animate-spin-slow"></div>
            <div className="absolute inset-16 rounded-full border border-white/5 animate-reverse-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
