/**
 * Utilitaires de géolocalisation pour le frontend
 */

/**
 * Calcule la distance entre deux points GPS (formule Haversine)
 * @returns Distance en kilomètres
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Formate la distance pour l'affichage
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

/**
 * Retourne l'icône de confiance selon le niveau
 */
export function getConfidenceIcon(confidence: string | null): string {
    switch (confidence) {
        case 'high':
            return '🟢';
        case 'medium':
            return '🟡';
        case 'low':
            return '🔴';
        case 'failed':
            return '⚫';
        default:
            return '⚪';
    }
}

/**
 * Retourne le label de confiance selon le niveau
 */
export function getConfidenceLabel(confidence: string | null): string {
    switch (confidence) {
        case 'high':
            return 'Précis';
        case 'medium':
            return 'Approximatif';
        case 'low':
            return 'Zone générale';
        case 'failed':
            return 'Non localisé';
        default:
            return 'Inconnu';
    }
}

/**
 * Retourne la marge d'erreur estimée
 */
export function getErrorMargin(confidence: string | null): string {
    switch (confidence) {
        case 'high':
            return '± 100m';
        case 'medium':
            return '± 500m';
        case 'low':
            return '± 2km';
        default:
            return '';
    }
}
