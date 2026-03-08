
import { ArrowRight } from 'lucide-react';
import type { BrandingConfig } from '../../context/BrandingContext';

interface HomeMinimalProps {
    branding: BrandingConfig;
    onDineInClick: () => void;
    onTakeoutClick: (e?: any) => void;
    tenantPath: string;
}

export function HomeMinimal({ branding, onDineInClick, onTakeoutClick }: HomeMinimalProps) {
    return (
        <div className="flex flex-col flex-1 bg-white">
            {/* Minimal Hero */}
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 md:px-6">
                <h1 className="text-5xl md:text-9xl font-black text-stone-900 tracking-tighter mb-4 text-center leading-[0.9]">
                    {branding.name}
                </h1>
                <p className="text-xl md:text-3xl font-serif italic text-stone-400 mb-12 text-center max-w-2xl leading-relaxed px-4">
                    "{branding.tagline || 'L\'excellence dans chaque bouchée.'}"
                </p>

                <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
                    <button onClick={onTakeoutClick} className="flex-1 w-full py-5 border-b-2 border-stone-900 text-stone-900 text-xl font-bold flex items-center justify-between group hover:bg-stone-50 transition-colors px-4">
                        <span>À Emporter</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button onClick={onDineInClick} className="flex-1 w-full py-5 border-b-2 border-stone-200 text-stone-400 text-xl font-bold flex items-center justify-between group hover:text-stone-900 hover:border-stone-900 transition-all px-4">
                        <span>Sur Place</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Image Strip */}
            {branding.heroImage && (
                <div className="h-[40vh] w-full bg-cover bg-center bg-fixed grayscale hover:grayscale-0 transition-all duration-700"
                    style={{ backgroundImage: `url(${branding.heroImage})` }}
                ></div>
            )}

            {/* Minimal Info */}
            <div className="py-24 px-6 bg-stone-50">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Adresse</h3>
                        <p className="text-xl text-stone-900 font-serif leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                            {branding.address}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Contact</h3>
                        <p className="text-xl text-stone-900 font-serif leading-relaxed">
                            {branding.phone}<br />
                            <span className="text-base text-stone-500">contact@{branding.name.toLowerCase().replace(/\s/g, '')}.com</span>
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Horaires</h3>
                        <p className="text-xl text-stone-900 font-serif leading-relaxed">
                            {branding.openingHours}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
