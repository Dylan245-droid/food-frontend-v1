// @ts-nocheck
import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import {
  BookOpen, Eye, Loader2, ChevronDown, ChevronRight, FileText, Plus, Download, Calendar, BarChart3, ListTree
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'sonner';

interface Account {
  id: number;
  code: string;
  label: string;
  class: number;
  type: string;
  normalBalance: string;
}

interface AccountingEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference: string | null;
  operationType: string;
  isValidated: boolean;
  lines: AccountingLine[];
  creator?: { fullName: string };
}

interface AccountingLine {
  id: number;
  label: string | null;
  debitAmount: number;
  creditAmount: number;
  account: Account;
}

interface LedgerEntry {
  account: { code: string; label: string; class: number };
  movements: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'ledger' | 'balance' | 'chart'>('journal');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: journalData, loading: loadingJournal } =
    useFetch<any>(`/admin/accounting/journal?startDate=${startDate}&endDate=${endDate}`);
  const { data: ledgerData, loading: loadingLedger } =
    useFetch<any>(`/admin/accounting/ledger?startDate=${startDate}&endDate=${endDate}`);
  const { data: balanceData, loading: loadingBalance } =
    useFetch<any>(`/admin/accounting/balance?endDate=${endDate}`);
  const { data: chartData, loading: loadingChart } =
    useFetch<any>('/admin/accounting/chart');

  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const entries = journalData?.data || [];
  const ledger = ledgerData?.data || [];
  const balance = balanceData?.data || [];
  const chart = chartData?.data || [];

  const viewEntry = async (entry: AccountingEntry) => {
    try {
      const res = await api.get(`/admin/accounting/entries/${entry.id}`);
      setSelectedEntry(res.data.data);
      setIsDetailsModalOpen(true);
    } catch {
      toast.error('Chargement impossible');
    }
  };

  const toggleClass = (cls: number) => {
    setExpandedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const groupedChart: Record<number, Account[]> = {};
  for (const account of chart) {
    if (!groupedChart[account.class]) groupedChart[account.class] = [];
    groupedChart[account.class].push(account);
  }

  const classLabels: Record<number, string> = {
    1: 'CAPITAUX PROPRES', 2: 'IMMOBILISATIONS', 3: 'STOCKS', 4: 'TIERS', 5: 'TRÉSORERIE', 6: 'CHARGES', 7: 'PRODUITS', 8: 'COMPTES SPÉCIAUX',
  };

  const loading = loadingJournal || loadingLedger || loadingBalance || loadingChart;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 lg:px-8">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-20 pointer-events-none"></div>

        <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Comptabilité</h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
              Système SYSCOHADA • {chart.length} Comptes Actifs
            </p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => setIsNewEntryModalOpen(true)}
            className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Ecriture Manuelle</span>
          </button>
        </div>
      </div>

      {/* Tabs - Premium Pills */}
      <div className="bg-stone-50/50 p-2 rounded-[2rem] border border-stone-100 shadow-inner flex gap-2 overflow-x-auto premium-scrollbar pb-4">
        {[
          { id: 'journal', label: 'JOURNAL', icon: ListTree },
          { id: 'ledger', label: 'GRAND LIVRE', icon: BookOpen },
          { id: 'balance', label: 'BALANCE', icon: BarChart3 },
          { id: 'chart', label: 'PLAN COMPTABLE', icon: ListTree },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-3 transition-all duration-300",
                activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-md shadow-stone-200/50 scale-[1.02] border border-stone-100"
                  : "text-stone-400 hover:text-stone-600 hover:bg-white/50"
              )}
            >
              <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-orange-500" : "text-stone-300")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filters pass only for data tabs */}
      {activeTab !== 'chart' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="md:col-span-5 relative z-10 w-full">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-2 block">PÉRIODE DE DÉBUT</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-14 pl-12 pr-6 bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[11px] uppercase tracking-widest shadow-inner" />
            </div>
          </div>
          <div className="md:col-span-1 flex items-center justify-center pb-5 relative z-10">
            <ChevronRight className="w-4 h-4 text-stone-200 hidden md:block" />
          </div>
          <div className="md:col-span-5 relative z-10 w-full">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-2 block">PÉRIODE DE FIN</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-14 pl-12 pr-6 bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-black text-[11px] uppercase tracking-widest shadow-inner" />
            </div>
          </div>
          <div className="md:col-span-1 relative z-10">
            <button
              onClick={() => {/* Export CSV Logic */ }}
              className="w-full h-14 bg-stone-900 flex items-center justify-center rounded-2xl text-white shadow-lg active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 animate-in fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-stone-200" />
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Synchro Comptable en cours...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">

            {activeTab === 'journal' && (
              <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100">
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">N° Pièce</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Description</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Débit (FCFA)</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Crédit (FCFA)</th>
                        <th className="p-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {entries.map((entry: any, i) => {
                        const totD = entry.lines?.reduce((s, l) => s + l.debitAmount, 0) || 0;
                        const totC = entry.lines?.reduce((s, l) => s + l.creditAmount, 0) || 0;
                        return (
                          <tr key={entry.id} className="hover:bg-stone-50 group transition-all">
                            <td className="p-6">
                              <span className="font-black text-stone-900 text-sm tracking-tight font-display">{entry.entryNumber}</span>
                            </td>
                            <td className="p-6 text-[11px] font-bold text-stone-500 uppercase">{new Date(entry.entryDate).toLocaleDateString()}</td>
                            <td className="p-6">
                              <div className="font-black text-stone-800 text-xs uppercase tracking-tight">{entry.description}</div>
                              {entry.reference && <div className="text-[9px] text-stone-400 font-bold uppercase mt-1">Ref: {entry.reference}</div>}
                            </td>
                            <td className="p-6 text-right font-black text-stone-900 text-sm">{formatCurrency(totD)}</td>
                            <td className="p-6 text-right font-black text-stone-900 text-sm">{formatCurrency(totC)}</td>
                            <td className="p-6 text-right">
                              <button onClick={() => viewEntry(entry)} className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm active:scale-95">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {entries.length === 0 && (
                        <tr><td colSpan={6} className="p-24 text-center text-[10px] font-black text-stone-300 uppercase tracking-widest italic">Vide sur cette période</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ledger.filter(l => l.movements > 0).map((item, i) => (
                  <div key={item.account.code} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 transition-colors group-hover:bg-stone-100"></div>
                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-3xl font-black font-display text-stone-900 mb-1">{item.account.code}</h3>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{item.account.label}</p>
                      </div>
                      <div className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-stone-200">
                        {item.movements} Mvts
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/50">
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Mvt Débit</p>
                        <p className="font-black text-stone-900 text-sm">{formatCurrency(item.totalDebit)}</p>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/50">
                        <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Mvt Crédit</p>
                        <p className="font-black text-stone-900 text-sm">{formatCurrency(item.totalCredit)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "p-5 rounded-[1.5rem] flex justify-between items-center",
                      item.balance >= 0 ? "bg-emerald-500 text-white shadow-xl shadow-emerald-900/10" : "bg-red-500 text-white shadow-xl shadow-red-900/10"
                    )}>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Solde Net</span>
                      <span className="text-xl font-black font-display tracking-tight">{formatCurrency(Math.abs(item.balance))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'balance' && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                {balanceData?.totals && (
                  <div className="bg-stone-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-stone-200 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.1),transparent_50%)]"></div>
                    <div className="relative z-10 space-y-2 text-center md:text-left">
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Balance Équilibrée ?</p>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-4", balanceData.totals.balanced ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-red-500 bg-red-500/10 text-red-500")}>
                          {balanceData.totals.balanced ? '✓' : '✗'}
                        </div>
                        <h2 className="text-4xl font-black font-display tracking-tight uppercase">
                          {balanceData.totals.balanced ? 'EN ÉQUILIBRE' : 'DÉSÉQUILIBRÉE'}
                        </h2>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-12 text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Mvt Débit Total</p>
                        <p className="text-3xl font-black font-display text-emerald-400">{formatCurrency(balanceData.totals.debit)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Mvt Crédit Total</p>
                        <p className="text-3xl font-black font-display text-orange-400">{formatCurrency(balanceData.totals.credit)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Fascicule / Code</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Intitulé du Compte</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Débit</th>
                        <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Crédit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {balance.map((item: any, i) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="p-6 font-black text-stone-900 text-sm font-display tracking-tight">{item.code}</td>
                          <td className="p-6 text-[11px] font-black text-stone-500 uppercase tracking-wider">{item.label}</td>
                          <td className="p-6 text-right font-black text-stone-800 text-xs">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</td>
                          <td className="p-6 text-right font-black text-stone-800 text-xs">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'chart' && (
              <div className="grid grid-cols-1 gap-4">
                {Object.keys(groupedChart).sort().map(classNum => (
                  <div key={classNum} className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden group">
                    <button onClick={() => toggleClass(Number(classNum))} className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors text-left uppercase">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-stone-200">
                          {classNum}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 tracking-tight leading-none">{classLabels[Number(classNum)] || 'AUTRES COMPTES'}</h3>
                          <p className="text-[9px] font-bold text-stone-400 tracking-widest mt-1.5">{groupedChart[Number(classNum)].length} COMPTES DANS CETTE CLASSE</p>
                        </div>
                      </div>
                      <div className={cn("w-10 h-10 rounded-xl border border-stone-100 flex items-center justify-center transition-transform", expandedClasses.includes(Number(classNum)) ? "rotate-180" : "")}>
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      </div>
                    </button>
                    {expandedClasses.includes(Number(classNum)) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-6 bg-stone-50/30 border-t border-stone-100">
                        {groupedChart[Number(classNum)].map((account: Account) => (
                          <div key={account.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between group/item hover:border-stone-900 transition-all">
                            <div className="min-w-0">
                              <span className="block font-black text-stone-900 text-xs font-display tracking-tight mb-1">{account.code}</span>
                              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-tight truncate leading-none">{account.label}</span>
                            </div>
                            <div className={cn("w-2 h-2 rounded-full", account.normalBalance === 'debit' ? "bg-emerald-400" : "bg-orange-400")}></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Consultation de Pièce">
        {selectedEntry && (
          <div className="space-y-8 pt-4">
            <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-stone-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Pièce Comptable</p>
                  <h3 className="text-3xl font-black font-display tracking-tight uppercase">{selectedEntry.entryNumber}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Date d'opération</p>
                  <p className="font-bold text-sm uppercase">{new Date(selectedEntry.entryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 space-y-6">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 block">OBJET DE L'ÉCRITURE</label>
                <p className="text-lg font-black text-stone-900 leading-tight uppercase tracking-tight">{selectedEntry.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-stone-200/50">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 block">RÉFÉRENCE</label>
                  <p className="font-bold text-sm uppercase text-stone-800">{selectedEntry.reference || 'AUCUNE'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 block">CATÉGORIE</label>
                  <p className="font-bold text-sm uppercase text-stone-800">{selectedEntry.operationType}</p>
                </div>
              </div>
            </div>

            <div className="border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-stone-100">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-stone-900 text-white">
                  <tr>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest">COMPTE / INTITULÉ</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right">DÉBIT</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right">CRÉDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {selectedEntry.lines?.map(line => (
                    <tr key={line.id}>
                      <td className="p-5">
                        <span className="block font-black text-stone-900 text-sm font-display mb-1">{line.account.code}</span>
                        <span className="block text-[10px] font-black text-stone-400 uppercase tracking-wide">{line.account.label}</span>
                      </td>
                      <td className="p-5 text-right font-black text-stone-900 text-xs">
                        {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                      </td>
                      <td className="p-5 text-right font-black text-stone-900 text-xs">
                        {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 font-black text-sm">
                  <tr>
                    <td className="p-8 text-[10px] tracking-widest uppercase">ÉQUILIBRE DE PIÈCE</td>
                    <td className="p-8 text-right text-emerald-600">
                      {formatCurrency(selectedEntry.lines?.reduce((s, l) => s + l.debitAmount, 0) || 0)}
                    </td>
                    <td className="p-8 text-right text-orange-600">
                      {formatCurrency(selectedEntry.lines?.reduce((s, l) => s + l.creditAmount, 0) || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button onClick={() => setIsDetailsModalOpen(false)} className="w-full h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200 active:scale-95 transition-all mt-4">Fermer</button>
          </div>
        )}
      </Modal>

      {/* New Entry Modal */}
      <Modal isOpen={isNewEntryModalOpen} onClose={() => setIsNewEntryModalOpen(false)} title="Générer Ecriture Manuelle">
        <NewEntryForm
          accounts={chart}
          onSuccess={() => { setIsNewEntryModalOpen(false); window.location.reload(); }}
          onCancel={() => setIsNewEntryModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function NewEntryForm({ accounts, onSuccess, onCancel }: { accounts: Account[]; onSuccess: () => void; onCancel: () => void; }) {
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [debitAccountId, setDebitAccountId] = useState<number | ''>('');
  const [creditAccountId, setCreditAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !debitAccountId || !creditAccountId || !amount) return toast.error('Veuillez remplir tous les champs');
    if (debitAccountId === creditAccountId) return toast.error('Comptes identiques interdits');

    setSubmitting(true);
    try {
      await api.post('/admin/accounting/entries', {
        description, reference, operationType: 'adjustment',
        lines: [
          { accountId: debitAccountId, debitAmount: amount, creditAmount: 0 },
          { accountId: creditAccountId, debitAmount: 0, creditAmount: amount },
        ],
      });
      onSuccess();
      toast.success("Ecriture validée");
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur technique');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <Input label="LIBELLÉ DE L'OPÉRATION" value={description} onChange={e => setDescription(e.target.value)} required className="h-14 font-black uppercase tracking-widest text-xs" />
      <Input label="RÉFÉRENCE PIÈCE (OPTIONNEL)" value={reference} onChange={e => setReference(e.target.value)} className="h-14 font-black uppercase tracking-widest text-xs" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">DÉBIT COMPTE</label>
          <select value={debitAccountId} onChange={e => setDebitAccountId(Number(e.target.value))} className="w-full h-14 bg-stone-50 rounded-2xl border-none font-black uppercase tracking-widest text-[9px] px-4 shadow-inner">
            <option value="">--- CHOISIR ---</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">CRÉDIT COMPTE</label>
          <select value={creditAccountId} onChange={e => setCreditAccountId(Number(e.target.value))} className="w-full h-14 bg-stone-50 rounded-2xl border-none font-black uppercase tracking-widest text-[9px] px-4 shadow-inner">
            <option value="">--- CHOISIR ---</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Input label="MONTANT TRANSACTION (FCFA)" type="number" min={1} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} required className="h-14 font-black uppercase tracking-widest text-xs" />

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 h-16 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</button>
        <button type="submit" disabled={submitting} className="flex-1 h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200">
          {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'VALIDER'}
        </button>
      </div>
    </form>
  );
}
