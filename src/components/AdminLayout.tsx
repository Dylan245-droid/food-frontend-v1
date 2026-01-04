import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ServerCallsNotification } from './ServerCallsNotification';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Users, FileText, LogOut, Coffee, Bell, TrendingUp, Menu, X, ChefHat } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
      setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Cuisine & Commandes', path: '/admin/orders', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: Coffee, label: 'Carte & Menu', path: '/admin/menu', roles: ['super_admin', 'admin', 'salle'] },
    { icon: LayoutDashboard, label: 'Salles & Tables', path: '/admin/tables', roles: ['super_admin', 'admin', 'salle'] },
    { icon: Users, label: 'Équipe', path: '/admin/users', roles: ['super_admin', 'admin'] },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
      menuItems.push({ icon: TrendingUp, label: 'Finances', path: '/admin/finance', roles: ['super_admin', 'admin'] });
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
    <div className="min-h-screen bg-[#FFF8F3] text-stone-800 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-orange-100 p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-lg font-black text-stone-900 flex items-center gap-2 font-display">
             <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <ChefHat className="w-5 h-5" />
             </div>
             Sauce Créole
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-stone-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors">
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

      {/* Sidebar */}
      <aside className={cn(
          "bg-white border-r border-orange-100 flex flex-col fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 w-72 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          "md:translate-x-0", // Always visible on desktop
          isSidebarOpen ? "translate-x-0" : "-translate-x-full" // Toggle on mobile
      )}>
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3 font-display tracking-tight">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 rotate-3">
                <ChefHat className="w-6 h-6" />
             </div>
             Sauce <br/>Créole
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname !== '/admin' && location.pathname + location.search === item.path);
            return (
                <Link
                key={item.path}
                to={item.path}
                className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group relative",
                    isActive
                    ? "bg-orange-50 text-orange-700 shadow-sm" 
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                )}
                >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full"></div>}
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-orange-600" : "text-stone-400 group-hover:text-stone-600")} />
                {item.label}
                </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-orange-50/50 mt-auto m-4 bg-orange-50/30 rounded-2xl">
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

        <div className="fixed bottom-8 right-8 z-50">
            <ServerCallsNotification />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
