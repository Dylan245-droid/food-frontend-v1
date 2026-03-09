
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ArrowRight, ShieldCheck,
    UtensilsCrossed, Smartphone, Heart, Users, Star, Check, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PRICING_FEATURES } from '../../data/pricingFeatures';

// --- Assets & Data ---

// --- Assets & Data ---

const Showcase = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                // Hardcode URL for dev stability
                const response = await axios.get('http://localhost:9015/api/tenants/featured');
                if (response.data && Array.isArray(response.data)) {
                    setTenants(response.data);
                }
            } catch (err: any) {
                console.error("Error fetching tenants:", err);
                setError(err.message || "Erreur de chargement");
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    // Placeholder for tenants without banner
    const DefaultBanner = () => (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
            <UtensilsCrossed className="w-16 h-16 text-white/10" />
        </div>
    );

    const getTenantImage = (t: any) => {
        if (t.heroImage) {
            if (t.heroImage.startsWith('http')) return t.heroImage;
            return `http://localhost:9015${t.heroImage}`;
        }
        return null;
    };

    const displayItems = tenants.length > 0 ? tenants : [];
    // Duplicate only if we have enough items to scroll smoothly, else just show static grid or single item?
    // Infinite scroll needs enough content. If 1 item, marquee looks weird.
    // If < 4 items, maybe just center them without marquee? 
    // For now, let's keep marquee logic but handle low count gracefully?
    // User requested "carousel", implying scroll.
    const cards = displayItems.length > 0
        ? [...displayItems, ...displayItems, ...displayItems, ...displayItems]
        : [];

    const getVisitLabel = (category: string) => {
        const cat = (category || '').toLowerCase();
        if (['boulangerie', 'pizzeria', 'pharmacie', 'boutique', 'crêperie'].some(t => cat.includes(t))) {
            return `Voir la ${category}`;
        }
        if (['épicerie', 'hôtel', 'hotel'].some(t => cat.includes(t))) {
            return `Voir l'${category}`;
        }
        return `Voir le ${category || 'Restaurant'}`;
    };

    if (loading) return null; // Don't show anything while loading to avoid flash
    if (cards.length === 0) return null;

    return (
        <Section className="py-12 md:py-20 overflow-hidden relative z-10 flex flex-col justify-start">
            {/* Header - Strictly separated from Marquee */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto px-6 mb-12 md:mb-24 relative text-center z-20"
            >
                <h2 className="text-4xl font-black text-white mb-6 drop-shadow-2xl">L'Élite du Goût.</h2>
                <p className="text-gray-400 max-w-lg mx-auto text-lg drop-shadow-md">
                    Rejoignez les meilleurs restaurateurs de la ville.
                </p>
            </motion.div>

            {/* Classic Marquee Container */}
            <div className="w-full relative group">
                <style>{`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .marquee-container:hover .marquee-track {
                        animation-play-state: paused !important;
                    }
                `}</style>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="marquee-container w-full py-4"
                >
                    <div
                        className="marquee-track flex gap-8 w-max px-6"
                        style={{
                            animation: `scroll ${Math.max(60, cards.length * 5)}s linear infinite`,
                            width: "max-content",
                            willChange: "transform"
                        }}
                    >
                        {cards.map((r, i) => {
                            const imageUrl = getTenantImage(r);
                            return (
                                <div
                                    key={i}
                                    onClick={() => window.open(`/r/${r.slug}`, '_blank')}
                                    className="w-[300px] aspect-[4/5] rounded-3xl overflow-hidden relative flex-shrink-0 cursor-pointer group/card border border-white/10 bg-gray-900 shadow-xl hover:scale-105 transition-transform duration-300"
                                >
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={r.name} className="absolute inset-0 w-full h-full object-cover filter grayscale group-hover/card:grayscale-0 transition-all duration-700" />
                                    ) : (
                                        <DefaultBanner />
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end opacity-90 group-hover/card:opacity-100 transition-opacity">
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover/card:text-orange-500 transition-colors">{r.name}</h3>
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover/card:text-white mb-4">{r.category || 'Restaurant'}</div>

                                        <div className="flex items-center gap-2 text-sm font-bold text-white opacity-0 group-hover/card:opacity-100 transition-all translate-y-4 group-hover/card:translate-y-0">
                                            {getVisitLabel(r.category)} <ArrowRight className="w-4 h-4 text-orange-500" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </Section>
    );
};
// --- Floating 3D Element ---

const FloatingFood = () => {
    const { scrollYProgress } = useScroll();
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        return scrollYProgress.on("change", (latest) => {
            let nextStep = 0;
            if (latest < 0.2) nextStep = 0;
            else if (latest < 0.5) nextStep = 1;
            else if (latest < 0.8) nextStep = 2;
            else nextStep = 3;

            // Only update state if the step actually changed to save cycles
            setCurrentStep(prev => prev !== nextStep ? nextStep : prev);
        });
    }, [scrollYProgress]);

    // Smooth physics-based movement - Slightly softer on mobile to reduce jank
    const y = useSpring(useTransform(scrollYProgress, [0, 1], [-50, 600]), { stiffness: 45, damping: 30 });
    const rotate = useSpring(useTransform(scrollYProgress, [0, 1], [0, 180]), { stiffness: 35, damping: 45 });
    const x = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], ["40%", "10%", "-30%", "20%", "0%"]), { stiffness: 50, damping: 30 });
    const scale = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8], [0.9, 1.05, 0.85, 1.1]), { stiffness: 50, damping: 30 });

    const images = [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", // Burger
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80", // Salad
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80", // Pizza
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80"  // Dessert
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
            {/* The Plate */}
            <motion.div
                style={{ x, y, rotate, scale }}
                className="relative w-[30vh] h-[30vh] md:w-[50vh] md:h-[50vh] opacity-90 will-change-transform"
            >
                {/* Glow behind - Disabled on mobile to save GPU */}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-red-600 rounded-full blur-[20px] md:blur-[80px] opacity-20 md:opacity-40" />

                <AnimatePresence mode='wait'>
                    <motion.img
                        key={currentStep}
                        src={images[currentStep]}
                        transition={{ duration: 0.4 }}
                        className="w-full h-full object-cover rounded-full shadow-2xl border-4 border-white/5 will-change-transform"
                        alt="Dish"
                        style={{ transform: 'translateZ(0)' }} // Force GPU
                    />
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

// --- Glass Sections ---

const Navbar = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4" style={{ transform: 'translateZ(0)' }}>
            <div className="bg-black/80 backdrop-blur-lg border border-white/10 rounded-full py-2.5 px-4 md:px-6 flex items-center gap-4 md:gap-8 shadow-2xl">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/logo_dark.png" alt="GoTchop" className="h-10 md:h-14" />
                </div>
                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Accueil</button>
                    <button onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })} className="hover:text-white transition-colors">Solutions</button>
                    <button onClick={() => window.scrollTo({ top: 3000, behavior: 'smooth' })} className="hover:text-white transition-colors">Tarifs</button>
                </div>
                <button
                    onClick={() => user ? navigate('/admin/dashboard') : navigate('/login')}
                    className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-1"
                >
                    {user ? (
                        <>Dashboard <LayoutDashboard className="w-3 h-3" /></>
                    ) : (
                        <>Connexion <ChevronRight className="w-3 h-3" /></>
                    )}
                </button>
            </div>
        </nav>
    );
};

const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <section className={`relative z-10 min-h-screen py-12 md:py-20 flex items-center ${className}`}>
        {children}
    </section>
);

const BentoCard = ({ children, title, sub, className = "", delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay, duration: 0.4 }}
        className={`bg-black/60 backdrop-blur-lg border border-white/10 p-6 md:p-8 rounded-[2rem] overflow-hidden relative group hover:border-orange-500/30 transition-colors ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative z-10 h-full flex flex-col">
            <div className="mb-6">
                {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
                {sub && <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">{sub}</p>}
            </div>
            {children}
        </div>
    </motion.div>
);

const Hero = () => {
    const navigate = useNavigate();
    return (
        <Section className="justify-center text-center overflow-hidden pt-24 md:pt-40">
            <div className="max-w-[90vw] relative z-10">
                {/* Softer background glow */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-orange-500/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"
                />

                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium text-xs md:text-sm mb-6 md:mb-8 backdrop-blur-sm">
                    <Star className="w-3 h-3 md:w-4 md:h-4 fill-orange-400" />
                    <span>La plateforme préférée des restaurateurs</span>
                </div>

                <h1 className="text-4xl md:text-8xl font-black text-white leading-tight mb-8 tracking-tight drop-shadow-2xl">
                    Petit ou Grand,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 animate-gradient-x">
                        Vous êtes le Chef.
                    </span>
                </h1>

                <div className="flex flex-col items-center">
                    <p className="text-lg md:text-3xl text-gray-200 font-light max-w-4xl mx-auto mb-10 md:mb-12 leading-relaxed drop-shadow-lg">
                        Tenir un restaurant est un défi quotidien. <br className="hidden md:block" />
                        <span className="text-white font-medium">GoTchop</span> est l'allié qui s'adapte à votre réalité, pour que vous puissiez vous concentrer sur ce qui compte : <span className="text-orange-400 italic font-serif">vos clients.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => navigate('/register')}
                            className="group relative px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 overflow-hidden shadow-2xl shadow-orange-900/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Je lance mon activité <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>

                        <button
                            onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
                            className="px-10 py-5 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3 group"
                        >
                            Pourquoi GoTchop ?
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </button>
                    </div>
                </div>
            </div>
        </Section>
    );
};

const ValueProposition = () => {
    return (
        <Section className="py-16 md:py-32">
            <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-16 items-center">
                <BentoCard title="Sans Friction" sub="L'expérience QR Code" className="min-h-[400px]">
                    <div className="space-y-6">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Vos clients veulent manger, pas installer une App. Avec GoTchop, c'est Scan, Commande, Miam.
                        </p>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <Smartphone className="w-8 h-8 text-orange-500" />
                            <div className="text-sm text-gray-400">
                                Scan QR <span className="text-orange-500">→</span> Menu <span className="text-orange-500">→</span> Commande <br />
                                <span className="text-green-400 font-bold">Zéro inscription. Zéro délai.</span>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                <div className="space-y-12">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative pl-8 border-l-2 border-orange-500/30"
                    >
                        <Heart className="w-8 h-8 text-red-500 mb-4 fill-red-500" />
                        <h3 className="text-3xl font-bold text-white mb-4">Clients Fidèles</h3>
                        <p className="text-gray-400 text-lg">
                            Le compte client devient un <strong className="text-white">privilège VIP</strong>.
                            Offrez des points, des promos et un statut à vos meilleurs clients.
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative pl-8 border-l-2 border-orange-500/30"
                    >
                        <Users className="w-8 h-8 text-orange-500 mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-4">Adapté au Réel</h3>
                        <p className="text-gray-400 text-lg">
                            Coupure d'électricité ? Internet lent ? Rush hour ?
                            GoTchop continue de fonctionner. Robuste comme nous.
                        </p>
                    </motion.div>
                </div>
            </div>
        </Section>
    )
}

const FeaturesGrid = () => {
    return (
        <Section>
            <div className="max-w-7xl mx-auto px-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 md:mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Pilotage Intégral.</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">De la prise de commande à la gestion des stocks, tout est là.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-auto">
                    <BentoCard title="Cuisine Connectée" sub="Système KDS" className="md:col-span-2 md:row-span-2 min-h-[400px]" delay={0.1}>
                        <p className="text-gray-400 mb-8 max-w-md">
                            Fini les cris et les tickets perdus. Les commandes s'affichent en temps réel en cuisine, classées par priorité et temps de préparation.
                        </p>
                        <div className="flex-1 rounded-xl bg-gray-900/50 border border-white/5 p-4 relative overflow-hidden flex flex-col justify-center gap-3">
                            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <span className="font-bold text-green-400">Table 4</span>
                                <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">PRÊT</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-bold text-orange-400">Table 8</span>
                                    <span className="text-xs text-gray-500">2x Poulet DG</span>
                                </div>
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-bold animate-pulse">EN COURS</span>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard title="Menu Digital" sub="Modifiez en 1 clic" className="md:col-span-1" delay={0.2}>
                        <div className="flex items-center justify-center h-full py-8">
                            <UtensilsCrossed className="w-16 h-16 text-white/20" />
                        </div>
                    </BentoCard>

                    {/* New CTA Card for Full Features */}
                    <div
                        onClick={() => window.location.href = '/features'}
                        className="md:col-span-1 bg-orange-600 rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer hover:bg-orange-500 transition-colors group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform">
                            <ArrowRight className="w-12 h-12 text-black" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white leading-tight">Voir toutes les <br />fonctionnalités</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
};



const Pricing = () => {
    return (
        <Section className="py-12 md:py-20 relative z-10">
            <div className="max-w-7xl mx-auto px-6 w-full">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Tarifs Transparents.</h2>
                    <p className="text-gray-400 text-lg">
                        <span className="text-orange-500 font-bold">14 jours d'essai gratuits</span> avec toutes les fonctionnalités <span className="text-white font-bold">Élite</span> débloquées. <br />
                        Aucune carte bancaire requise. Annulez à tout moment.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* ESSENTIEL */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col hover:border-orange-500/30 transition-colors"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">Essentiel</h3>
                            <p className="text-gray-500 text-sm">Maquis, Fast-Food, Boulangerie, Dark Kitchen</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">35 000</span>
                            <span className="text-sm font-medium text-gray-400"> F / mois</span>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {PRICING_FEATURES.ESSENTIAL.map(f => (
                                <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-white shrink-0" /> {f}
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-black transition-colors">Choisir Essentiel</button>
                    </motion.div>

                    {/* PRO */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-gradient-to-b from-orange-900/40 to-black/60 border border-orange-500 rounded-3xl p-8 flex flex-col relative transform md:scale-110 shadow-[0_0_60px_rgba(234,88,12,0.2)] z-10"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Recommandé</div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-orange-500 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-orange-500" /> Pro
                            </h3>
                            <p className="text-gray-400 text-sm">Restaurants, Pizzerias, Lounges, Glaciers</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">65 000</span>
                            <span className="text-sm font-medium text-gray-400"> F / mois</span>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {PRICING_FEATURES.PRO.map(f => (
                                <div key={f} className="flex items-center gap-3 text-sm text-white">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    {f}
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-colors shadow-lg hover:shadow-orange-500/25">Prendre le Pro</button>
                    </motion.div>

                    {/* ÉLITE */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col hover:border-orange-500/30 transition-colors"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white">Élite</h3>
                            <p className="text-gray-500 text-sm">Hôtels, Chaînes, Franchises, Food Courts</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">150 000</span>
                            <span className="text-sm font-medium text-gray-400"> F / mois</span>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            {PRICING_FEATURES.ELITE.map(f => (
                                <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                    <ShieldCheck className="w-4 h-4 text-white shrink-0" /> {f}
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white hover:text-black transition-colors">Contacter Ventes</button>
                    </motion.div>
                </div>
            </div>
        </Section>
    );
};

const Footer = () => {
    const navigate = useNavigate();
    return (
        <footer className="relative z-10 bg-black py-12 md:py-20 border-t border-white/10 mt-12 md:mt-20">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 md:gap-12">
                <div className="col-span-2">
                    <div className="text-2xl font-black text-white flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/logo_dark.png" alt="GoTchop" className="h-10 md:h-14" />
                    </div>
                    <p className="text-gray-500 max-w-sm">
                        La technologie au service de la gastronomie.
                        Digitalisez votre restaurant aujourd'hui, sans friction.
                    </p>
                    <div className="mt-6 flex gap-4">
                        {/* Socials placeholders */}
                        <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-orange-500 transition-colors flex items-center justify-center cursor-pointer">X</div>
                        <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-orange-500 transition-colors flex items-center justify-center cursor-pointer">In</div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-4">Produit</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><button onClick={() => navigate('/features')} className="hover:text-orange-500 transition-colors text-left">Fonctionnalités</button></li>
                        <li><button onClick={() => navigate('/register')} className="hover:text-orange-500 transition-colors text-left">Tarifs</button></li>
                        <li><button onClick={() => navigate('/contact')} className="hover:text-orange-500 transition-colors text-left">Solutions Entreprise</button></li>
                        <li><button onClick={() => navigate('/guide')} className="hover:text-orange-500 transition-colors text-left">Guide de démarrage</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-4">Légal</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li><button onClick={() => navigate('/legal/terms')} className="hover:text-orange-500 transition-colors text-left">Conditions Générales (CGU)</button></li>
                        <li><button onClick={() => navigate('/legal/privacy')} className="hover:text-orange-500 transition-colors text-left">Confidentialité</button></li>
                        <li><button onClick={() => navigate('/legal/mentions')} className="hover:text-orange-500 transition-colors text-left">Mentions Légales</button></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-12 md:mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-xs font-mono">
                © {new Date().getFullYear()} NOUN CONCEPT. Fait avec passion à Libreville, Gabon.
            </div>
        </footer>
    );
};

export default function GoTchopLandingPage() {
    return (
        <div className="bg-[#050505] min-h-screen text-white selection:bg-orange-500 selection:text-white overflow-x-hidden font-sans">
            <Navbar />
            <FloatingFood />

            <main>
                <Hero />
                <ValueProposition />
                <FeaturesGrid />
                <Showcase />
                <Pricing />
            </main>

            <Footer />
        </div>
    );
}
