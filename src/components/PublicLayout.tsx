import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, ChefHat } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

export default function PublicLayout() {
  const { branding } = useBranding();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile-First */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 font-bold text-xl">
            {branding.logo ? (
              <img 
                src={branding.logo} 
                alt={branding.name} 
                className="h-10 w-auto object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div 
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-white ${branding.logo ? 'hidden' : ''}`}
              style={{ background: 'var(--primary-gradient)' }}
            >
              <ChefHat className="w-6 h-6" />
            </div>
            <span className="text-stone-900" style={{ color: 'var(--primary-700)' }}>{branding.name}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/track" 
              className="text-sm font-medium flex items-center gap-1 transition-colors"
              style={{ color: 'var(--primary-600)' }}
            >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Suivi</span>
            </Link>
            <Link to="/login" className="text-gray-400 hover:text-gray-800 transition-colors" title="Accès Staff">
                 <div className="bg-gray-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                 </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
