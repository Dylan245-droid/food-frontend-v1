/**
 * Configuration du branding de l'application
 * Modifiez ce fichier pour personnaliser l'apparence pour chaque enseigne
 */

export const BRANDING = {
    // Nom du restaurant (affiché dans le header, les tickets, etc.)
    name: "Mon Restaurant",

    // Slogan ou tagline (optionnel)
    tagline: "Saveurs authentiques",

    // Chemin vers le logo (dans le dossier public/)
    logo: "/logo.jpg",

    // Couleur principale (utilisée pour les accents)
    primaryColor: "#f97316", // orange par défaut

    // Texte du footer
    footerText: "© 2026 Mon Restaurant. Tous droits réservés.",

    // Message de remerciement après commande
    thankYouMessage: "Merci de votre visite ! À très bientôt.",

    // Message sur les tickets de caisse
    receiptFooter: "À bientôt !",
}

// Type pour l'autocomplétion
export type BrandingConfig = typeof BRANDING
