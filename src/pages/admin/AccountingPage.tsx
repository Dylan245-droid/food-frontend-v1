import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { 
  BookOpen, Eye, Loader2, ChevronDown, ChevronRight, FileText, Plus, Download
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

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
  // Tabs
  const [activeTab, setActiveTab] = useState<'journal' | 'ledger' | 'balance' | 'chart'>('journal');
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data fetching - all tabs fetch on mount, filter by activeTab on render
  const { data: journalData, loading: loadingJournal } = 
    useFetch<any>(`/admin/accounting/journal?startDate=${startDate}&endDate=${endDate}`);
  const { data: ledgerData, loading: loadingLedger } = 
    useFetch<any>(`/admin/accounting/ledger?startDate=${startDate}&endDate=${endDate}`);
  const { data: balanceData, loading: loadingBalance } = 
    useFetch<any>(`/admin/accounting/balance?endDate=${endDate}`);
  const { data: chartData, loading: loadingChart } = 
    useFetch<any>('/admin/accounting/chart');

  // State
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<number[]>([5, 6, 7]);

  const entries = journalData?.data || [];
  const ledger = ledgerData?.data || [];
  const balance = balanceData?.data || [];
  const chart = chartData?.data || [];

  // View entry details
  const viewEntry = async (entry: AccountingEntry) => {
    try {
      const res = await api.get(`/admin/accounting/entries/${entry.id}`);
      setSelectedEntry(res.data.data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      alert('Erreur lors du chargement');
    }
  };

  // Toggle class expansion
  const toggleClass = (cls: number) => {
    setExpandedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Group accounts by class
  const groupedChart: Record<number, Account[]> = {};
  for (const account of chart) {
    if (!groupedChart[account.class]) {
      groupedChart[account.class] = [];
    }
    groupedChart[account.class].push(account);
  }

  const classLabels: Record<number, string> = {
    1: 'Capitaux propres',
    2: 'Immobilisations',
    3: 'Stocks',
    4: 'Tiers',
    5: 'Trésorerie',
    6: 'Charges',
    7: 'Produits',
    8: 'Comptes spéciaux',
  };

  const loading = loadingJournal || loadingLedger || loadingBalance || loadingChart;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Comptabilité
          </h1>
          <p className="text-gray-500">Journal, Grand Livre et Balance - SYSCOHADA</p>
        </div>
        <div className="flex gap-2">
            {activeTab === 'journal' && (
                <Button 
                    variant="outline"
                    onClick={async () => {
                        try {
                            const params = new URLSearchParams({
                                startDate,
                                endDate,
                            });
                            
                            const response = await api.get(`/admin/accounting/export?${params}`, {
                                responseType: 'blob'
                            });
                            
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `journal_${startDate}_${endDate}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                        } catch (error) {
                            console.error('Export failed', error);
                            alert("Erreur lors de l'export");
                        }
                    }}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            )}
            <Button onClick={() => setIsNewEntryModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle écriture
            </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        {[
          { id: 'journal', label: 'Journal' },
          { id: 'ledger', label: 'Grand Livre' },
          { id: 'balance', label: 'Balance' },
          { id: 'chart', label: 'Plan Comptable' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-stone-900 text-white' 
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filters (not for chart) */}
      {activeTab !== 'chart' && (
        <div className="bg-white rounded-xl p-4 border border-stone-100 flex flex-wrap gap-4 items-end">
          <div className="w-36">
            <label className="block text-xs font-medium text-stone-500 mb-1">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2 px-3 border border-stone-200 rounded-lg text-sm"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-stone-500 mb-1">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2 px-3 border border-stone-200 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8" style={{ color: 'var(--primary)' }} />
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === 'journal' && !loading && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">N° Écriture</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Libellé</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Débit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Crédit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {entries.map((entry: AccountingEntry) => {
                  const totalDebit = entry.lines?.reduce((s, l) => s + l.debitAmount, 0) || 0;
                  const totalCredit = entry.lines?.reduce((s, l) => s + l.creditAmount, 0) || 0;
                  return (
                    <tr key={entry.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900">{entry.entryNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600">
                        {new Date(entry.entryDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-800">
                        {entry.description}
                        {entry.reference && (
                          <span className="block text-xs text-stone-400">Réf: {entry.reference}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-stone-600">
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-stone-600">
                        {formatCurrency(totalCredit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" className="p-2" onClick={() => viewEntry(entry)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-stone-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Aucune écriture sur cette période</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && !loading && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Compte</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Libellé</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-stone-500 uppercase">Mouvements</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Total Débit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Total Crédit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ledger.filter((l: LedgerEntry) => l.movements > 0).map((item: LedgerEntry) => (
                  <tr key={item.account.code} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{item.account.code}</td>
                    <td className="py-3 px-4 text-sm text-stone-600">{item.account.label}</td>
                    <td className="py-3 px-4 text-center text-sm text-stone-500">{item.movements}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{formatCurrency(item.totalDebit)}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{formatCurrency(item.totalCredit)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))}
                {ledger.filter((l: LedgerEntry) => l.movements > 0).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-stone-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Aucun mouvement sur cette période</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance Tab */}
      {activeTab === 'balance' && !loading && (
        <div className="space-y-4">
          {balanceData?.totals && (
            <div className={`p-4 rounded-xl flex items-center justify-between ${
              balanceData.totals.balanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="font-medium">Balance au {new Date(balanceData.asOf).toLocaleDateString('fr-FR')}</span>
              <div className="flex gap-8">
                <div>
                  <span className="text-xs text-stone-500">Total Débit</span>
                  <p className="font-mono font-bold">{formatCurrency(balanceData.totals.debit)}</p>
                </div>
                <div>
                  <span className="text-xs text-stone-500">Total Crédit</span>
                  <p className="font-mono font-bold">{formatCurrency(balanceData.totals.credit)}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    balanceData.totals.balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {balanceData.totals.balanced ? '✓ Équilibrée' : '✗ Déséquilibrée'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-stone-500 uppercase">Libellé</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Débit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-stone-500 uppercase">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {balance.map((item: any) => (
                  <tr key={item.code} className="hover:bg-stone-50">
                    <td className="py-2 px-4 font-mono text-sm">{item.code}</td>
                    <td className="py-2 px-4 text-sm text-stone-600">{item.label}</td>
                    <td className="py-2 px-4 text-right font-mono text-sm">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</td>
                    <td className="py-2 px-4 text-right font-mono text-sm">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'chart' && !loading && (
        <div className="space-y-4">
          {Object.keys(groupedChart).sort((a, b) => Number(a) - Number(b)).map(classNum => (
            <div key={classNum} className="bg-white rounded-xl border border-stone-100 overflow-hidden">
              <button
                onClick={() => toggleClass(Number(classNum))}
                className="w-full px-4 py-3 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <span className="font-bold text-stone-800">
                  Classe {classNum} - {classLabels[Number(classNum)] || 'Autres'}
                </span>
                {expandedClasses.includes(Number(classNum)) 
                  ? <ChevronDown className="w-5 h-5 text-stone-400" />
                  : <ChevronRight className="w-5 h-5 text-stone-400" />
                }
              </button>
              {expandedClasses.includes(Number(classNum)) && (
                <div className="divide-y divide-stone-50">
                  {groupedChart[Number(classNum)].map((account: Account) => (
                    <div key={account.id} className="px-4 py-2 flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <span className="font-mono font-bold text-stone-900 mr-3">{account.code}</span>
                        <span className="text-sm text-stone-600">{account.label}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        account.normalBalance === 'debit' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {account.normalBalance === 'debit' ? 'Débiteur' : 'Créditeur'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entry Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Écriture ${selectedEntry?.entryNumber || ''}`}
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-stone-500">Date</p>
                <p className="font-medium">{new Date(selectedEntry.entryDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-stone-500">Type</p>
                <p className="font-medium capitalize">{selectedEntry.operationType}</p>
              </div>
              <div className="col-span-2">
                <p className="text-stone-500">Libellé</p>
                <p className="font-medium">{selectedEntry.description}</p>
              </div>
            </div>

            {/* Lines */}
            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Lignes comptables</h4>
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left py-2 px-3">Compte</th>
                      <th className="text-right py-2 px-3">Débit</th>
                      <th className="text-right py-2 px-3">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedEntry.lines?.map(line => (
                      <tr key={line.id}>
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold">{line.account.code}</span>
                          <span className="text-stone-500 ml-2">{line.account.label}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-100 font-bold">
                    <tr>
                      <td className="py-2 px-3">TOTAL</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatCurrency(selectedEntry.lines?.reduce((s, l) => s + l.debitAmount, 0) || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatCurrency(selectedEntry.lines?.reduce((s, l) => s + l.creditAmount, 0) || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setIsDetailsModalOpen(false)}>
              Fermer
            </Button>
          </div>
        )}
      </Modal>

      {/* New Entry Modal */}
      <Modal 
        isOpen={isNewEntryModalOpen} 
        onClose={() => setIsNewEntryModalOpen(false)}
        title="Nouvelle écriture comptable"
      >
        <NewEntryForm 
          accounts={chart} 
          onSuccess={() => {
            setIsNewEntryModalOpen(false);
            window.location.reload();
          }}
          onCancel={() => setIsNewEntryModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// New Entry Form Component
function NewEntryForm({ 
  accounts, 
  onSuccess, 
  onCancel 
}: { 
  accounts: Account[]; 
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [debitAccountId, setDebitAccountId] = useState<number | ''>('');
  const [creditAccountId, setCreditAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description || !debitAccountId || !creditAccountId || !amount) {
      setError('Tous les champs sont requis');
      return;
    }

    if (debitAccountId === creditAccountId) {
      setError('Les comptes débit et crédit doivent être différents');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/accounting/entries', {
        description,
        reference,
        operationType: 'adjustment',
        lines: [
          { accountId: debitAccountId, debitAmount: amount, creditAmount: 0 },
          { accountId: creditAccountId, debitAmount: 0, creditAmount: amount },
        ],
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Libellé *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2"
          placeholder="Ex: Achat fournitures"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Référence</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2"
          placeholder="Ex: FACT-001"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Compte Débit *</label>
          <select 
            value={debitAccountId}
            onChange={(e) => setDebitAccountId(Number(e.target.value))}
            className="w-full border border-stone-200 rounded-lg px-3 py-2"
          >
            <option value="">Sélectionner...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Compte Crédit *</label>
          <select 
            value={creditAccountId}
            onChange={(e) => setCreditAccountId(Number(e.target.value))}
            className="w-full border border-stone-200 rounded-lg px-3 py-2"
          >
            <option value="">Sélectionner...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.code} - {acc.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Montant (FCFA) *</label>
        <input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border border-stone-200 rounded-lg px-3 py-2"
          min={1}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Création...' : 'Créer l\'écriture'}
        </Button>
      </div>
    </form>
  );
}
