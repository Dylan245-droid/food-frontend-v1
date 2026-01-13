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

export default function App() {
  return (
    <BrandingProvider>
    <NotificationProvider>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/takeout" element={<TakeoutPage />} />
        <Route path="/dine-in/:code" element={<DineInPage />} />
        <Route path="/t/:code" element={<DineInPage />} /> {/* Short URL for QR codes */}
        <Route path="/track" element={<OrderTrackingPage />} />
        <Route path="/track/:code" element={<OrderTrackingPage />} />
        <Route path="/book" element={<BookingPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

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
      </Route>

      <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </NotificationProvider>
    </BrandingProvider>
  );
}
