import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Activity, CreditCard } from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

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
    { name: 'Audit Logs', href: '/admin/super/audit-logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 bg-gray-900 text-white">
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
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
