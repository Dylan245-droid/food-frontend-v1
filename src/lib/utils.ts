import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f/g, ' ') + ' FCFA';
}

export function getImageUrl(path?: string) {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
    return `${baseUrl}${path}`;
}
