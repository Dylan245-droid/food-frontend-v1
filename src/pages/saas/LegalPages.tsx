import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Building2, Scale, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const PLATFORM_CONFIG = {
    companyName: 'NOUN CONCEPT',
    address: 'Alibandeng, Libreville, Gabon',
    email: 'danielebang59@gmail.com',
    phone: '+24174170748',
    website: 'https://food.jool-sup.com',
    rc: 'RCCM : GA-LBV-01-2024-B12-01173',
    nif: 'NIF : 2024 0102 1335 U',
    capital: '1.000.000 FCFA',
    host: 'Vercel Inc. - 340 S Lemon Ave #4133 Walnut, CA 91789, USA'
};

const LegalLayout = ({ title, subtitle, icon: Icon, children }: { title: string, subtitle?: string, icon: any, children: React.ReactNode }) => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-stone-950 text-stone-300 font-sans selection:bg-orange-500 selection:text-white">
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

            <div className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-16 text-center"
                    >
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-500/10 mb-6 border border-orange-500/20">
                            <Icon className="w-8 h-8 text-orange-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 font-display tracking-tight leading-tight">{title}</h1>
                        {subtitle && <p className="text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-stone-900/50 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm"
                    >
                        <div className="prose prose-invert prose-lg prose-orange max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-stone-300 prose-li:text-stone-300">
                            {children}
                        </div>
                    </motion.div>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center text-stone-500 text-sm">
                        <p>© {new Date().getFullYear()} {PLATFORM_CONFIG.companyName}. Tous droits réservés.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LegalMentionsPage = () => (
    <LegalLayout 
        title="Mentions Légales" 
        subtitle="Informations légales et administratives relatives à l'exploitation de la plateforme GoTchop."
        icon={Building2}
    >
        <h3>1. Éditeur du Site</h3>
        <p>
            Le site et l'application <strong>GoTchop</strong> sont édités et exploités par la société <strong>{PLATFORM_CONFIG.companyName}</strong>.
        </p>
        <ul className="list-none pl-0 space-y-2">
            <li className="flex items-center gap-3">
                <span className="w-24 font-bold text-stone-400">Forme juridique :</span>
                <span>Société à Responsabilité Limitée (SARL)</span>
            </li>
            <li className="flex items-center gap-3">
                <span className="w-24 font-bold text-stone-400">Capital social :</span>
                <span>{PLATFORM_CONFIG.capital}</span>
            </li>
            <li className="flex items-center gap-3">
                <span className="w-24 font-bold text-stone-400">Siège social :</span>
                <span>{PLATFORM_CONFIG.address}</span>
            </li>
            <li className="flex items-center gap-3">
                <span className="w-24 font-bold text-stone-400">Immatriculation :</span>
                <span>{PLATFORM_CONFIG.rc}</span>
            </li>
            <li className="flex items-center gap-3">
                <span className="w-24 font-bold text-stone-400">Fiscalité :</span>
                <span>{PLATFORM_CONFIG.nif}</span>
            </li>
        </ul>

        <h3>2. Contact</h3>
        <p>Pour toute question ou réclamation, vous pouvez nous contacter :</p>
        <ul className="list-none pl-0 space-y-2">
            <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange-500" />
                <a href={`mailto:${PLATFORM_CONFIG.email}`} className="text-white hover:text-orange-500 transition-colors">{PLATFORM_CONFIG.email}</a>
            </li>
            <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span>{PLATFORM_CONFIG.address}</span>
            </li>
        </ul>

        <h3>3. Hébergement</h3>
        <p>
            Le Site est hébergé par :<br/>
            <strong>{PLATFORM_CONFIG.host}</strong><br/>
            Infrastructure Cloud sécurisée et redondante.
        </p>

        <h3>4. Propriété Intellectuelle</h3>
        <p>
            L'ensemble des éléments graphiques, images, textes, séquences animées sonores ou non, logos, marques, noms de produits, constituant et/ou représentés sur le site sont protégés par les lois concernant la Propriété Intellectuelle et sont, selon les cas, propriété de {PLATFORM_CONFIG.companyName} ou propriété de tiers ayant autorisé {PLATFORM_CONFIG.companyName} à les représenter.
        </p>
    </LegalLayout>
);

export const TermsPage = () => (
    <LegalLayout 
        title="Conditions Générales d'Utilisation" 
        subtitle="Règles d'accès et d'utilisation des services GoTchop pour les Restaurateurs et les Clients."
        icon={Scale}
    >
        <p className="text-sm text-stone-500 italic mb-8">Dernière mise à jour : 24 Janvier 2026</p>
        
        <h3>1. Objet et Acceptation</h3>
        <p>
            Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités de mise à disposition des services du site et de l'application GoTchop (ci-après "le Service") aux utilisateurs.
            L'utilisation du Service implique l'acceptation sans réserve des présentes CGU. En accédant au Service, l'utilisateur déclare avoir lu, compris et accepté les présentes conditions.
        </p>
        
        <h3>2. Description du Service</h3>
        <p>
            GoTchop est une solution SaaS permettant aux restaurateurs de digitaliser leur activité (Menu QR Code, Commandes, Livraison, Paiements) et aux clients finaux de passer commande.
            {PLATFORM_CONFIG.companyName} agit en tant que prestataire technique mettant en relation Restaurateurs et Clients.
        </p>
        
        <h3>3. Responsabilités</h3>
        <p><strong>Pour les Restaurateurs :</strong> Vous êtes responsable des informations publiées (prix, allergènes) et de la bonne exécution des commandes.</p>
        <p><strong>Pour les Clients :</strong> Vous vous engagez à honorer les commandes passées et à respecter le personnel du restaurant et les livreurs.</p>
        <p>
            {PLATFORM_CONFIG.companyName} ne saurait être tenu responsable en cas d'indisponibilité du Service pour des raisons de maintenance ou de force majeure.
        </p>
        
        <h3>4. Paiements et Abonnement</h3>
        <p>
            Les services Premium pour restaurants sont soumis à abonnement. Les paiements sont sécurisés via Fiafio.
            Toute période entamée est due. Les conditions de remboursement sont détaillées dans les Conditions Générales de Vente (CGV).
        </p>

        <h3>5. Modification des CGU</h3>
        <p>
            {PLATFORM_CONFIG.companyName} se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés des changements majeurs.
        </p>
    </LegalLayout>
);

export const PrivacyPage = () => (
    <LegalLayout 
        title="Politique de Confidentialité" 
        subtitle="Engagement de GoTchop concernant la protection de vos données personnelles."
        icon={ShieldCheck}
    >
        <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl mb-8 not-prose">
            <p className="text-orange-200 font-medium m-0 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                Chez {PLATFORM_CONFIG.companyName}, la confidentialité n'est pas une option. Nous nous conformons strictement à la législation en vigueur sur la protection des données au Gabon.
            </p>
        </div>

        <h3>1. Responsable du Traitement</h3>
        <p>
            Le responsable du traitement des données est la société {PLATFORM_CONFIG.companyName}, sise à {PLATFORM_CONFIG.address}.
            Email DPO : {PLATFORM_CONFIG.email}
        </p>
        
        <h3>2. Données Collectées</h3>
        <p>Nous collectons les données strictement nécessaires au fonctionnement du service :</p>
        <ul>
            <li><strong>Restaurant :</strong> Nom, Email, Téléphone, Adresse, Menu, Données de vente.</li>
            <li><strong>Client Final :</strong> Nom, Téléphone, Adresse de livraison (si applicable).</li>
            <li><strong>Paiement (Abonnements Premium) :</strong> Les transactions pour les services payants sont traitées par notre partenaire Fiafio. Nous ne stockons aucune donnée bancaire.</li>
        </ul>
        
        <h3>3. Finalité du Traitement</h3>
        <p>Vos données sont utilisées pour :</p>
        <ul>
            <li>Gérer votre compte et vos commandes.</li>
            <li>Améliorer nos services et personnaliser votre expérience.</li>
            <li>Communiquer avec vous (notifications de commande, factures).</li>
            <li>Assurer la sécurité de la plateforme et prévenir la fraude.</li>
        </ul>
        
        <h3>4. Partage des Données</h3>
        <p>
            Vos données ne sont jamais vendues à des tiers. Elles peuvent être transmises à nos sous-traitants (Hébergement, Livraison) uniquement pour les besoins de l'exécution du service.
        </p>
        
        <h3>5. Sécurité</h3>
        <p>
            Nous mettons en œuvre des mesures de sécurité avancées (Chiffrement SSL, pare-feu, contrôle d'accès strict) pour protéger vos données contre tout accès non autorisé.
        </p>

        <h3>6. Vos Droits</h3>
        <p>
            Conformément à la loi, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer, contactez-nous à : {PLATFORM_CONFIG.email}.
        </p>
    </LegalLayout>
);
