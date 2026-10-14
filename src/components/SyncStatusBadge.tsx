import { useState, useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncStatus {
  isConfigured: boolean;
  isLocal: boolean;
  remoteUrl: string | null;
  tenantName: string | null;
  lastSyncedAt: string | null;
  lastStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastError: string | null;
  pendingCount: {
    orders: number;
    cashSessions: number;
    cashMovements: number;
    invoices: number;
    total: number;
  };
}

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/sync/status');
      setStatus(res.data);
    } catch {
      // If endpoint doesn't respond or error, ignore quietly
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post('/sync/trigger');
      if (res.data.success) {
        toast.success('Synchronisation Cloud réussie !');
      } else {
        toast.warning(res.data.message || 'La synchronisation a rencontré un problème.');
      }
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la synchronisation.');
    } finally {
      setLoading(false);
    }
  };

  // If this is not a local server, don't show the sync badge
  if (!status || !status.isLocal) {
    return null;
  }

  const isSyncing = loading || status.lastStatus === 'syncing';
  const hasPending = status.pendingCount.total > 0;
  const isError = status.lastStatus === 'error';

  return (
    <div className="relative">
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
          isSyncing
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : isError
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : hasPending
            ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}
        title="État de la synchronisation Cloud"
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : isError ? (
          <CloudOff className="w-3.5 h-3.5 text-rose-600" />
        ) : hasPending ? (
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
        )}

        <span className="hidden sm:inline">
          {isSyncing
            ? 'Sync...'
            : isError
            ? 'Hors-Ligne'
            : hasPending
            ? `${status.pendingCount.total} en attente`
            : 'Synchronisé'}
        </span>
      </button>

      {/* Dropdown Details Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 p-4 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 text-stone-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-sm text-stone-900">Serveur Local Actif</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                LAN
              </span>
            </div>

            <p className="mt-2 text-stone-500 text-[11px] leading-relaxed">
              Vos commandes et encaissements fonctionnent en direct sur votre Wi-Fi local sans dépendre d'Internet.
            </p>

            {/* Pending breakdown */}
            <div className="my-3 p-2.5 bg-stone-50 rounded-xl space-y-1.5 border border-stone-100/80">
              <div className="flex justify-between font-medium">
                <span className="text-stone-600">Commandes en attente :</span>
                <span className="font-bold text-stone-900">{status.pendingCount.orders}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-stone-600">Sessions & Caisses :</span>
                <span className="font-bold text-stone-900">{status.pendingCount.cashSessions + status.pendingCount.cashMovements}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-stone-600">Factures :</span>
                <span className="font-bold text-stone-900">{status.pendingCount.invoices}</span>
              </div>
            </div>

            {status.lastError && (
              <div className="mb-3 p-2 bg-rose-50 text-rose-700 rounded-lg text-[10px] leading-tight flex items-start gap-1.5 border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Cloud injoignable : {status.lastError}</span>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
