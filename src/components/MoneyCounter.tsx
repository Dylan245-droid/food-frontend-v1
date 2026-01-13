import { useState } from 'react';

interface MoneyCounterProps {
    initialCounts?: Record<string, number>;
    onChange: (counts: Record<string, number>, total: number) => void;
}

export function MoneyCounter({ initialCounts = {}, onChange }: MoneyCounterProps) {
    const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
    
    // Denominations (Bills first, then coins)
    const denominations = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 25];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const handleChange = (denom: number, val: string) => {
        const count = parseInt(val) || 0;
        const newCounts = { ...counts, [denom]: count };
        setCounts(newCounts);
        
        const total = Object.entries(newCounts).reduce((acc, [d, c]) => acc + (Number(d) * Number(c)), 0);
        onChange(newCounts, total);
    };

    // Calculate total for display
    const total = Object.entries(counts).reduce((acc, [d, c]) => acc + (Number(d) * Number(c)), 0);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 h-64 overflow-y-auto custom-scrollbar">
                {denominations.map((denom) => (
                    <div key={denom} className="flex flex-col">
                        <label className="text-xs text-stone-500 font-semibold mb-1 uppercase tracking-wide">
                            {denom >= 500 ? 'Billet' : 'Pièce'} {denom}
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="0"
                                className="w-full p-2 border border-stone-200 rounded-lg text-center font-mono font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                placeholder="0"
                                value={counts[denom] || ''}
                                onChange={(e) => handleChange(denom, e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
                            <div className="w-20 text-right">
                                <span className="text-xs font-mono text-stone-400 font-medium block">Total</span>
                                <span className="text-xs font-mono font-bold text-stone-600">
                                    {formatCurrency((counts[denom] || 0) * denom)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center bg-stone-900 text-white p-4 rounded-xl shadow-lg">
                <span className="font-bold uppercase tracking-wider text-sm text-stone-300">Total Compté</span>
                <span className="font-mono font-black text-2xl tracking-tight">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}
