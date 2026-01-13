import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ServerCallsNotification } from './ServerCallsNotification';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { LayoutDashboard, ShoppingBag, Users, FileText, LogOut, Coffee, Bell, TrendingUp, Menu, X, ChefHat, Settings, Banknote, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
      setIsSidebarOpen(false);
      
      // Scroll active link into view
      if (activeLinkRef.current) {
          activeLinkRef.current.scrollIntoView({
              block: 'center',
              behavior: 'smooth'
          });
      }
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Cuisine & Commandes', path: '/admin/orders', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Dispatch Livraison', path: '/admin/dispatch', roles: ['super_admin', 'admin', 'caissier'] },
    { icon: Coffee, label: 'Carte & Menu', path: '/admin/menu', roles: ['super_admin', 'admin', 'salle'] },
    { icon: LayoutDashboard, label: 'Salles & Tables', path: '/admin/tables', roles: ['super_admin', 'admin', 'salle'] },
    { icon: FileText, label: 'Réservations', path: '/admin/reservations', roles: ['super_admin', 'admin', 'salle'] },
    { icon: Users, label: 'Équipe', path: '/admin/users', roles: ['super_admin', 'admin'] },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
      menuItems.push({ icon: TrendingUp, label: 'Finances', path: '/admin/finance', roles: ['super_admin', 'admin'] });
      menuItems.push({ icon: Banknote, label: 'Caisse', path: '/admin/cash', roles: ['super_admin', 'admin'] });
      menuItems.push({ icon: ArrowRightLeft, label: 'Transferts', path: '/admin/cash/transfers', roles: ['super_admin', 'admin'] });
      menuItems.push({ icon: FileText, label: 'Factures', path: '/admin/invoices', roles: ['super_admin', 'admin'] });
      menuItems.push({ icon: FileText, label: 'Comptabilité', path: '/admin/accounting', roles: ['super_admin', 'admin'] });
      menuItems.push({ icon: Settings, label: 'Paramètres', path: '/admin/settings', roles: ['super_admin', 'admin'] });
  }

  if (user?.role === 'super_admin') {
      menuItems.push({ icon: FileText, label: 'Journaux', path: '/admin/audit-logs', roles: ['super_admin'] });
  }

  // Server specific links
  if (user?.role === 'serveur') {
      menuItems.push(
          { icon: Coffee, label: 'Mes Tables', path: '/admin/tables?filter=mine', roles: ['serveur'] },
          { icon: Bell, label: 'Mes Appels', path: '/admin/calls', roles: ['serveur'] }
      );
  }

  const allowedMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen text-stone-800 flex flex-col md:flex-row" style={{ background: 'var(--bg-app)' }}>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center sticky top-0 z-30" style={{ borderColor: 'var(--primary-100)' }}>
        <h1 className="text-lg font-black text-stone-900 flex items-center gap-2 font-display">
             {branding.logo ? (
               <img src={branding.logo} alt={branding.name} className="w-8 h-8 rounded-full object-contain" />
             ) : (
               <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                 <ChefHat className="w-5 h-5" />
               </div>
             )}
             {branding.name}
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--primary-600)' }}
        >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-20 md:hidden animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      <aside 
        className={cn(
            "bg-white flex flex-col fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 w-72",
            "md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ 
          borderRight: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3 font-display tracking-tight">
             {branding.logo ? (
               <img 
                 src={branding.logo} 
                 alt={branding.name}
                 className="w-12 h-12 rounded-2xl object-contain shadow-lg"
                 onError={(e) => {
                   // Fallback to icon if image fails
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
             ) : null}
             <div 
               className={cn(
                 "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3",
                 branding.logo ? "hidden" : ""
               )}
               style={{ background: 'var(--primary-gradient)' }}
             >
                <ChefHat className="w-6 h-6" />
             </div>
             {branding.name.split(' ')[0]} <br/>{branding.name.split(' ').slice(1).join(' ') || ''}
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname !== '/admin' && location.pathname + location.search === item.path);
            return (
                <Link
                key={item.path}
                ref={isActive ? activeLinkRef : null}
                to={item.path}
                className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative",
                    isActive
                    ? "shadow-sm" 
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                )}
                style={isActive ? { 
                  backgroundColor: `${branding.primaryColor}15`,
                  color: branding.primaryColor
                } : undefined}
                >
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                )}
                <item.icon 
                  className={cn("w-5 h-5 transition-colors", !isActive && "text-stone-400 group-hover:text-stone-600")} 
                  style={isActive ? { color: branding.primaryColor } : undefined}
                />
                {item.label}
                </Link>
            );
          })}
        </nav>

        <div 
          className="p-4 mt-auto m-4 rounded-2xl"
          style={{ 
            background: 'var(--primary-50)',
            borderColor: 'var(--border-light)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${user?.role === 'super_admin' ? 'bg-purple-600' : 'bg-stone-900'}`}>
                {user?.fullName?.charAt(0) || 'U'}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold text-stone-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-stone-500 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 w-full overflow-x-hidden relative">
        {/* Background blobs for admin too */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-orange-100/20 rounded-full blur-[80px] mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-20 w-[30vw] h-[30vw] bg-yellow-100/20 rounded-full blur-[60px] mix-blend-multiply"></div>
        </div>

        {['admin', 'super_admin', 'serveur', 'salle', 'caissier'].includes(user?.role || '') && (
            <div className="fixed bottom-8 right-8 z-50">
                <ServerCallsNotification />
            </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
