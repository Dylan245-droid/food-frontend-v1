import { Star, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    featureName?: string;
    description?: string;
}

export default function UpgradeModal({ open, onClose, featureName, description }: UpgradeModalProps) {
    const navigate = useNavigate();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 hover:text-white transition-colors z-20"
                >
                    <X className="w-5 h-5 text-white/70" />
                </button>

                {/* Header Graphic */}
                <div className="bg-stone-900 text-white p-6 text-center relative shrink-0">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                     <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/50 mb-3 rotate-3">
                            <Star className="w-6 h-6 text-white fill-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-1">Passez au niveau Pro</h2>
                        <p className="text-orange-200 text-xs font-medium uppercase tracking-widest">Fonctionnalité Premium</p>
                     </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="text-center mb-6">
                        <p className="text-stone-600 text-base mb-1">
                            {featureName ? (
                                <>L'accès à <span className="font-bold text-stone-900">{featureName}</span> est réservé aux membres Pro.</>
                            ) : (
                                "Cette fonctionnalité est réservée aux membres Pro."
                            )}
                        </p>
                        <p className="text-stone-400 text-xs">
                            {description || "Débloquez cette fonctionnalité et bien d'autres en mettant à niveau votre abonnement."}
                        </p>
                    </div>

                    <div className="space-y-2 mb-6">
                        {[
                            'Tables Illimitées',
                            'Écran Cuisine (KDS)',
                            'Finance & Compta',
                            'Gestion de Stocks',
                            'Plan de Salle 3D'
                        ].map((feature) => (
                            <div key={feature} className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg",
                                featureName === feature ? "bg-green-50 text-green-700" : "bg-stone-50 text-stone-500"
                            )}>
                                <ShieldCheck className={cn("w-4 h-4", featureName === feature ? "text-green-600" : "text-stone-400")} />
                                <span className="font-medium text-sm">{feature}</span>
                                {featureName === feature && <span className="ml-auto text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">REQUIS</span>}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-3 mt-auto">
                        <Button 
                            onClick={() => {
                                onClose();
                                navigate('/admin/subscription');
                            }}
                            className="w-full bg-stone-900 hover:bg-black text-white py-3 text-base shadow-xl shadow-stone-900/10 rounded-xl"
                        >
                            Voir les offres
                        </Button>
                        <button 
                            onClick={onClose}
                            className="w-full py-2 text-stone-400 font-bold hover:text-stone-600 transition-colors text-xs"
                        >
                            Non, merci
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
