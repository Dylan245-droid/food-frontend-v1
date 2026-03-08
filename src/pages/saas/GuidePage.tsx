import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, ChefHat, QrCode, Smartphone, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';

const GuidePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-stone-950 text-stone-300 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden flex flex-col">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <img src="/logo_dark.png" alt="GoTchop" className="h-10 md:h-12 hover:opacity-90 transition-opacity" />
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'accueil
                </button>
            </nav>

            <div className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-24">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm mb-8"
                        >
                            <BadgeCheck className="w-4 h-4" />
                            <span>Simple, Rapide, Efficace</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight font-display"
                        >
                            Lancez votre restaurant <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">en 15 minutes.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-stone-400 max-w-2xl mx-auto"
                        >
                            Pas besoin de compétences techniques. Suivez le guide et commencez à encaisser vos premières commandes dès ce soir.
                        </motion.p>
                    </div>

                    {/* Timeline / Steps */}
                    <div className="space-y-24 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500 via-stone-800 to-stone-900 -translate-x-1/2 md:-translate-x-px hidden md:block" />

                        {/* Step 1 */}
                        <Step 
                            number="1"
                            title="Création du Compte"
                            desc="Inscrivez votre établissement gratuitement. Aucune carte bancaire requise pour l'essai."
                            icon={<BadgeCheck />}
                            align="right"
                            action={() => navigate('/register')}
                            actionLabel="Je crée mon compte"
                        />

                        {/* Step 2 */}
                        <Step 
                            number="2"
                            title="Configuration du Menu"
                            desc="Ajoutez vos catégories (Entrées, Plats...) et vos articles avec photos. C'est votre vitrine."
                            icon={<ChefHat />}
                            align="left"
                            delay={0.2}
                        />

                        {/* Step 3 */}
                        <Step 
                            number="3"
                            title="Génération des QR Codes"
                            desc="Téléchargez vos QR codes uniques pour chaque table depuis votre dashboard. Imprimez, collez."
                            icon={<QrCode />}
                            align="right"
                            delay={0.3}
                        />

                        {/* Step 4 */}
                        <Step 
                            number="4"
                            title="Réception des Commandes"
                            desc="Vos clients scannent et commandent. Vous recevez tout en temps réel sur tablette ou mobile."
                            icon={<Smartphone />}
                            align="left"
                            delay={0.4}
                        />

                        {/* Step 5 */}
                        <Step 
                            number="5"
                            title="Encaissement"
                            desc="Gérez vos encaissements en toute simplicité : Espèces ou Paiement à la livraison. Vos clients paient directement."
                            icon={<DollarSign />}
                            align="right"
                            delay={0.5}
                        />
                    </div>

                    {/* CTA Footer */}
                    <div className="mt-32 text-center p-12 rounded-[2.5rem] bg-stone-900/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <h2 className="text-3xl font-black text-white mb-6 relative z-10">Prêt à passer au niveau supérieur ?</h2>
                        <button 
                            onClick={() => navigate('/register')}
                            className="relative z-10 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-2xl shadow-orange-900/20 flex items-center gap-3 mx-auto"
                        >
                            Commencer maintenant <ArrowRight className="w-5 h-5 text-orange-600" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

const Step = ({ number, title, desc, icon, align, action, actionLabel, delay = 0 }: any) => {
    const isRight = align === 'right';
    return (
        <motion.div 
            initial={{ opacity: 0, x: isRight ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay }}
            className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isRight ? '' : 'md:flex-row-reverse'}`}
        >
            <div className={`flex-1 text-center ${isRight ? 'md:text-right' : 'md:text-left'}`}>
                <div className={`inline-flex items-center gap-3 mb-4 ${isRight ? 'md:flex-row-reverse' : ''}`}>
                    <span className="text-6xl font-black text-white/5 font-display select-none">0{number}</span>
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                </div>
                <p className="text-stone-400 text-lg leading-relaxed mb-6">
                    {desc}
                </p>
                {action && (
                    <button 
                        onClick={action}
                        className="inline-flex items-center gap-2 text-orange-400 font-bold hover:text-white transition-colors group"
                    >
                        {actionLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>

            <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                    <div className="text-orange-500">
                        {React.cloneElement(icon, { className: "w-8 h-8" })}
                    </div>
                </div>
                {/* Glow */}
                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20" />
            </div>

            <div className="flex-1 hidden md:block" />
        </motion.div>
    );
}

export default GuidePage;
