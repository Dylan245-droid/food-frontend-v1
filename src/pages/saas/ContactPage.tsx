import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const ContactPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/contact', formData);
            toast.success('Message envoyé avec succès ! Nous vous répondrons très vite.');
            setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
        } catch (error: any) {
            console.error('Contact error:', error);
            toast.error(error.response?.data?.message || "Erreur lors de l'envoi du message.");
        } finally {
            setLoading(false);
        }
    };

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

            <div className="flex-1 flex items-center relative z-10 pt-20 md:pt-24 pb-12 md:pb-20">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-[50vw] h-full bg-orange-600/5 blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 md:gap-20 items-start">

                    {/* Left: Info & Vibe */}
                    <div className="pt-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium text-sm mb-8"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Contactez notre équipe</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight font-display"
                        >
                            Parlons <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Business.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-stone-400 mb-12 max-w-lg leading-relaxed"
                        >
                            Une question sur nos offres ? Besoin d'une démo personnalisée ?
                            L'équipe <strong>NOUN CONCEPT</strong>, basée à Libreville, est là pour digitaliser votre restaurant.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-8"
                        >
                            <ContactItem icon={<Mail />} title="Email Direct" content="danielebang59@gmail.com" link="mailto:danielebang59@gmail.com" />
                            <ContactItem icon={<Phone />} title="Support & Ventes" content="+241 74 17 07 48" link="tel:+24174170748" />
                            <ContactItem icon={<MapPin />} title="Siège Social" content="Alibandeng, Libreville, Gabon" />
                        </motion.div>
                    </div>

                    {/* Right: Premium Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-stone-900/50 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative group hover:border-orange-500/20 transition-colors"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-20" />

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Nom</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all"
                                        placeholder="Votre nom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Prénom</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all"
                                        placeholder="Votre prénom"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Email Professionnel</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all"
                                    placeholder="jean@restaurant.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Téléphone (Optionnel)</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all"
                                    placeholder="+241 ..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Message</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all resize-none"
                                    placeholder="Dites-nous tout sur votre projet..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-5 rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>Envoyer le message <Send className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

const ContactItem = ({ icon, title, content, link }: any) => (
    <div className="flex items-start gap-4 group">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-orange-500 group-hover:text-black transition-all duration-300">
            {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div>
            <h3 className="text-sm font-bold text-stone-500 mb-1">{title}</h3>
            {link ? (
                <a href={link} className="text-lg font-bold text-white hover:text-orange-500 transition-colors flex items-center gap-2">
                    {content} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </a>
            ) : (
                <p className="text-lg font-bold text-white">{content}</p>
            )}
        </div>
    </div>
);

export default ContactPage;
