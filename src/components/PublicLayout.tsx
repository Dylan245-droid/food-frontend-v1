import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, ChefHat, LayoutDashboard } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { branding } = useBranding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Mobile-First */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden min-w-0">
            <Link to="/" className="text-[10px] md:text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider hidden sm:block">
              GoTchop
            </Link>
            <div className="h-4 w-px bg-stone-200 hidden sm:block"></div>
            <Link to={`/r/${slug}`} className="flex items-center gap-2 md:gap-3 font-bold text-xl min-w-0">
              {branding.logo ? (
                <img
                  src={branding.logo}
                  alt={branding.name}
                  className="h-8 md:h-10 w-auto object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center text-white ${branding.logo ? 'hidden' : ''}`}
                style={{ background: 'var(--primary-gradient)' }}
              >
                <ChefHat className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-stone-900 truncate max-w-[120px] xs:max-w-none text-base md:text-xl" style={{ color: 'var(--primary-700)' }}>{branding.name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/r/${slug}/book`}
              className="font-bold flex items-center justify-center transition-colors p-2 md:px-3 md:py-1.5 rounded-full md:rounded-lg"
              style={{ color: 'white', background: 'var(--primary-gradient)' }}
              title="Réserver"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden md:inline ml-1 text-xs">Réserver</span>
            </Link>
            <Link
              to={`/r/${slug}/track`}
              className="font-medium flex items-center justify-center p-2 rounded-full bg-stone-100 transition-colors"
              style={{ color: 'var(--primary-600)' }}
              title="Suivi"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline ml-1 text-xs">Suivi</span>
            </Link>
            <button
              onClick={() => user ? navigate('/admin/dashboard') : navigate('/login')}
              className="text-gray-400 hover:text-gray-800 transition-colors"
              title={user ? "Mon Dashboard" : "Accès Staff"}
            >
              <div className={`p-2 rounded-full ${user ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                {user ? <LayoutDashboard className="w-4 h-4" /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
