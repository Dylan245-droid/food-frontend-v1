// @ts-nocheck
import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, LogOut, Activity,
  CreditCard, TrendingUp, Menu, X as CloseIcon,
  ShieldCheck, Globe, ChevronRight, Calculator
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SuperAdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'super_admin') return <Navigate to="/admin" />;

  const navigation = [
    { name: 'Vue d\'ensemble', href: '/admin/super', icon: LayoutDashboard },
    { name: 'Restaurants', href: '/admin/super/tenants', icon: Users },
    { name: 'Facturation', href: '/admin/super/invoices', icon: CreditCard },
    { name: 'Revenus', href: '/admin/super/revenue', icon: TrendingUp },
    { name: 'Audit Logs', href: '/admin/super/audit-logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">

      {/* Mobile Top Bar - Premium Dark */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 border-b border-white/5 flex items-center justify-between px-6 z-[60] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
            <Globe className="w-4 h-4 text-orange-400" />
          </div>
          <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">Super Admin</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[50] md:hidden animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Surgical Desktop View */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[55] w-72 bg-stone-900 text-white transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col border-r border-white/5 shadow-2xl overflow-hidden",
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Visual Grains/Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex-1 flex flex-col min-h-0 z-10 font-display">

          {/* Brand Identity */}
          <div className="flex items-center gap-4 h-24 px-8 border-b border-white/5">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <Globe className="w-6 h-6 text-orange-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase leading-none">Global</h1>
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                Central Hub
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => {
              const isActive = item.href === '/admin/super'
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center justify-between px-5 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-white text-stone-900 shadow-2xl shadow-black/20"
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center relative z-10">
                    <item.icon className={cn("mr-4 w-4 h-4 transition-colors", isActive ? "text-stone-900" : "text-stone-600 group-hover:text-stone-400")} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-900 animate-in slide-in-from-left-2" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-6 mt-auto">
            <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 group hover:bg-white/10 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[1.5rem] bg-stone-800 flex items-center justify-center font-black text-white border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  {user.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white uppercase tracking-tight truncate">{user.fullName}</p>
                  <p className="text-[9px] font-bold text-stone-500 uppercase mt-0.5">Administrator</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full h-12 flex items-center justify-center gap-3 bg-stone-950/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white hover:bg-red-600 transition-all active:scale-95 shadow-inner"
              >
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Surgical Breathable Layout */}
      <main className="flex-1 min-w-0 min-h-screen md:pl-72 flex flex-col animate-in fade-in transition-all duration-700">
        <div className="flex-1 p-4 md:p-6 lg:p-8 pt-20 md:pt-8 relative">
          {/* Dynamic background element for premium feel */}
          <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-stone-100/30 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none z-[-1]"></div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
