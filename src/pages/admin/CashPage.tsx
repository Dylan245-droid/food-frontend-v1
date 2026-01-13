import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MoneyCounter } from '../../components/MoneyCounter';
import api from '../../lib/api';
import { 
  Banknote, Plus, Settings, PlayCircle, StopCircle, 
  Clock, User, AlertCircle, Loader2, 
  CheckCircle, XCircle, TrendingUp, TrendingDown, Receipt, Info, ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface CashRegister {
  id: number;
  name: string;
  location: string | null;
  type: 'sales' | 'delivery' | 'operating';
  isActive: boolean;
  hasOpenSession: boolean;
  currentSession: {
    id: number;
    openedBy: string;
    openedAt: string;
    openingBalance: number;
    currentBalance: number;
  } | null;
}

// Type labels
const CASH_REGISTER_TYPES = {
  sales: { label: 'Vente', color: 'bg-green-100 text-green-700 border-green-200' },
  delivery: { label: 'Livraison', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  operating: { label: 'Fonctionnement', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

interface CashSession {
  id: number;
  cashRegisterId: number;
  openingBalance: number;
  expectedBalance: number | null;
  declaredBalance: number | null;
  discrepancy: number | null;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  cashRegister: { name: string };
  opener: { fullName: string };
  closer?: { fullName: string };
}

interface SessionDetails extends CashSession {
  movements: any[];
  summary: {
    openingBalance: number;
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
    movementsCount: number;
  };
}

// Format currency


export default function CashPage() {
  // Data fetching
  const { data: registersData, loading: loadingRegisters, refetch: refetchRegisters } = 
    useFetch<{ data: CashRegister[] }>('/admin/cash/registers');
  
  const { data: openSessionsData, refetch: refetchOpenSessions } = 
    useFetch<{ data: CashSession[] }>('/admin/cash/sessions/current');

  // State
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
  
  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false);
  
  // Forms
  const [registerForm, setRegisterForm] = useState({ name: '', location: '', type: 'sales' as 'sales' | 'delivery' | 'operating' });
  const [openingBalance, setOpeningBalance] = useState(0);
  const [declaredBalance, setDeclaredBalance] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [moneyCount, setMoneyCount] = useState<Record<number, number>>({});
  
  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const registers = registersData?.data || [];
  const openSessions = openSessionsData?.data || [];

  // Add Movement State
  const [isAddMovementModalOpen, setIsAddMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({ 
      type: 'expense' as 'income' | 'expense', 
      amount: 0, 
      description: '', 
      accountingAccount: '',
      proofFile: null as File | null
  });

  // Add Movement Handler
  const handleAddMovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedRegister || !selectedRegister.currentSession) return;
      setSubmitting(true);
      try {
          const formData = new FormData();
          formData.append('cashSessionId', selectedRegister.currentSession.id.toString());
          formData.append('type', movementForm.type);
          formData.append('category', movementForm.type === 'income' ? 'deposit' : 'expense');
          formData.append('amount', movementForm.amount.toString());
          formData.append('description', movementForm.description);
          if (movementForm.accountingAccount) formData.append('accountingAccount', movementForm.accountingAccount);
          if (movementForm.proofFile) formData.append('proofFile', movementForm.proofFile);

          await api.post('/admin/cash/movements', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          setIsAddMovementModalOpen(false);
          setMovementForm({ type: 'expense', amount: 0, description: '', accountingAccount: '', proofFile: null });
          alert('Mouvement enregistré');
          refetchRegisters();
          refetchOpenSessions();
      } catch (error: any) {
          alert('Erreur: ' + (error.response?.data?.message || 'Impossible d\'ajouter le mouvement'));
      } finally {
          setSubmitting(false);
      }
  };

  // Audit State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({ realAmount: 0, notes: '' });

  const handleSaveAudit = async () => {
      if (!selectedRegister || !selectedRegister.currentSession) return;
      const theoretical = declaredBalance || 0; // declatedBalance holds currentBalance here
      const diff = auditForm.realAmount - theoretical;

      if (diff === 0) {
          alert("Le solde est exact. Contrôle validé ✅");
          setIsAuditModalOpen(false);
          return;
      }
      
      const isSurplus = diff > 0;
      const type = isSurplus ? 'income' : 'expense';
      const category = 'adjustment';
      
      setSubmitting(true);
      try {
           await api.post('/admin/cash/movements', {
              cashSessionId: selectedRegister.currentSession.id,
              type: type,
              category: category,
              amount: Math.abs(diff),
              description: `Régularisation suite contrôle: ${auditForm.notes || 'Aucune note'}`
          });
          alert(`Ecart régularisé (${formatCurrency(diff)})`);
          setIsAuditModalOpen(false);
          refetchRegisters();
          refetchOpenSessions();
      } catch (error: any) {
          alert('Erreur: ' + error.response?.data?.message);
      } finally {
          setSubmitting(false);
      }
  };

  // Create or update register
  const handleSaveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedRegister) {
        await api.patch(`/admin/cash/registers/${selectedRegister.id}`, registerForm);
      } else {
        await api.post('/admin/cash/registers', registerForm);
      }
      setIsRegisterModalOpen(false);
      setRegisterForm({ name: '', location: '', type: 'sales' });
      setSelectedRegister(null);
      refetchRegisters();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Open session
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegister) return;
    setSubmitting(true);
    try {
      await api.post('/admin/cash/sessions/open', {
        cashRegisterId: selectedRegister.id,
        openingBalance,
        openingCashBreakdown: moneyCount,
      });
      setIsOpenSessionModalOpen(false);
      setOpeningBalance(0);
      setMoneyCount({});
      setSelectedRegister(null);
      refetchRegisters();
      refetchOpenSessions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'ouverture');
    } finally {
      setSubmitting(false);
    }
  };

  // Close session
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/cash/sessions/${selectedSession.id}/close`, {
        declaredBalance,
        notes: closeNotes,
        closingCashBreakdown: moneyCount,
      });
      setIsCloseSessionModalOpen(false);
      setDeclaredBalance(0);
      setCloseNotes('');
      setMoneyCount({});
      setSelectedSession(null);
      refetchRegisters();
      refetchOpenSessions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  // Load session details
  const loadSessionDetails = async (sessionId: number) => {
    try {
      const res = await api.get(`/admin/cash/sessions/${sessionId}`);
      setSelectedSession(res.data.data);
      setIsSessionDetailsModalOpen(true);
    } catch (error) {
      alert('Erreur lors du chargement');
    }
  };

  // Load history
  const handleViewHistory = async (register: CashRegister) => {
    setSelectedRegister(register);
    setLoadingHistory(true);
    setIsHistoryModalOpen(true);
    try {
        const res = await api.get(`/admin/cash/sessions?registerId=${register.id}&status=closed&limit=10`);
        setHistorySessions(res.data.data);
    } catch (e) {
        alert('Erreur chargement historique');
    } finally {
        setLoadingHistory(false);
    }
  };

  if (loadingRegisters && !registersData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin w-12 h-12" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Banknote className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Gestion de Caisse
          </h1>
          <p className="text-gray-500">Postes de caisse et sessions quotidiennes</p>
        </div>
        <Button onClick={() => { setSelectedRegister(null); setRegisterForm({ name: '', location: '', type: 'sales' }); setIsRegisterModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau poste
        </Button>
      </div>

      {/* Open Sessions Alert */}
      {openSessions.length > 0 && (
        <div className="p-4 rounded-xl border-2 flex items-start gap-3" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
          <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--primary-600)' }} />
          <div>
            <h3 className="font-bold" style={{ color: 'var(--primary-900)' }}>
              {openSessions.length} session{openSessions.length > 1 ? 's' : ''} ouverte{openSessions.length > 1 ? 's' : ''}
            </h3>
            <p className="text-sm" style={{ color: 'var(--primary-700)' }}>
              {openSessions.map(s => s.cashRegister?.name || 'Caisse').join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Cash Registers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {registers.map(register => (
          <div 
            key={register.id}
            className="group relative overflow-hidden bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
          >
            {/* Type Accent Line */}
            <div className={`h-1.5 w-full ${
                register.type === 'sales' ? 'bg-green-500' : 
                register.type === 'delivery' ? 'bg-blue-500' : 'bg-purple-500'
            }`} />

            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                register.type === 'sales' ? 'bg-green-50 text-green-700' : 
                                register.type === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                                {CASH_REGISTER_TYPES[register.type]?.label || register.type}
                            </span>
                            {!register.isActive && (
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                    Inactif
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-xl text-stone-900 leading-tight">{register.name}</h3>
                        {register.location && <p className="text-sm text-stone-400 mt-0.5">{register.location}</p>}
                    </div>
                    
                    {/* Status Dot */}
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                        register.hasOpenSession ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-stone-200'
                    }`} title={register.hasOpenSession ? 'Session ouverte' : 'Fermé'} />
                </div>

                {/* Body Content */}
                <div className="flex-1">
                    {register.hasOpenSession && register.currentSession ? (
                        <div className="space-y-4">
                            <div className="text-center py-2">
                                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Solde Actuel</p>
                                <p className={`text-3xl font-black ${
                                    register.type === 'sales' ? 'text-green-600' : 
                                    register.type === 'delivery' ? 'text-blue-600' : 'text-purple-600'
                                }`}>
                                   {formatCurrency(register.currentSession.currentBalance || register.currentSession.openingBalance)} 
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 bg-stone-50 py-2 px-3 rounded-lg mx-auto w-fit">
                                <User className="w-3 h-3" />
                                <span className="font-medium">{register.currentSession.openedBy}</span>
                                <span className="w-1 h-1 bg-stone-300 rounded-full mx-1" />
                                <Clock className="w-3 h-3" />
                                <span>{new Date(register.currentSession.openedAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-6 text-stone-300">
                            <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mb-3 group-hover:bg-stone-100 transition-colors">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium text-stone-400">Caisse fermée</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-stone-100 grid grid-cols-[auto_1fr] gap-2">
                    <Button 
                        variant="ghost" 
                        className="px-3 border border-stone-100 text-stone-400 hover:text-stone-600 hover:border-stone-300"
                        onClick={() => handleViewHistory(register)}
                        title="Historique"
                    >
                        <Clock className="w-4 h-4" />
                    </Button>
                    
                    {register.hasOpenSession ? (
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant="secondary" 
                                className="w-full text-xs font-bold"
                                onClick={() => register.currentSession && loadSessionDetails(register.currentSession.id)}
                            >
                                Détails
                            </Button>
                            
                            {register.type === 'operating' ? (
                                <>
                                <Button
                                    className="w-full text-xs font-bold bg-stone-800 text-white hover:bg-stone-900"
                                    onClick={() => {
                                        setSelectedRegister(register);
                                        setMovementForm({ type: 'expense', amount: 0, description: '', accountingAccount: '', proofFile: null });
                                        setIsAddMovementModalOpen(true);
                                    }}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Mouvement
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full col-span-2 mt-1 text-xs border-dashed border-stone-400 text-white"
                                    onClick={() => {
                                        setSelectedRegister(register);
                                        // Fetch fresh balance
                                        if (register.currentSession) {
                                            api.get(`/admin/cash/sessions/${register.currentSession.id}`).then(res => {
                                                setDeclaredBalance(res.data.data.summary.currentBalance);
                                                setAuditForm({ realAmount: res.data.data.summary.currentBalance, notes: '' });
                                                setIsAuditModalOpen(true);
                                            });
                                        }
                                    }}
                                >
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Contrôler
                                </Button>
                                </>
                            ) : (
                                <Button 
                                    variant="danger" 
                                    className="w-full text-xs font-bold"
                                    onClick={async () => {
                                        if (register.currentSession) {
                                          const res = await api.get(`/admin/cash/sessions/${register.currentSession.id}`);
                                          setSelectedSession(res.data.data);
                                          setDeclaredBalance(res.data.data.summary.currentBalance);
                                          setMoneyCount({});
                                          setIsCloseSessionModalOpen(true);
                                        }
                                    }}
                                >
                                    Clôturer
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                             <Button 
                                variant="primary" 
                                className={`w-full font-bold shadow-sm ${
                                    register.type === 'sales' ? 'bg-green-600 hover:bg-green-700' : 
                                    register.type === 'delivery' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                                onClick={() => { setSelectedRegister(register); setMoneyCount({}); setIsOpenSessionModalOpen(true); }}
                                disabled={!register.isActive}
                            >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                {register.type === 'operating' ? 'Initialiser' : 'Ouvrir'}
                            </Button>
                            <Button 
                                variant="ghost"
                                className="px-3 text-stone-400 hover:text-stone-600"
                                onClick={() => { 
                                  setSelectedRegister(register); 
                                  setRegisterForm({ name: register.name, location: register.location || '', type: register.type || 'sales' });
                                  setIsRegisterModalOpen(true);
                                }}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {registers.length === 0 && (
          <div className="col-span-full py-16 text-center text-stone-400">
            <Banknote className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-bold mb-2">Aucun poste de caisse</p>
            <p className="text-sm mb-4">Créez votre premier poste pour commencer</p>
            <Button onClick={() => setIsRegisterModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un poste
            </Button>
          </div>
        )}
      </div>

      {/* Register Modal */}
      <Modal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        title={selectedRegister ? 'Modifier le poste' : 'Nouveau poste de caisse'}
      >
        <form onSubmit={handleSaveRegister} className="space-y-4">
          <Input
            label="Nom du poste"
            value={registerForm.name}
            onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
            placeholder="Ex: Caisse 1, Caisse Terrasse..."
            required
          />
          <Input
            label="Emplacement (optionnel)"
            value={registerForm.location}
            onChange={e => setRegisterForm({ ...registerForm, location: e.target.value })}
            placeholder="Ex: Entrée, Bar, Terrasse..."
          />
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Type de caisse</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.entries(CASH_REGISTER_TYPES) as [string, any][]).map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, type: key as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    registerForm.type === key
                      ? `bg-stone-900 border-stone-900 text-white shadow-md`
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold block text-sm">{type.label}</span>
                  <span className="text-[10px] opacity-80 block">
                    {key === 'sales' && 'Vente (Encaisser)'}
                    {key === 'delivery' && 'Livraison (Livreurs)'}
                    {key === 'operating' && 'Fonctionnement (Dépenses)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsRegisterModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" isLoading={submitting} className="flex-1">
              {selectedRegister ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Open Session Modal */}
      <Modal 
        isOpen={isOpenSessionModalOpen} 
        onClose={() => setIsOpenSessionModalOpen(false)}
        title={`Ouvrir ${selectedRegister?.name || 'la caisse'}`}
      >
        <form onSubmit={handleOpenSession} className="space-y-6">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--primary-700)' }}>Poste de caisse</p>
            <p className="font-bold text-lg" style={{ color: 'var(--primary-900)' }}>{selectedRegister?.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fond de caisse initial</label>
            <MoneyCounter 
                initialCounts={moneyCount}
                onChange={(counts, total) => {
                    setMoneyCount(counts);
                    setOpeningBalance(total);
                }}
            />
            <p className="text-xs text-stone-500 mt-2 text-center">Comptez l'argent dans la caisse avant de commencer</p>
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsOpenSessionModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" isLoading={submitting} className="flex-1">
              <PlayCircle className="w-4 h-4 mr-2" />
              Ouvrir la caisse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Session Modal */}
      <Modal 
        isOpen={isCloseSessionModalOpen} 
        onClose={() => setIsCloseSessionModalOpen(false)}
        title="Clôturer la caisse"
      >
        <form onSubmit={handleCloseSession} className="space-y-6">
          {selectedSession && (
            <>
              {/* Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-dashed">
                  <span className="text-stone-500">Fond initial</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedSession.summary?.openingBalance || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed">
                  <span className="text-green-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Entrées</span>
                  <span className="font-mono font-semibold text-green-600">+{formatCurrency(selectedSession.summary?.totalIncome || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dashed">
                  <span className="text-red-500 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> Sorties</span>
                  <span className="font-mono font-semibold text-red-500">-{formatCurrency(selectedSession.summary?.totalExpense || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-stone-100 rounded-lg px-3">
                  <span className="font-bold text-stone-900">Solde attendu</span>
                  <span className="font-mono font-black text-lg">{formatCurrency(selectedSession.summary?.currentBalance || 0)}</span>
                </div>
              </div>

              {/* Declared Balance & Billetage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billetage (Comptage Caisse)</label>
                

                
                <MoneyCounter 
                    initialCounts={moneyCount}
                    onChange={(counts, total) => {
                        setMoneyCount(counts);
                        setDeclaredBalance(total);
                    }}
                />
              </div>

              {/* Discrepancy Preview */}
              {declaredBalance !== (selectedSession.summary?.currentBalance || 0) && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  declaredBalance > (selectedSession.summary?.currentBalance || 0) 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {declaredBalance > (selectedSession.summary?.currentBalance || 0) 
                    ? <TrendingUp className="w-4 h-4" /> 
                    : <TrendingDown className="w-4 h-4" />
                  }
                  <span>
                    Écart: {declaredBalance - (selectedSession.summary?.currentBalance || 0) > 0 ? '+' : ''}
                    {formatCurrency(declaredBalance - (selectedSession.summary?.currentBalance || 0))}
                  </span>
                </div>
              )}

              <Input
                label="Notes (optionnel)"
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                placeholder="Remarques sur la session..."
              />
            </>
          )}
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsCloseSessionModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" variant="danger" isLoading={submitting} className="flex-1">
              <StopCircle className="w-4 h-4 mr-2" />
              Clôturer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Session Details Modal */}
      <Modal 
        isOpen={isSessionDetailsModalOpen} 
        onClose={() => setIsSessionDetailsModalOpen(false)}
        title={`Détails session - ${selectedSession?.cashRegister?.name || 'Caisse'}`}
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Status */}
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              selectedSession.status === 'open' ? 'bg-green-50' : 'bg-stone-100'
            }`}>
              {selectedSession.status === 'open' 
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : <XCircle className="w-5 h-5 text-stone-500" />
              }
              <div>
                <p className="font-bold">{selectedSession.status === 'open' ? 'Session en cours' : 'Session fermée'}</p>
                <p className="text-sm text-stone-600">
                  Ouverte par {selectedSession.opener?.fullName} à {new Date(selectedSession.openedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-500 mb-1">Entrées</p>
                <p className="font-mono font-bold text-green-600 text-lg">
                  +{formatCurrency(selectedSession.summary?.totalIncome || 0)}
                </p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-500 mb-1">Sorties</p>
                <p className="font-mono font-bold text-red-500 text-lg">
                  -{formatCurrency(selectedSession.summary?.totalExpense || 0)}
                </p>
              </div>
              
              {/* Change Given Stat */}
              <div className="bg-orange-50 rounded-xl p-4 text-center col-span-2">
                <p className="text-xs text-orange-600 mb-1 font-bold uppercase tracking-wide">Total Monnaie Rendue</p>
                <p className="font-mono font-bold text-orange-700 text-lg">
                  {formatCurrency(selectedSession.movements?.reduce((acc: number, m: any) => acc + Number(m.changeGiven || 0), 0) || 0)}
                </p>
                <p className="text-[10px] text-orange-400 mt-1">Non comptabilisé en "Sortie" (déjà déduit des Entrées)</p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-stone-900 text-white rounded-xl p-4 text-center">
              <p className="text-xs text-stone-400 mb-1">Solde actuel</p>
              <p className="font-mono font-black text-2xl">
                {formatCurrency(selectedSession.summary?.currentBalance || 0)}
              </p>
            </div>

            {/* Movements List */}
            {selectedSession.movements && selectedSession.movements.length > 0 && (
              <div>
                <h4 className="font-bold text-sm text-stone-500 mb-2 uppercase tracking-wide">
                  Mouvements ({selectedSession.movements.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedSession.movements.map((mv: any) => (
                    <div key={mv.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {mv.type === 'income' 
                          ? <TrendingUp className="w-4 h-4 text-green-500" />
                          : <TrendingDown className="w-4 h-4 text-red-500" />
                        }
                        <div>
                          <p className="text-sm font-medium text-stone-800">{mv.description || mv.category}</p>
                          <p className="text-xs text-stone-500">{new Date(mv.createdAt).toLocaleTimeString('fr-FR')}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${mv.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {mv.type === 'income' ? '+' : '-'}{formatCurrency(mv.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="pt-2">
                <Button 
                    variant="ghost" 
                    className="w-full border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    onClick={async () => {
                        try {
                            const response = await api.get(`/admin/cash/sessions/${selectedSession.id}/export`, {
                                responseType: 'blob'
                            });
                            
                            // Create download link
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `journal_caisse_${selectedSession.id}.csv`); // Filename
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                        } catch (e) {
                            alert('Erreur lors du téléchargement');
                        }
                    }}
                >
                    <Receipt className="w-4 h-4 mr-2" />
                    Exporter le Journal de Caisse (CSV/Excel)
                </Button>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setIsSessionDetailsModalOpen(false)}>
              Fermer
            </Button>
          </div>
        )}
      </Modal>
      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historique - ${selectedRegister?.name || 'Caisse'}`}
      >
        <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
                {loadingHistory ? (
                    <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                ) : historySessions.length === 0 ? (
                    <div className="text-center py-8 text-stone-500">Aucune session clôturée pour cette caisse.</div>
                ) : (
                    historySessions.map((session: any) => (
                        <div key={session.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-stone-900">
                                        {new Date(session.openedAt).toLocaleDateString('fr-FR')} 
                                        <span className="text-stone-400 font-normal mx-2">|</span>
                                        {new Date(session.openedAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})} - {session.closedAt ? new Date(session.closedAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : 'En cours'}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        Ouv: {session.opener?.fullName} • Ferm: {session.closer?.fullName || '-'}
                                    </p>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${session.discrepancy !== 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {session.discrepancy !== 0 ? `Écart: ${formatCurrency(session.discrepancy)}` : 'OK'}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-100">
                                <span className="font-mono font-bold text-stone-700">{formatCurrency(session.declaredBalance || 0)}</span>
                                <div className="flex gap-2">
                                     <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={async () => {
                                            try {
                                                const response = await api.get(`/admin/cash/sessions/${session.id}/export`, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `journal_caisse_${session.id}.csv`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                            } catch (e) { alert('Erreur téléchargement'); }
                                        }}
                                    >
                                        <Receipt className="w-3 h-3 mr-1" />
                                        Export
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => loadSessionDetails(session.id)}>
                                        Détails
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <Button variant="secondary" className="w-full" onClick={() => setIsHistoryModalOpen(false)}>
                Fermer
            </Button>
        </div>
      </Modal>
      {/* Add Movement Modal */}
      <Modal
        isOpen={isAddMovementModalOpen}
        onClose={() => setIsAddMovementModalOpen(false)}
        title={`Nouveau Mouvement - ${selectedRegister?.name}`}
      >
        <form onSubmit={handleAddMovement} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Type de mouvement</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setMovementForm({...movementForm, type: 'income'})}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                            movementForm.type === 'income' 
                            ? 'bg-green-600 text-white border-green-600 shadow-md' 
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                    >
                        <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                        Encaissement
                    </button>
                    <button
                        type="button"
                        onClick={() => setMovementForm({...movementForm, type: 'expense'})}
                        className={`p-3 rounded-xl border text-center font-bold transition-all ${
                            movementForm.type === 'expense' 
                            ? 'bg-red-500 text-white border-red-500 shadow-md' 
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                    >
                        <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                        Décaissement
                    </button>
                </div>
            </div>

            <Input
                label="Montant"
                type="number"
                value={movementForm.amount}
                onChange={e => setMovementForm({...movementForm, amount: parseFloat(e.target.value)})}
                required
                min={0}
            />

            <Input
                label="Description / Motif"
                value={movementForm.description}
                onChange={e => setMovementForm({...movementForm, description: e.target.value})}
                required
                placeholder="Ex: Achat fournitures, Versement banque..."
            />

            {movementForm.type === 'expense' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Catégorie Comptable / Compte</label>
                        <select
                            value={movementForm.accountingAccount}
                            onChange={e => setMovementForm({...movementForm, accountingAccount: e.target.value})}
                            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">-- Sélectionner (Facultatif) --</option>
                            <option value="601">601 - Achats Marchandises</option>
                            <option value="602">602 - Achats Matières Premières</option>
                            <option value="604">604 - Achats d'études et prestations</option>
                            <option value="605">605 - Autres achats (Fournitures bureau)</option>
                            <option value="612">612 - Transports</option>
                            <option value="622">622 - Honoraires</option>
                            <option value="625">625 - Déplacements & Missions</option>
                            <option value="630">630 - Services bancaires</option>
                            <option value="401">401 - Fournisseurs (Règlement dette)</option>
                            <option value="650">650 - Autres charges</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Justificatif (Image/PDF)</label>
                        <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={e => setMovementForm({...movementForm, proofFile: e.target.files ? e.target.files[0] : null})}
                            className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                    </div>
                </>
            )}

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsAddMovementModalOpen(false)} className="flex-1">
                    Annuler
                </Button>
                <Button type="submit" isLoading={submitting} className="flex-1">
                    Enregistrer
                </Button>
            </div>
        </form>
      </Modal>
      {/* Audit Modal (Contrôle de Caisse) */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Contrôle de Caisse - ${selectedRegister?.name}`}
      >
        <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-1" />
                    Comptez l'argent physique en caisse. Si le montant diffère du théorique, un mouvement de régularisation sera créé.
                </p>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium text-stone-600">Solde Théorique</span>
                <span className="font-bold text-xl">{formatCurrency(declaredBalance || 0)}</span>
            </div>

            <Input
                label="Montant Réel Constaté"
                type="number"
                value={auditForm.realAmount}
                onChange={e => {
                    const val = parseFloat(e.target.value);
                    setAuditForm({...auditForm, realAmount: val});
                }}
                required
            />

            {auditForm.realAmount !== declaredBalance && (
                <div className={`p-3 rounded-lg text-center font-bold ${
                    (auditForm.realAmount - (declaredBalance || 0)) > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                    Ecart : {formatCurrency(auditForm.realAmount - (declaredBalance || 0))}
                </div>
            )}

            <Input
                label="Commentaire / Justification"
                value={auditForm.notes}
                onChange={e => setAuditForm({...auditForm, notes: e.target.value})}
                placeholder="Raison de l'écart (ex: Erreur de rendu monnaie, Oubli saisie...)"
            />

            <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)} className="flex-1">
                    Annuler
                </Button>
                <Button onClick={handleSaveAudit} isLoading={submitting} className="flex-1">
                    Valider le Contrôle
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
