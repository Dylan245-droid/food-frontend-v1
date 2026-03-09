import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Activity, CreditCard, TrendingUp, Menu, X as CloseIcon } from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }



  if (!user) return <Navigate to="/login" />;

  // If not platform super admin, redirect to normal admin or home
  if (user.role !== 'super_admin') return <Navigate to="/admin" />;

  const navigation = [
    { name: 'Vue d\'ensemble', href: '/admin/super', icon: LayoutDashboard },
    { name: 'Restaurants', href: '/admin/super/tenants', icon: Users },
    { name: 'Facturation', href: '/admin/super/invoices', icon: CreditCard },
    { name: 'Revenus', href: '/admin/super/revenue', icon: TrendingUp },
    { name: 'Audit Logs', href: '/admin/super/audit-logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 flex items-center justify-between px-4 z-50">
        <h1 className="text-xl font-bold text-orange-500">SUPER ADMIN</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900 border-b border-gray-800">
            <h1 className="text-xl font-bold text-orange-500">SUPER ADMIN</h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = item.href === '/admin/super'
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-300'
                        }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
            <div className="flex items-center w-full">
              <div className="ml-3 w-full">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <button
                  onClick={logout}
                  className="flex items-center mt-2 text-xs text-gray-400 hover:text-white w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 pt-16 md:pt-0 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
