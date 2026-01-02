import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ServerCallsNotification } from './ServerCallsNotification';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Users, FileText, LogOut, Coffee, Bell, TrendingUp, Menu, X } from 'lucide-react';
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Commandes', path: '/admin/orders', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: Coffee, label: 'Menu', path: '/admin/menu', roles: ['super_admin', 'admin', 'salle'] },
    { icon: LayoutDashboard, label: 'Tables', path: '/admin/tables', roles: ['super_admin', 'admin', 'salle'] },
    { icon: Users, label: 'Équipe', path: '/admin/users', roles: ['super_admin', 'admin'] },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
      menuItems.push({ icon: TrendingUp, label: 'Finances', path: '/admin/finance', roles: ['super_admin', 'admin'] });
  }

  if (user?.role === 'super_admin') {
      menuItems.push({ icon: FileText, label: 'Audit Logs', path: '/admin/audit-logs', roles: ['super_admin'] });
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-lg font-bold text-red-600 flex items-center gap-2">
             <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
             Sauce Créole
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Sidebar */}
      <aside className={cn(
          "bg-white border-r border-gray-200 flex flex-col fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 w-64",
          "md:translate-x-0", // Always visible on desktop
          isSidebarOpen ? "translate-x-0" : "-translate-x-full" // Toggle on mobile
      )}>
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <h1 className="text-xl font-bold text-red-600 flex items-center gap-2">
             <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
             Sauce Créole
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname + location.search) === item.path;
            return (
                <Link
                key={item.path}
                to={item.path}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                    ? "bg-red-50 text-red-700 shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                >
                <item.icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-gray-400")} />
                {item.label}
                </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="px-4 py-3 mb-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName}</p>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user?.role === 'super_admin' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 w-full overflow-x-hidden">
        <div className="fixed bottom-8 right-8 z-50">
            <ServerCallsNotification />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
