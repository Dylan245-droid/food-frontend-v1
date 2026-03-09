import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/HomePage';
import DineInPage from './pages/client/DineInPage';
import TakeoutPage from './pages/client/TakeoutPage';
import BookingPage from './pages/client/BookingPage';
import OrderTrackingPage from './pages/client/OrderTrackingPage';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import TablesPage from './pages/admin/TablesPage';
import MenuPage from './pages/admin/MenuPage';
import OrdersPage from './pages/admin/OrdersPage';
import ServerCallsPage from './pages/admin/ServerCallsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import FinancePage from './pages/admin/FinancePage';
import SettingsPage from './pages/admin/SettingsPage';
import CashPage from './pages/admin/CashPage';
import CashTransfersPage from './pages/admin/CashTransfersPage';
import InvoicesPage from './pages/admin/InvoicesPage';
import AccountingPage from './pages/admin/AccountingPage';
import ReservationsPage from './pages/admin/ReservationsPage';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DispatchPage from './pages/admin/DispatchPage';
import ActivateAccountPage from './pages/ActivateAccountPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import GoTchopLandingPage from './pages/saas/GoTchopLandingPage';
import RestaurantRegistrationPage from './pages/saas/RestaurantRegistrationPage';
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout';
import TenantsPage from './pages/super-admin/TenantsPage';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SuperAdminInvoicesPage from './pages/super-admin/InvoicesPage';
import RevenuePage from './pages/super-admin/RevenuePage';
import SubscriptionPage from './pages/admin/SubscriptionPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}

import { Toaster } from 'sonner';
import { NotificationProvider } from './context/NotificationContext';
import { BrandingProvider } from './context/BrandingContext';
import FeaturesPage from './pages/saas/FeaturesPage';
import ContactPage from './pages/saas/ContactPage';
import GuidePage from './pages/saas/GuidePage';
import { LegalMentionsPage, PrivacyPage, TermsPage } from './pages/saas/LegalPages';

export default function App() {
  return (
    <BrandingProvider>
      <NotificationProvider>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          {/* SAAS Public Routes */}
          <Route path="/" element={<GoTchopLandingPage />} />
          <Route path="/register" element={<RestaurantRegistrationPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/mentions" element={<LegalMentionsPage />} />

          {/* Tenant Public Service Routes (Scoped by Slug) */}
          <Route path="/r/:slug" element={<PublicLayout />}>
            <Route index element={<HomePage />} /> {/* Defaults to Menu/Home */}
            <Route path="menu" element={<HomePage />} />
            <Route path="takeout" element={<TakeoutPage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="track" element={<OrderTrackingPage />} />
            <Route path="track/:code" element={<OrderTrackingPage />} />

            {/* Dine-in can be here too, e.g. /r/:slug/t/:code */}
            <Route path="t/:code" element={<DineInPage />} />
            <Route path="dine-in/:code" element={<DineInPage />} />
          </Route>

          {/* Legacy/Short Routes (Redirect or Keep for compatibility if globally unique) */}
          {/* For now, let's keep robust short links if possible, or redirect if we can't infer slug */}
          <Route path="/t/:code" element={<DineInPage />} /> {/* Fallback or global lookup */}
          <Route path="/dine-in/:code" element={<DineInPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivateAccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Delivery Dashboard (Mobile First, No Admin Layout) */}
          <Route path="/delivery" element={
            <ProtectedRoute>
              <DeliveryDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="dispatch" element={<DispatchPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="calls" element={<ServerCallsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="cash" element={<CashPage />} />
            <Route path="cash/transfers" element={<CashTransfersPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
          </Route>

          {/* SUPER ADMIN ROUTES */}
          <Route path="/admin/super" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="invoices" element={<SuperAdminInvoicesPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </NotificationProvider>
    </BrandingProvider>
  );
}
