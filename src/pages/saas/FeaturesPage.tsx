import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap, ArrowRight, Smartphone, Globe,
    ChefHat, Wifi, Users, Clock
} from 'lucide-react';

const FeaturesPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter">GoTchop</span>
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-bold border border-white/10 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">
                    Retour
                </button>
            </nav>

            {/* Hero Section */}
            <header className="pt-24 md:pt-40 pb-16 md:pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight">
                            Plus qu'un Logiciel. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Votre Partenaire Invisible.</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            GoTchop ne gère pas juste des commandes. Il libère votre équipe, enchante vos clients et sécurise votre caisse. Dormez tranquille.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Feature Categories - Bento Style */}
            <div className="max-w-7xl mx-auto px-6 pb-20 md:pb-40 space-y-16 md:space-y-32">

                {/* 1. Salle & Clients */}
                <section>
                    <div className="flex items-end justify-between mb-8 md:mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4 flex items-center gap-4">
                                <span className="p-3 rounded-2xl bg-orange-500/10 text-orange-500"><Smartphone className="w-8 h-8" /></span>
                                L'Expérience Client
                            </h2>
                            <p className="text-gray-400 text-lg">La fluidité d'un grand hôtel, la simplicité d'un fast-food.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <BentoCard className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-orange-500/20">
                            <div className="h-full flex flex-col justify-between">
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold mb-2">Vos clients sont autonomes</h3>
                                    <p className="text-gray-400">Plus besoin d'agiter la main pour avoir le menu ou l'addition. Ils scannent, ils choisissent, ils savourent. Vous gagnez du temps, ils gagnent en confort.</p>
                                </div>
                                <div className="h-64 mt-4 bg-gradient-to-t from-orange-900/10 to-transparent relative overflow-hidden flex items-end justify-center">
                                    {/* Fake UI Element */}
                                    <div className="w-64 h-full bg-black border-t-4 border-x-4 border-zinc-800 rounded-t-3xl transform translate-y-10 shadow-2xl p-4 flex flex-col items-center">
                                        <div className="w-12 h-1 bg-zinc-800 rounded-full mb-4"></div>
                                        <div className="w-full h-32 bg-zinc-900 rounded-xl mb-2 animate-pulse"></div>
                                        <div className="w-full h-8 bg-zinc-900 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>

                        <BentoCard className="md:col-span-1 bg-zinc-900/50">
                            <div className="p-8">
                                <Wifi className="w-8 h-8 text-blue-500 mb-6" />
                                <h3 className="text-xl font-bold mb-2">Jamais en panne</h3>
                                <p className="text-gray-400 text-sm">Internet instable ? Pas de panique. GoTchop continue de tourner en local comme si de rien n'était. C'est du solide.</p>
                            </div>
                        </BentoCard>

                        <BentoCard className="md:col-span-1 bg-zinc-900/50">
                            <div className="p-8">
                                <Globe className="w-8 h-8 text-green-500 mb-6" />
                                <h3 className="text-xl font-bold mb-2">Visibilité Maximale</h3>
                                <p className="text-gray-400 text-sm">Votre restaurant a enfin sa propre page web moderne, référencée sur Google. Le monde entier peut voir votre carte.</p>
                            </div>
                        </BentoCard>
                        <BentoCard className="md:col-span-2 bg-zinc-900/30">
                            <div className="p-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Encaissez sans friction</h3>
                                    <p className="text-gray-400">Tout le monde doit pouvoir payer. Wave, Orange Money, MTN, Espèces ou Carte. On ne refuse aucun client.</p>
                                </div>
                                <div className="flex -space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs ring-4 ring-black">Wave</div>
                                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs ring-4 ring-black">OM</div>
                                    <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-xs text-black ring-4 ring-black">MTN</div>
                                </div>
                            </div>
                        </BentoCard>
                    </div>
                </section>

                {/* 2. Cuisine & Operations */}
                <section>
                    <div className="flex items-end justify-between mb-8 md:mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4 flex items-center gap-4">
                                <span className="p-3 rounded-2xl bg-red-500/10 text-red-500"><ChefHat className="w-8 h-8" /></span>
                                La Paix en Cuisine
                            </h2>
                            <p className="text-gray-400 text-lg">Fini les erreurs de bons. Fini les cris. Fini le chaos.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <BentoCard className="md:col-span-2  bg-gradient-to-br from-gray-900 to-black border-red-500/20 min-h-[400px]">
                            <div className="p-10 text-center">
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">L'Écran du Chef</h3>
                                <p className="text-gray-400 max-w-lg mx-auto mb-10">Imaginez une cuisine silencieuse où chaque commande arrive clairement, classée par ordre d'arrivée. Le Chef sait quoi faire, quand le faire. <br />C'est ça, la magie GoTchop.</p>

                                <div className="flex gap-4 justify-center">
                                    <div className="w-64 bg-black border border-green-500/30 rounded-xl p-4 text-left">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                            <span className="font-bold text-green-500">Table 12</span>
                                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">04:20</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm">2x Burger Classic</div>
                                            <div className="text-sm text-gray-500 italic">- Sans oignons</div>
                                            <div className="text-sm">1x Frites XL</div>
                                        </div>
                                    </div>
                                    <div className="w-64 bg-black border border-yellow-500/30 rounded-xl p-4 text-left opacity-60 scale-95">
                                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                            <span className="font-bold text-yellow-500">Table 5</span>
                                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">01:15</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm">1x Dorade Braisée</div>
                                            <div className="text-sm">1x Alloco</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>
                        <BentoCard className="p-8 bg-zinc-900/30">
                            <Users className="w-8 h-8 text-purple-500 mb-6" />
                            <h3 className="text-xl font-bold mb-2">Chacun son Rôle</h3>
                            <p className="text-gray-400">Le serveur prend les commandes. Le gérant voit les chiffres. Le comptable exporte les données. Tout est cloisonné, sécurisé, pro.</p>
                        </BentoCard>
                        <BentoCard className="p-8 bg-zinc-900/30">
                            <Clock className="w-8 h-8 text-pink-500 mb-6" />
                            <h3 className="text-xl font-bold mb-2">Traçabilité Totale</h3>
                            <p className="text-gray-400">Plus de "je ne sais pas qui a annulé". Chaque action est enregistrée. Vous avez le contrôle total sur ce qui se passe chez vous.</p>
                        </BentoCard>
                    </div>
                </section>

                {/* CTA Final */}
                <div className="text-center py-12 md:py-20">
                    <h2 className="text-3xl md:text-4xl font-black mb-6">Convaincu ?</h2>
                    <p className="text-gray-400 mb-8">Rejoignez l'élite des restaurateurs.</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="bg-white text-black px-10 py-4 rounded-full text-lg font-bold hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-2xl shadow-orange-500/20"
                    >
                        Créer mon compte resto <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="mt-4 text-xs text-gray-600">Essai gratuit 14 jours. Sans engagement.</p>
                </div>

            </div>
        </div>
    );
};

// Helper Component for consistency
const BentoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        className={`rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm ${className}`}
    >
        {children}
    </motion.div>
);

export default FeaturesPage;
