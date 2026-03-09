import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { isAfter, parseISO } from 'date-fns';
import { ServerCallsNotification } from './ServerCallsNotification';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useSubscription } from '../hooks/useSubscription';
import { LayoutDashboard, ShoppingBag, Users, FileText, LogOut, Coffee, Bell, TrendingUp, X, ChefHat, Settings, Banknote, ArrowRightLeft, ExternalLink, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import UpgradeModal from './UpgradeModal';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string | undefined>(undefined);

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

  // Lockout effect for SUSPENDED/EXPIRED tenants
  useEffect(() => {
    const tenant = user?.tenant;
    const status = tenant?.subscriptionStatus;

    // Check if trial is over or subscription expired
    let isTrialOver = false;
    if (tenant?.subscriptionPlan === 'TRIAL' && tenant?.trialEndsAt) {
      isTrialOver = isAfter(new Date(), parseISO(tenant.trialEndsAt));
    }

    let isSubOver = false;
    if (tenant?.subscriptionStatus === 'ACTIVE' && tenant?.subscriptionEndsAt) {
      isSubOver = isAfter(new Date(), parseISO(tenant.subscriptionEndsAt));
    }

    const isLocked = status === 'SUSPENDED' || status === 'EXPIRED' || (status === 'PAST_DUE' && tenant?.subscriptionPlan === 'TRIAL') || isTrialOver || isSubOver;

    if (isLocked && location.pathname !== '/admin/subscription' && location.pathname.startsWith('/admin')) {
      navigate('/admin/subscription');
    }
  }, [user, location.pathname, navigate]);

  // Redirection for Super Admin without tenant
  useEffect(() => {
    if (user?.role === 'super_admin' && !user.tenant && location.pathname.startsWith('/admin') && !location.pathname.startsWith('/admin/super')) {
      navigate('/admin/super');
    }
  }, [user, location.pathname, navigate]);

  // 1. Get Subscription Status
  const { can } = useSubscription();

  // DEFINITIONS
  type MenuItem = {
    icon: any;
    label: string;
    path: string;
    roles: string[];
    feature?: string;
  };

  let menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Cuisine & Commandes', path: '/admin/orders', roles: ['super_admin', 'admin', 'salle', 'serveur'] },
    { icon: ShoppingBag, label: 'Dispatch Livraison', path: '/admin/dispatch', roles: ['super_admin', 'admin', 'caissier'] },
    { icon: Coffee, label: 'Carte & Menu', path: '/admin/menu', roles: ['super_admin', 'admin', 'salle'] },
    { icon: LayoutDashboard, label: 'Salles & Tables', path: '/admin/tables', roles: ['super_admin', 'admin', 'salle'] },
    { icon: FileText, label: 'Réservations', path: '/admin/reservations', roles: ['super_admin', 'admin', 'salle'], feature: 'reservations_enabled' },
    { icon: Users, label: 'Équipe', path: '/admin/users', roles: ['super_admin', 'admin'] },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    menuItems.push({ icon: TrendingUp, label: 'Finances', path: '/admin/finance', roles: ['super_admin', 'admin'], feature: 'finance_enabled' });
    menuItems.push({ icon: Banknote, label: 'Caisse', path: '/admin/cash', roles: ['super_admin', 'admin'] }); // Cash is basic, but advanced Finance is restricted. Actually user said "Finance, Factures, Journaux". "Caisse" implies Register management which is BASIC. So keep Caisse open but limit registers.
    menuItems.push({ icon: ArrowRightLeft, label: 'Transferts', path: '/admin/cash/transfers', roles: ['super_admin', 'admin'], feature: 'finance_enabled' });
    menuItems.push({ icon: FileText, label: 'Factures', path: '/admin/invoices', roles: ['super_admin', 'admin'], feature: 'finance_enabled' });

    // Elite only
    menuItems.push({ icon: FileText, label: 'Comptabilité', path: '/admin/accounting', roles: ['super_admin', 'admin'], feature: 'accounting_export' });


    // Feature: Stock (Inventaire) - requires stock_enabled
    // menuItems.push({ icon: ShoppingBag, label: 'Stocks', path: '/admin/inventory', roles: ['super_admin', 'admin'], feature: 'stock_enabled' });

    menuItems.push({ icon: CreditCard, label: 'Mon Abonnement', path: '/admin/subscription', roles: ['super_admin', 'admin'] });
    menuItems.push({ icon: Settings, label: 'Paramètres', path: '/admin/settings', roles: ['super_admin', 'admin'] });
  }

  // ... (Journaux, Site, Server specific links remains the same... ensure to copy strictly if unchanged)
  if (user?.role === 'super_admin' || user?.role === 'admin') {
    menuItems.push({ icon: FileText, label: 'Journaux', path: '/admin/audit-logs', roles: ['super_admin', 'admin'], feature: 'finance_enabled' }); // User said "Journaux" should be inaccessible. Assuming finance_enabled covers this 'advanced' feature set or use another flag. Reusing finance_enabled for simplicity as 'Advanced Admin'.
  }
  if (user?.tenant?.slug) {
    menuItems.push({ icon: ExternalLink, label: 'Voir Site', path: `/r/${user.tenant.slug}`, roles: ['super_admin', 'admin', 'salle', 'serveur', 'caissier'] });
  }
  if (user?.role === 'serveur') {
    menuItems.push({ icon: Coffee, label: 'Mes Tables', path: '/admin/tables?filter=mine', roles: ['serveur'] });
    menuItems.push({ icon: Bell, label: 'Mes Appels', path: '/admin/calls', roles: ['serveur'] });
  }

  const allowedMenuItems = menuItems.filter(item => {
    // 1. Check Roles
    if (item.roles && !item.roles.includes(user?.role || '')) return false;
    return true;
  });

  return (
    <div className="min-h-screen text-stone-800 flex flex-col lg:flex-row" style={{ background: 'var(--bg-app)' }}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-lg font-black tracking-tighter text-stone-900">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <ChefHat className="w-4 h-4" />
            )}
          </div>
          <span>{branding.name}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen bg-white lg:bg-white/80 lg:backdrop-blur-xl border-r border-stone-100 w-72 flex flex-col z-[70] transition-transform duration-500 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-black tracking-tighter text-stone-900">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>
            <span>{branding.name}</span>
          </div>

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all cursor-pointer">
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {allowedMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname !== '/admin' && location.pathname + location.search === item.path);

            // Check Feature access
            let isLocked = false;

            // Handle suspended/expired state - Exclude "Voir Site" (item.label === 'Voir Site')
            const tenant = user?.tenant;
            const status = tenant?.subscriptionStatus;

            let isTrialOver = false;
            if (tenant?.subscriptionPlan === 'TRIAL' && tenant?.trialEndsAt) {
              isTrialOver = isAfter(new Date(), parseISO(tenant.trialEndsAt));
            }

            let isSubOver = false;
            if (tenant?.subscriptionStatus === 'ACTIVE' && tenant?.subscriptionEndsAt) {
              isSubOver = isAfter(new Date(), parseISO(tenant.subscriptionEndsAt));
            }

            if ((status === 'SUSPENDED' || status === 'EXPIRED' || (status === 'PAST_DUE' && tenant?.subscriptionPlan === 'TRIAL') || isTrialOver || isSubOver) &&
              item.path !== '/admin/subscription' && item.label !== 'Voir Site') {
              isLocked = true;
            } else if ((item as any).feature) {
              const featureKey = (item as any).feature;
              if (!can(featureKey)) {
                isLocked = true;
              }
            }

            return (
              <Link
                key={item.path}
                ref={isActive ? activeLinkRef : null}
                to={isLocked ? '#' : item.path}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    if (user?.tenant?.subscriptionStatus === 'SUSPENDED' || user?.tenant?.subscriptionStatus === 'EXPIRED') {
                      navigate('/admin/subscription');
                    } else {
                      setLockedFeature(item.label);
                      setUpgradeModalOpen(true);
                    }
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group relative mb-1",
                  isActive
                    ? "shadow-sm border border-stone-100/50"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900",
                  isLocked && "opacity-60 grayscale cursor-not-allowed hover:bg-transparent"
                )}
                style={isActive ? {
                  backgroundColor: `${branding.primaryColor}10`,
                  color: branding.primaryColor
                } : undefined}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                )}
                <div className="relative">
                  <item.icon
                    className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", !isActive && "text-stone-400 group-hover:text-stone-600")}
                    style={isActive ? { color: branding.primaryColor } : undefined}
                  />
                  {isLocked && (
                    <div className="absolute -top-1 -right-1 bg-stone-900 text-white rounded-full p-[2px]">
                      <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                  )}
                </div>

                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-5 mt-auto m-4 rounded-[2rem] border border-stone-100/50 bg-stone-50/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white ${user?.role === 'super_admin' ? 'bg-indigo-600' : 'bg-stone-900'}`}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-stone-900 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 w-full text-xs font-black uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all border border-transparent hover:border-red-100 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 animate-in fade-in slide-in-from-right-4 duration-700 w-full overflow-x-hidden relative min-h-screen">
        {/* Background blobs for admin too */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-orange-100/20 rounded-full blur-[100px] mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-20 w-[30vw] h-[30vw] bg-yellow-100/20 rounded-full blur-[80px] mix-blend-multiply"></div>
        </div>

        {['admin', 'super_admin', 'serveur', 'salle', 'caissier'].includes(user?.role || '') && (
          <div className="fixed bottom-6 right-6 z-50 lg:bottom-10 lg:right-10">
            <ServerCallsNotification />
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={lockedFeature}
      />
    </div>
  );
}
