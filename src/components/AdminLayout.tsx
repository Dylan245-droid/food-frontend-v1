import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { isAfter, parseISO } from 'date-fns';
import { ServerCallsNotification } from './ServerCallsNotification';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useSubscription } from '../hooks/useSubscription';
import {
  LayoutDashboard, Users, LogOut, Bell, TrendingUp, X, ChefHat, Settings,
  Banknote, ArrowRightLeft, ExternalLink, CreditCard, UtensilsCrossed, Truck,
  Grid2X2, CalendarCheck, Receipt, Calculator, ScrollText, Coffee, Menu, ChevronLeft, ChevronRight, Package
} from 'lucide-react';
import type { FeatureKey } from '../hooks/useSubscription';
import { cn, getImageUrl } from '../lib/utils';
import UpgradeModal from './UpgradeModal';

// --- Sidebar Section Divider ---
const SidebarDivider = ({ label }: { label: string }) => (
  <div className="pt-5 pb-2 px-4">
    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-300">{label}</span>
  </div>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    if (activeLinkRef.current) {
      activeLinkRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [location.pathname]);

  // Lockout effect for SUSPENDED/EXPIRED tenants
  useEffect(() => {
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

  const { can } = useSubscription();

  // --- Menu Items with better icons and grouping ---
  type MenuItem = {
    icon: any;
    label: string;
    path: string;
    roles: string[];
    feature?: string;
    group?: string;
  };

  let menuItems: MenuItem[] = [
    // Main
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin', roles: ['super_admin', 'admin', 'salle', 'serveur'], group: 'main' },
    { icon: UtensilsCrossed, label: 'Cuisine & Commandes', path: '/admin/orders', roles: ['super_admin', 'admin', 'salle', 'serveur'], group: 'main' },
    { icon: Truck, label: 'Dispatch Livraison', path: '/admin/dispatch', roles: ['super_admin', 'admin', 'caissier'], group: 'main' },
    { icon: Coffee, label: 'Carte & Menu', path: '/admin/menu', roles: ['super_admin', 'admin', 'salle'], group: 'main' },
    { icon: Grid2X2, label: 'Salles & Tables', path: '/admin/tables', roles: ['super_admin', 'admin', 'salle'], group: 'main' },
    { icon: CalendarCheck, label: 'Réservations', path: '/admin/reservations', roles: ['super_admin', 'admin', 'salle'], feature: 'reservations_enabled', group: 'main' },
    { icon: Users, label: 'Équipe', path: '/admin/users', roles: ['super_admin', 'admin'], group: 'main' },
    { icon: Package, label: 'Stocks', path: '/admin/stock', roles: ['super_admin', 'admin'], feature: 'stock_enabled', group: 'main' },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    menuItems.push({ icon: TrendingUp, label: 'Finances', path: '/admin/finance', roles: ['super_admin', 'admin'], feature: 'finance_enabled', group: 'finance' });
    menuItems.push({ icon: Banknote, label: 'Caisse', path: '/admin/cash', roles: ['super_admin', 'admin'], group: 'finance' });
    menuItems.push({ icon: ArrowRightLeft, label: 'Transferts', path: '/admin/cash/transfers', roles: ['super_admin', 'admin'], feature: 'finance_enabled', group: 'finance' });
    menuItems.push({ icon: Receipt, label: 'Factures', path: '/admin/invoices', roles: ['super_admin', 'admin'], feature: 'finance_enabled', group: 'finance' });
    menuItems.push({ icon: Calculator, label: 'Comptabilité', path: '/admin/accounting', roles: ['super_admin', 'admin'], feature: 'accounting_export', group: 'finance' });
    menuItems.push({ icon: CreditCard, label: 'Mon Abonnement', path: '/admin/subscription', roles: ['super_admin', 'admin'], group: 'system' });
    menuItems.push({ icon: Settings, label: 'Paramètres', path: '/admin/settings', roles: ['super_admin', 'admin'], group: 'system' });
  }

  if (user?.role === 'super_admin') {
    menuItems.push({ icon: ScrollText, label: 'Journaux', path: '/admin/audit-logs', roles: ['super_admin'], feature: 'finance_enabled', group: 'system' });
  }
  if (user?.tenant?.slug) {
    menuItems.push({ icon: ExternalLink, label: 'Voir Site', path: `/r/${user.tenant.slug}`, roles: ['super_admin', 'admin', 'salle', 'serveur', 'caissier'], group: 'system' });
  }
  if (user?.role === 'serveur') {
    menuItems.push({ icon: Coffee, label: 'Mes Tables', path: '/admin/tables?filter=mine', roles: ['serveur'], group: 'main' });
    menuItems.push({ icon: Bell, label: 'Mes Appels', path: '/admin/calls', roles: ['serveur'], group: 'main' });
  }

  const allowedMenuItems = menuItems.filter(item => {
    if (item.roles && !item.roles.includes(user?.role || '')) return false;
    return true;
  });

  // Group items for rendering
  const mainItems = allowedMenuItems.filter(i => i.group === 'main');
  const financeItems = allowedMenuItems.filter(i => i.group === 'finance');
  const systemItems = allowedMenuItems.filter(i => i.group === 'system');

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.path || (location.pathname !== '/admin' && location.pathname + location.search === item.path);

    let isLocked = false;
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
    } else if (item.feature) {
      if (!can(item.feature as FeatureKey)) {
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
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative",
          isActive
            ? "shadow-xs"
            : "text-stone-500 hover:bg-stone-50/80 hover:text-stone-800",
          isLocked && "opacity-50 grayscale cursor-not-allowed hover:bg-transparent"
        )}
        style={isActive ? {
          backgroundColor: `${branding.primaryColor}12`,
          color: branding.primaryColor
        } : undefined}
      >
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
            style={{ backgroundColor: branding.primaryColor }}
          />
        )}
        <div className="relative">
          <item.icon
            className={cn("w-[18px] h-[18px] transition-colors duration-200", !isActive && "text-stone-400 group-hover:text-stone-600")}
            style={isActive ? { color: branding.primaryColor } : undefined}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          {isLocked && (
            <div className="absolute -top-1 -right-1 bg-stone-800 text-white rounded-full p-[2px]">
              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          )}
        </div>
        {(!isCollapsed || isSidebarOpen) && item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen text-stone-800 flex flex-col lg:flex-row" style={{ background: 'var(--bg-app)' }}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-stone-100/80 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ChefHat className="w-4 h-4" />
            )}
          </div>
          <span className="text-base font-bold text-stone-900 tracking-tight">{branding.name}</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen bg-white lg:bg-white/90 lg:backdrop-blur-xl border-r border-stone-100/80 flex flex-col z-[70] transition-all duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-stone-100 rounded-full items-center justify-center shadow-sm cursor-pointer hover:bg-stone-50 transition-colors z-[80]"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-stone-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-stone-500" />}
        </button>
        {/* Logo Header */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-stone-100/60">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ChefHat className="w-5 h-5" />
            )}
          </div>
          {!isCollapsed && <span className="text-base font-bold text-stone-900 tracking-tight transition-opacity duration-200 truncate">{branding.name}</span>}
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer">
          <X className="w-5 h-5 text-stone-400" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-3 pb-2 overflow-y-auto no-scrollbar space-y-0.5">
          {/* Main Section */}
          {mainItems.map(renderMenuItem)}

          {/* Finance Section */}
          {financeItems.length > 0 && (
            <>
              {!isCollapsed && <SidebarDivider label="Finance" />}
              {financeItems.map(renderMenuItem)}
            </>
          )}

          {/* System Section */}
          {systemItems.length > 0 && (
            <>
              {!isCollapsed && <SidebarDivider label="Système" />}
              {systemItems.map(renderMenuItem)}
            </>
          )}
        </nav>

        {/* User Card */}
        <div className="px-3 pb-3 mt-auto">
          <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-100/60">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 overflow-hidden ${user?.role === 'super_admin' ? 'bg-indigo-600' : 'bg-stone-800'}`}>
                {user?.avatar ? (
                  <img src={getImageUrl(user.avatar)!} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || 'U'
                )}
              </div>
              <div className={cn("overflow-hidden min-w-0 transition-all duration-200", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                <p className="text-sm font-bold text-stone-900 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 w-full text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-[0.98]",
                isCollapsed && "px-0"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              {!isCollapsed && "Déconnexion"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden relative min-h-screen">
        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-orange-100/15 rounded-full blur-[120px] mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-20 w-[30vw] h-[30vw] bg-yellow-100/15 rounded-full blur-[100px] mix-blend-multiply"></div>
        </div>

        {['admin', 'super_admin', 'serveur', 'salle', 'caissier'].includes(user?.role || '') && (
          <div className="fixed bottom-6 right-6 z-50 lg:bottom-10 lg:right-10">
            <ServerCallsNotification />
          </div>
        )}
        <div className="relative z-10 max-w-[1600px] mx-auto p-4 pb-24 lg:p-8 lg:pb-12 xl:p-10 xl:pb-12">
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
