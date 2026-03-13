// @ts-nocheck
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
  CheckCircle, XCircle, TrendingUp, TrendingDown, Receipt, Info, ShieldCheck, ChevronRight, Eye, Download
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from 'sonner';

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

const CASH_REGISTER_TYPES = {
  sales: { label: 'Vente', color: 'bg-emerald-500', text: 'Encaisser les commandes' },
  delivery: { label: 'Livraison', color: 'bg-blue-500', text: 'Livreurs & Coursiers' },
  operating: { label: 'Fonctionnement', color: 'bg-orange-500', text: 'Dépenses & Achats' },
};

interface CashSession {
  id: number;
  cashRegisterId: number;
  openingBalance: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
}

export default function CashPage() {
  const { data: registersData, loading: loadingRegisters, refetch: refetchRegisters } =
    useFetch<{ data: CashRegister[] }>('/admin/cash/registers');

  const { data: openSessionsData, refetch: refetchOpenSessions } =
    useFetch<{ data: CashSession[] }>('/admin/cash/sessions/current');

  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false);

  const [registerForm, setRegisterForm] = useState({ name: '', location: '', type: 'sales' });
  const [openingBalance, setOpeningBalance] = useState(0);
  const [declaredBalance, setDeclaredBalance] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [moneyCount, setMoneyCount] = useState<Record<number, number>>({});

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const registers = registersData?.data || [];
  const openSessions = openSessionsData?.data || [];

  const { isRegisterLimitReached, planName } = useSubscription();

  const [isAddMovementModalOpen, setIsAddMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    description: '',
    accountingAccount: '',
    proofFile: null as File | null
  });

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
      toast.success('Mouvement enregistré');
      refetchRegisters();
      refetchOpenSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur technique');
    } finally {
      setSubmitting(false);
    }
  };

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({ realAmount: 0, notes: '' });

  const handleSaveAudit = async () => {
    if (!selectedRegister || !selectedRegister.currentSession) return;
    const theoretical = declaredBalance || 0;
    const diff = auditForm.realAmount - theoretical;

    if (diff === 0) {
      toast.success("Caisse parfaitement équilibrée");
      setIsAuditModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/cash/movements', {
        cashSessionId: selectedRegister.currentSession.id,
        type: diff > 0 ? 'income' : 'expense',
        category: 'adjustment',
        amount: Math.abs(diff),
        description: `Régularisation suite contrôle: ${auditForm.notes || 'Sans note'}`
      });
      toast.success(`Ecart régularisé (${formatCurrency(diff)})`);
      setIsAuditModalOpen(false);
      refetchRegisters();
      refetchOpenSessions();
    } catch {
      toast.error('Erreur technique');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSessionDetails = async (sessionId: number) => {
    try {
      const res = await api.get(`/admin/cash/sessions/${sessionId}`);
      setSelectedSession(res.data.data);
      setIsSessionDetailsModalOpen(true);
    } catch {
      toast.error('Chargement impossible');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 lg:px-8">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 pointer-events-none"></div>

        <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <Banknote className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Caisse & Trésorerie</h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
              {registers.length} Postes Actifs • Suivi des flux réels
            </p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => {
              if (isRegisterLimitReached(registers.length)) return toast.error(`Limite plan ${planName} atteinte`);
              setSelectedRegister(null);
              setRegisterForm({ name: '', location: '', type: 'sales' });
              setIsRegisterModalOpen(true);
            }}
            className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Poste</span>
          </button>
        </div>
      </div>

      {/* Alerts - High End */}
      {openSessions.length > 0 && (
        <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-[2rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm text-orange-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-orange-900 font-black text-sm uppercase tracking-tight">{openSessions.length} SESSION(S) EN COURS</h3>
              <p className="text-orange-600/70 text-[10px] font-bold uppercase tracking-widest mt-1">N'oubliez pas de clôturer vos caisses en fin de service</p>
            </div>
          </div>
          <div className="hidden md:flex -space-x-3">
            {openSessions.map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-orange-200"></div>
            ))}
          </div>
        </div>
      )}

      {/* Grid - Surgical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {registers.sort((a, b) => b.hasOpenSession - a.hasOpenSession).map((reg, idx) => (
          <div key={reg.id} className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>

            {/* Visual Accent */}
            <div className={cn("h-2 w-full", CASH_REGISTER_TYPES[reg.type]?.color)}></div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest block w-fit mb-3", CASH_REGISTER_TYPES[reg.type]?.color, "bg-opacity-10 text-stone-900")}>
                    {CASH_REGISTER_TYPES[reg.type]?.label}
                  </span>
                  <h3 className="text-xl font-black text-stone-900 tracking-tight leading-none uppercase font-display">{reg.name}</h3>
                  {reg.location && <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2">{reg.location}</p>}
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-1000",
                  reg.hasOpenSession ? "bg-emerald-500 animate-pulse shadow-emerald-200" : "bg-stone-200"
                )}></div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center py-4">
                {reg.hasOpenSession && reg.currentSession ? (
                  <div className="text-center w-full">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">SOLDE INDICATIF</p>
                    <p className="text-3xl font-black text-stone-900 font-display tracking-tight">
                      {formatCurrency(reg.currentSession.currentBalance)}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-4 bg-stone-50 py-3 px-4 rounded-[1.25rem] border border-stone-100/50">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-stone-300" />
                        <span className="text-[10px] font-black text-stone-500 uppercase truncate max-w-[80px]">{reg.currentSession.openedBy}</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-stone-300" />
                        <span className="text-[10px] font-black text-stone-500">{new Date(reg.currentSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
                    <div className="bg-stone-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4">
                      <StopCircle className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Poste Inactif / Fermé</p>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-stone-100 grid grid-cols-2 gap-3">
                {reg.hasOpenSession ? (
                  <>
                    <button
                      onClick={() => reg.currentSession && loadSessionDetails(reg.currentSession.id)}
                      className="h-14 bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95"
                    >
                      Détails
                    </button>
                    {reg.type === 'operating' ? (
                      <button
                        onClick={() => { setSelectedRegister(reg); setIsAddMovementModalOpen(true); }}
                        className="h-14 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-stone-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Flux
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const res = await api.get(`/admin/cash/sessions/${reg.currentSession.id}`);
                          setSelectedSession(res.data.data);
                          setDeclaredBalance(res.data.data.summary.currentBalance);
                          setIsCloseSessionModalOpen(true);
                        }}
                        className="h-14 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-red-200 transition-all active:scale-95"
                      >
                        Clôturer
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => { setSelectedRegister(reg); setMoneyCount({}); setIsOpenSessionModalOpen(true); }}
                    className={cn(
                      "col-span-2 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3",
                      reg.type === 'sales' ? "bg-emerald-600 text-white shadow-emerald-100" :
                        reg.type === 'delivery' ? "bg-blue-600 text-white shadow-blue-100" : "bg-orange-600 text-white shadow-orange-100"
                    )}
                  >
                    <PlayCircle className="w-5 h-5" />
                    Ouvrir le Poste
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal - Premium Pass */}
      <Modal isOpen={isSessionDetailsModalOpen} onClose={() => setIsSessionDetailsModalOpen(false)} title="Synchro Session">
        {selectedSession && (
          <div className="space-y-8 pt-4">
            <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-stone-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_50%)]"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Etat de Session</p>
                  <h3 className="text-3xl font-black font-display tracking-tight uppercase">
                    {selectedSession.status === 'open' ? 'Actif' : 'Clôturé'}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Solde Actuel</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(selectedSession.summary.currentBalance)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">TOTAL ENTRÉES</p>
                <p className="text-xl font-black text-emerald-900">+{formatCurrency(selectedSession.summary.totalIncome)}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">TOTAL SORTIES</p>
                <p className="text-xl font-black text-red-900">-{formatCurrency(selectedSession.summary.totalExpense)}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Chronologie des Flux</h4>
                <span className="text-[9px] font-bold text-stone-400 uppercase bg-stone-50 px-3 py-1 rounded-full">{selectedSession.movements?.length || 0} MVTS</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {selectedSession.movements?.length > 0 ? (
                  <div className="divide-y divide-stone-50">
                    {selectedSession.movements.map((mv: any) => (
                      <div key={mv.id} className="p-5 flex justify-between items-center hover:bg-stone-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", mv.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                            {mv.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-stone-900 text-[11px] uppercase tracking-tight truncate max-w-[150px] leading-none mb-1.5">{mv.description || mv.category}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{new Date(mv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <span className={cn("font-black text-xs", mv.type === 'income' ? "text-emerald-600" : "text-red-500")}>
                          {mv.type === 'income' ? '+' : '-'}{formatCurrency(mv.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest italic">Aucun mouvement enregistré</div>
                )}
              </div>
            </div>

            <button onClick={() => setIsSessionDetailsModalOpen(false)} className="w-full h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200 active:scale-95 transition-all">Fermer</button>
          </div>
        )}
      </Modal>

      {/* Close Session Modal */}
      <Modal isOpen={isCloseSessionModalOpen} onClose={() => setIsCloseSessionModalOpen(false)} title="Fermeture de Caisse">
        {selectedSession && (
          <div className="space-y-8 pt-4">
            <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,165,0,0.1),transparent_50%)]"></div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">
                  <span>Solde Théorique (Logiciel)</span>
                  <span>{formatCurrency(selectedSession.summary.currentBalance)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-stone-300 uppercase tracking-widest">Écart Réel</span>
                  <span className={cn(
                    "text-3xl font-black font-display tracking-tight",
                    (declaredBalance - selectedSession.summary.currentBalance) === 0 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {formatCurrency(declaredBalance - selectedSession.summary.currentBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-6 text-center">Billetage de Clôture</h4>
              <MoneyCounter
                initialCounts={moneyCount}
                onChange={(counts, total) => { setMoneyCount(counts); setDeclaredBalance(total); }}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Notes Finales (Optionnel)</label>
              <textarea
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                placeholder="REMARQUES SUR LES ÉCARTS, VOLS OU ERREURS..."
                className="w-full h-24 bg-white rounded-[1.5rem] border-stone-100 focus:ring-4 focus:ring-stone-50 font-black text-[10px] p-5 uppercase tracking-widest transition-all resize-none shadow-sm"
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsCloseSessionModalOpen(false)} className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">Annuler</button>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await api.post(`/admin/cash/sessions/${selectedSession.id}/close`, { declaredBalance, notes: closeNotes, closingCashBreakdown: moneyCount });
                    setIsCloseSessionModalOpen(false);
                    toast.success("Caisse clôturée avec succès");
                    refetchRegisters(); refetchOpenSessions();
                  } catch { toast.error("Erreur technique"); }
                  finally { setSubmitting(false); }
                }}
                className="flex-1 h-14 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200 active:scale-95 transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Register Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Architecture Caisse">
        <div className="space-y-8 pt-4">
          <div className="space-y-4">
            <Input label="DESIGNATION DU POSTE" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="EX: CAISSE PRINCIPALE, BAR, TERRASSE..." className="h-14 font-black uppercase tracking-widest text-[11px]" />
            <Input label="LOCALISATION PHYSIQUE" value={registerForm.location} onChange={e => setRegisterForm({ ...registerForm, location: e.target.value })} placeholder="SITUATION DANS L'ÉTABLISSEMENT" className="h-14 font-black uppercase tracking-widest text-[11px]" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">SEGMENT D'ACTIVITÉ</label>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(CASH_REGISTER_TYPES).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setRegisterForm({ ...registerForm, type: k })}
                  className={cn(
                    "p-6 rounded-[1.5rem] border text-left transition-all relative overflow-hidden group",
                    registerForm.type === k ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white text-stone-600 border-stone-100 hover:border-stone-200"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h5 className="font-black text-sm uppercase tracking-tight leading-none mb-1.5">{v.label}</h5>
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest", registerForm.type === k ? "text-stone-400" : "text-stone-400")}>{v.text}</p>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", registerForm.type === k ? "bg-white/10" : "bg-stone-50")}>
                      <ChevronRight className={cn("w-4 h-4 transition-transform", registerForm.type === k ? "rotate-90" : "")} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                if (selectedRegister) await api.patch(`/admin/cash/registers/${selectedRegister.id}`, registerForm);
                else await api.post('/admin/cash/registers', registerForm);
                setIsRegisterModalOpen(false);
                toast.success("Poste enregistré");
                refetchRegisters();
              } catch { toast.error("Erreur technique"); }
              finally { setSubmitting(false); }
            }}
            className="w-full h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-stone-200 active:scale-95 transition-all mt-4"
          >
            {selectedRegister ? 'MODIFIER LE POSTE' : 'CRÉER LE POSTE'}
          </button>
        </div>
      </Modal>

      {/* Open Session Modal */}
      <Modal isOpen={isOpenSessionModalOpen} onClose={() => setIsOpenSessionModalOpen(false)} title="Initialisation Service">
        <div className="space-y-8 pt-4">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Activation Poste</p>
              <h3 className="text-3xl font-black font-display tracking-tight uppercase">{selectedRegister?.name}</h3>
            </div>
          </div>

          <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-6 text-center">Comptage Fond de Caisse</h4>
            <MoneyCounter
              initialCounts={moneyCount}
              onChange={(counts, total) => { setMoneyCount(counts); setOpeningBalance(total); }}
            />
          </div>

          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                await api.post('/admin/cash/sessions/open', { cashRegisterId: selectedRegister.id, openingBalance, openingCashBreakdown: moneyCount });
                setIsOpenSessionModalOpen(false);
                toast.success("Session lancée");
                refetchRegisters(); refetchOpenSessions();
              } catch { toast.error("Erreur technique"); }
              finally { setSubmitting(false); }
            }}
            className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-100 active:scale-95 transition-all"
          >
            OUVRIR LA CAISSE ({formatCurrency(openingBalance)})
          </button>
        </div>
      </Modal>

      {/* Add Movement Modal */}
      <Modal isOpen={isAddMovementModalOpen} onClose={() => setIsAddMovementModalOpen(false)} title="Flux de Trésorerie">
        <form onSubmit={handleAddMovement} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setMovementForm({ ...movementForm, type: 'income' })} className={cn("h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all", movementForm.type === 'income' ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-inner" : "bg-white text-stone-400 border-stone-100")}>ENTRÉE (+)</button>
            <button type="button" onClick={() => setMovementForm({ ...movementForm, type: 'expense' })} className={cn("h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all", movementForm.type === 'expense' ? "bg-red-50 text-red-600 border-red-200 shadow-inner" : "bg-white text-stone-400 border-stone-100")}>SORTIE (-)</button>
          </div>

          <Input label="MOTIF DU FLUX" value={movementForm.description} onChange={e => setMovementForm({ ...movementForm, description: e.target.value })} required className="h-14 font-black uppercase tracking-widest text-xs" />
          <Input label="MONTANT RÉEL (FCFA)" type="number" value={movementForm.amount || ''} onChange={e => setMovementForm({ ...movementForm, amount: Number(e.target.value) })} required className="h-14 font-black uppercase tracking-widest text-xs" />

          <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100/50">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2 mb-3 block">Justificatif (Scan/Photo)</label>
            <input type="file" onChange={e => setMovementForm({ ...movementForm, proofFile: e.target.files?.[0] || null })} className="w-full text-[10px] font-black text-stone-900 border-spacing-2" />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsAddMovementModalOpen(false)} className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</button>
            <button type="submit" disabled={submitting} className="flex-1 h-14 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200">{submitting ? 'VALIDATION...' : 'ENREGISTRER'}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
