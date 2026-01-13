import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
  // Delivery Fees
  fee_libreville?: string;
  fee_owendo?: string;
  fee_akanda?: string;
  fee_ntoum?: string;
  delivery_commission?: string;
  // Restaurant Location
  restaurant_lat?: string;
  restaurant_lng?: string;
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
  fee_libreville: "1000",
  fee_owendo: "1000",
  fee_akanda: "1000",
  fee_ntoum: "1000",
  delivery_commission: "0",
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
  refetch: () => {},
  updateBranding: async () => {},
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

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await api.get('/settings/branding');
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
      
      // Apply theme colors
      applyThemeColors(newBranding.primaryColor, newBranding.secondaryColor);
    } catch (error) {
      console.error('Erreur lors du chargement du branding:', error);
      // Apply default colors on error
      applyThemeColors(defaultBranding.primaryColor, defaultBranding.secondaryColor);
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
      
      // Apply theme colors immediately
      applyThemeColors(newBranding.primaryColor, newBranding.secondaryColor);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

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
