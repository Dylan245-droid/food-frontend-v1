import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Input } from './Input';
import { useCashSession } from '../../hooks/useCashSession';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';


interface PaymentModalProps {
  order: {
    id: number;
    totalAmount: number;
    type?: 'dine_in' | 'takeout' | 'delivery';
  } | null;
  onClose: () => void;
  onConfirm: (amountReceived: number) => void;
  title?: string;
  totalOverride?: number; // In case we want to pay a custom amount or aggregated total
}

export function PaymentModal({ 
  order, 
  onClose, 
  onConfirm,
  title = "Encaissement Commande",
  totalOverride
}: PaymentModalProps) {
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [error, setError] = useState('');
  const { hasActiveSession, loading: sessionLoading } = useCashSession();
  const navigate = useNavigate();

  // Reset state when order changes
  useEffect(() => {
    if (order) {
        setAmountReceived(0);
        setError('');
    }
  }, [order]);

  if (!order) return null;

  const total = totalOverride ?? order.totalAmount;
  const change = Math.max(0, amountReceived - total);
  const isEnough = amountReceived >= total;
  
  // Check if cash session is required (not for delivery)
  const requiresCashSession = order.type !== 'delivery';
  
  // Quick money buttons
  const suggestions = [total, Math.ceil(total/500)*500, Math.ceil(total/1000)*1000, Math.ceil(total/5000)*5000, Math.ceil(total/10000)*10000]
    .filter((v, i, a) => v >= total && a.indexOf(v) === i)
    .sort((a, b) => a - b)
    .slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isEnough) {
          setError('Le montant reçu est insuffisant');
          return;
      }
      
      // Check cash session before confirming (except delivery)
      if (requiresCashSession && !sessionLoading && !hasActiveSession) {
          toast.error("Vous devez ouvrir une session de caisse avant d'encaisser.", {
              action: {
                  label: 'Ouvrir caisse',
                  onClick: () => navigate('/admin/cash')
              }
          });
          onClose();
          return;
      }
      
      onConfirm(amountReceived);
  };

  return (
    <Modal isOpen={!!order} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
             <p className="text-sm text-stone-500 font-medium uppercase tracking-wider mb-1">Total à payer</p>
             <p className="text-4xl font-black text-stone-900">{formatCurrency(total)}</p>
        </div>

        <div>
            <label className="block text-sm font-bold text-stone-900 mb-2">Montant Reçu (Espèces)</label>
            <Input 
                type="number" 
                value={amountReceived || ''} 
                onChange={(e) => {
                    setAmountReceived(Number(e.target.value));
                    setError('');
                }}
                className="text-center text-2xl font-bold h-14"
                placeholder="0"
                autoFocus
            />
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
            {suggestions.map(amt => (
                <button
                    key={amt}
                    type="button"
                    onClick={() => { setAmountReceived(amt); setError(''); }}
                    className="px-3 py-1 bg-white border border-stone-200 hover:border-blue-300 hover:bg-blue-50 text-stone-600 rounded-full text-sm font-medium transition-colors"
                >
                    {formatCurrency(amt).replace(' FCFA', '')}
                </button>
            ))}
        </div>

        {/* Change Display */}
        <div className={`p-4 rounded-xl border text-center transition-colors ${
            isEnough ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'
        }`}>
             <p className={`text-sm font-medium uppercase tracking-wider mb-1 ${
                 isEnough ? 'text-green-600' : 'text-red-500'
             }`}>Monnaie à rendre</p>
             <p className={`text-3xl font-black ${
                 isEnough ? 'text-green-700' : 'text-red-600'
             }`}>{formatCurrency(change)}</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center text-sm font-bold">
                {error}
            </div>
        )}

        <div className="flex gap-3">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 h-14 rounded-xl font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
             >
                 Annuler
             </button>
             <button
                type="submit"
                disabled={!isEnough}
                className={`flex-1 h-14 rounded-xl font-bold text-white shadow-lg transition-all ${
                    isEnough 
                    ? 'bg-stone-900 hover:bg-black hover:scale-[1.02]' 
                    : 'bg-stone-300 cursor-not-allowed'
                }`}
             >
                 Confirmer & Imprimer
             </button>
        </div>
      </form>
    </Modal>
  );
}
