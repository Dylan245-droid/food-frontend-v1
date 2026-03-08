import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../lib/api';

// Type pour le branding
export interface BrandingConfig {
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  thankYouMessage: string;
  receiptFooter: string;
  // Infos légales pour tickets/factures
  address: string;
  phone: string;
  nif: string;
  // Homepage / Public
  openingHours: string;
  heroImage: string;
  // Business Info
  businessType?: string;
  // Delivery Fees
  fee_libreville?: string;
  fee_owendo?: string;
  fee_akanda?: string;
  fee_ntoum?: string;
  delivery_commission?: string;
  // Restaurant Location
  restaurant_lat?: string;
  restaurant_lng?: string;
  // Loyalty (Points per 1000 FCFA)
  loyalty_rate_dine_in?: string;
  loyalty_rate_takeout?: string;
  loyalty_rate_delivery?: string;
  // Visual Identity
  font?: string;
  borderRadius?: string;
  heroStyle?: 'classic' | 'split' | 'minimal' | 'immersive';
}

// Valeurs par défaut
const defaultBranding: BrandingConfig = {
  name: "Mon Restaurant",
  tagline: "Saveurs authentiques",
  logo: "",
  primaryColor: "#f97316",
  secondaryColor: "#3b82f6",
  footerText: "",
  thankYouMessage: "Merci de votre visite ! À très bientôt.",
  receiptFooter: "À bientôt !",
  address: "",
  phone: "",
  nif: "",
  openingHours: "OUVERT - 8h00 - 22h00",
  heroImage: "",
  businessType: "Restaurant",
  fee_libreville: "1000",
  fee_owendo: "1000",
  fee_akanda: "1000",
  fee_ntoum: "1000",
  delivery_commission: "0",
  loyalty_rate_dine_in: "10",
  loyalty_rate_takeout: "5",
  loyalty_rate_delivery: "2",
  font: "Stack Sans Notch",
  borderRadius: "1rem",
  heroStyle: "classic",
};

interface BrandingContextType {
  branding: BrandingConfig;
  loading: boolean;
  refetch: () => void;
  updateBranding: (data: Partial<BrandingConfig>) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  refetch: () => { },
  updateBranding: async () => { },
});

// Utility to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 25, s: 95, l: 53 }; // Default orange

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Generate color scale from a base color
function generateColorScale(prefix: string, hex: string) {
  const hsl = hexToHSL(hex);
  const root = document.documentElement;

  // Base HSL values
  root.style.setProperty(`--${prefix}-h`, hsl.h.toString());
  root.style.setProperty(`--${prefix}-s`, `${hsl.s}%`);
  root.style.setProperty(`--${prefix}-l`, `${hsl.l}%`);

  // Color scale (50-900)
  const lightnesses: Record<string, number> = {
    '50': 97, '100': 94, '200': 86, '300': 74, '400': 62,
    '500': hsl.l, '600': Math.max(hsl.l - 10, 25), '700': Math.max(hsl.l - 20, 20),
    '800': Math.max(hsl.l - 30, 15), '900': Math.max(hsl.l - 40, 10)
  };

  root.style.setProperty(`--${prefix}`, hex);

  for (const [key, lightness] of Object.entries(lightnesses)) {
    root.style.setProperty(`--${prefix}-${key}`, `hsl(${hsl.h}, ${hsl.s}%, ${lightness}%)`);
  }

  // Gradient
  root.style.setProperty(`--${prefix}-gradient`, `linear-gradient(135deg, ${hex}, hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 15, 20)}%))`);
}

// Apply all theme colors as CSS variables
function applyThemeColors(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement;

  // Generate color scales
  generateColorScale('primary', primaryColor);
  generateColorScale('secondary', secondaryColor);

  // Mixed brand gradient (primary to secondary)
  const primaryHsl = hexToHSL(primaryColor);
  root.style.setProperty('--gradient-brand', `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`);
  root.style.setProperty('--gradient-brand-reverse', `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`);

  // Surface colors based on primary
  root.style.setProperty('--bg-app', `hsl(${primaryHsl.h}, 30%, 98%)`);
  root.style.setProperty('--bg-card', '#ffffff');
  root.style.setProperty('--bg-elevated', '#ffffff');

  // Text colors
  root.style.setProperty('--text-primary', 'hsl(0, 0%, 10%)');
  root.style.setProperty('--text-secondary', 'hsl(0, 0%, 40%)');
  root.style.setProperty('--text-muted', 'hsl(0, 0%, 60%)');

  // Border colors  
  root.style.setProperty('--border-light', `hsl(${primaryHsl.h}, 20%, 92%)`);
  root.style.setProperty('--border-default', `hsl(${primaryHsl.h}, 15%, 88%)`);

  // Shadow with primary tint
  root.style.setProperty('--shadow-sm', `0 1px 2px hsl(${primaryHsl.h}, 20%, 80%, 0.1)`);
  root.style.setProperty('--shadow-md', `0 4px 12px hsl(${primaryHsl.h}, 20%, 60%, 0.1)`);
  root.style.setProperty('--shadow-lg', `0 8px 24px hsl(${primaryHsl.h}, 30%, 50%, 0.15)`);
}

// Map friendly font names to CSS font-family
const FONT_MAP: Record<string, string> = {
  'Inter': '"Inter", sans-serif',
  'Lato': '"Lato", sans-serif',
  'Montserrat': '"Montserrat", sans-serif',
  'Playfair Display': '"Playfair Display", serif',
  'Oswald': '"Oswald", sans-serif',
  'Raleway': '"Raleway", sans-serif',
  'Open Sans': '"Open Sans", sans-serif',
  'Stack Sans Notch': '"Stack Sans Notch", ui-sans-serif, system-ui, sans-serif'
};

function applyVisualIdentity(font: string, borderRadius: string) {
  const root = document.documentElement;

  // Apply Border Radius
  root.style.setProperty('--radius', borderRadius);

  // Apply Font
  const fontFamily = FONT_MAP[font] || FONT_MAP['Stack Sans Notch'];
  root.style.setProperty('--font-sans', fontFamily); // This might need index.css update to work fully
  document.body.style.fontFamily = fontFamily;

  // Load Google Font dynamically
  if (font && font !== 'Stack Sans Notch') {
    const linkId = 'dynamic-font-link';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const fontName = font.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800;900&display=swap`;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    // 1. Initialize from LocalStorage for instant load
    const cached = localStorage.getItem('gotchop_branding');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Apply colors immediately to avoid flash
        // We need to do this in a side effect usually, but for instant paint we can try here 
        // or effectively rely on useEffect below which runs fast. 
        // Actually, better to do it in useEffect to avoid side-effects during render, 
        // BUT we want it fast. Let's do it in a layout effect or just trust the first render cycle.
        return { ...defaultBranding, ...parsed };
      } catch (e) {
        console.error("Cache error", e);
      }
    }
    return defaultBranding;
  });

  const [loading, setLoading] = useState(true);

  // Apply cached colors on mount
  useEffect(() => {
    const cached = localStorage.getItem('gotchop_branding');
    if (cached) {
      const parsed = JSON.parse(cached);
      applyThemeColors(parsed.primaryColor || defaultBranding.primaryColor, parsed.secondaryColor || defaultBranding.secondaryColor);
      applyVisualIdentity(parsed.font || defaultBranding.font || 'Stack Sans Notch', parsed.borderRadius || defaultBranding.borderRadius || '1rem');
    }

  }, []);

  const fetchBranding = async () => {
    try {
      // Multi-Tenant: Detect slug from URL
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([^\/]+)/);
      const tenantSlug = match ? match[1] : null;

      let endpoint = '/settings/branding';

      // If we are in a tenant route, use the tenant-specific endpoint
      if (tenantSlug) {
        endpoint = `/r/${tenantSlug}/settings/branding`;
      }

      const res = await api.get(endpoint);
      const data = res.data;

      // Auto-generate footerText with current year and restaurant name
      const currentYear = new Date().getFullYear();
      const name = data.name || defaultBranding.name;
      const generatedFooterText = `© ${currentYear} ${name}. Tous droits réservés.`;

      const newBranding = {
        ...defaultBranding,
        ...data,
        footerText: generatedFooterText
      };

      setBranding(newBranding);
      // Cache it
      localStorage.setItem('gotchop_branding', JSON.stringify(newBranding));

      // Apply theme colors
      applyThemeColors(newBranding.primaryColor, newBranding.secondaryColor);
      applyVisualIdentity(newBranding.font || 'Stack Sans Notch', newBranding.borderRadius || '1rem');

    } catch (error) {
      console.error('Erreur lors du chargement du branding:', error);
      // We do NOT reset to default on error if we have cache, ensuring resilience.
      // But if it's a permanent error (like 401), maybe we should?
      // For now, let's keep the stale-while-revalidate approach which is friendlier.

      if (!branding.logo && !localStorage.getItem('gotchop_branding')) {
        applyThemeColors(defaultBranding.primaryColor, defaultBranding.secondaryColor);
        applyVisualIdentity(defaultBranding.font || 'Stack Sans Notch', defaultBranding.borderRadius || '1rem');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (data: Partial<BrandingConfig>) => {
    try {
      const res = await api.put('/admin/settings/branding', data);
      const updatedData = res.data.data;

      // Auto-generate footerText with current year and restaurant name
      const currentYear = new Date().getFullYear();
      const name = updatedData.name || data.name || branding.name;
      const generatedFooterText = `© ${currentYear} ${name}. Tous droits réservés.`;

      const newBranding = {
        ...branding,
        ...updatedData,
        footerText: generatedFooterText
      };

      setBranding(newBranding);
      localStorage.setItem('gotchop_branding', JSON.stringify(newBranding));

      // Apply theme colors immediately
      applyThemeColors(newBranding.primaryColor, newBranding.secondaryColor);
      applyVisualIdentity(newBranding.font || 'Stack Sans Notch', newBranding.borderRadius || '1rem');

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    fetchBranding();
  }, [user?.id]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch: fetchBranding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// Export for backwards compatibility with static config
export { defaultBranding as BRANDING };
