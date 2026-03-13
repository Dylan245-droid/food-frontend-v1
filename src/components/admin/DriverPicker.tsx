import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bike, Check, Search, User } from 'lucide-react';
import { cn, getImageUrl } from '../../lib/utils';

interface Driver {
    id: number;
    fullName: string;
    avatar?: string;
}

interface DriverPickerProps {
    drivers: Driver[];
    selectedId: number | '';
    onSelect: (id: number | '') => void;
    placeholder?: string;
}

export default function DriverPicker({ drivers, selectedId, onSelect, placeholder = "Choisir un livreur..." }: DriverPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedDriver = drivers.find(d => d.id === selectedId);

    const filteredDrivers = drivers.filter(d =>
        d.fullName.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex-1" ref={dropdownRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-11 px-4 rounded-xl border flex items-center justify-between transition-all duration-200 bg-white",
                    isOpen ? "border-stone-900 ring-4 ring-stone-100 shadow-sm" : "border-stone-200 hover:border-stone-300 shadow-xs",
                    "cursor-pointer"
                )}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {selectedDriver ? (
                        <>
                            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden border border-stone-200">
                                {selectedDriver.avatar ? (
                                    <img src={getImageUrl(selectedDriver.avatar)!} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-3.5 h-3.5 text-stone-400" />
                                )}
                            </div>
                            <span className="text-xs font-black text-stone-900 uppercase tracking-tight truncate">
                                {selectedDriver.fullName}
                            </span>
                        </>
                    ) : (
                        <>
                            <Bike className="w-4 h-4 text-stone-300 shrink-0" />
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest truncate">
                                {placeholder}
                            </span>
                        </>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-100 shadow-2xl shadow-stone-200/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                    {/* Search */}
                    <div className="p-2 border-b border-stone-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full h-9 pl-9 pr-4 rounded-xl bg-stone-50 border-none focus:ring-2 focus:ring-stone-100 text-[11px] font-bold text-stone-700 uppercase tracking-wider"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-60 overflow-y-auto premium-scrollbar py-1">
                        {filteredDrivers.length > 0 ? (
                            filteredDrivers.map(driver => (
                                <button
                                    key={driver.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(driver.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "w-full px-3 py-2.5 flex items-center justify-between hover:bg-stone-50 transition-colors group",
                                        selectedId === driver.id && "bg-stone-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden border border-stone-200 group-hover:border-stone-400 transition-colors">
                                            {driver.avatar ? (
                                                <img src={getImageUrl(driver.avatar)!} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-black text-stone-500 uppercase">
                                                    {driver.fullName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-stone-900 uppercase tracking-tight leading-none">
                                                {driver.fullName}
                                            </p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Livreur</p>
                                        </div>
                                    </div>
                                    {selectedId === driver.id && (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center px-4">
                                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-normal">
                                    Aucun livreur trouvé
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
