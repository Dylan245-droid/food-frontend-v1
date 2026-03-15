// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import {
    ChefHat, Check, Clock, Search, Plus, UtensilsCrossed, ShoppingBag, Printer, XCircle, LayoutGrid, List, BellRing, Flame, User, ChevronRight, AlertCircle, MapPin, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { PaymentModal } from '../../components/ui/PaymentModal';
import { Receipt } from '../../components/Receipt';
import type { ReceiptOrder } from '../../components/Receipt';
import { useBranding } from '../../context/BrandingContext';
import { useAuth } from '../../context/AuthContext';
import { useCashSession } from '../../hooks/useCashSession';
import { NoCashSessionAlert } from '../../components/NoCashSessionAlert';
import { formatCurrency, cn } from '../../lib/utils';
import { NewOrderModal } from '../../components/admin/NewOrderModal';
import { useSubscription } from '../../hooks/useSubscription';

interface MenuItem {
    name: string;
    description?: string;
}

interface OrderItem {
    id: number;
    quantity: number;
    unitPrice: number;
    formattedSubtotal: string;
    specialInstructions: string | null;
    menuItem: MenuItem;
}

interface TableInfo {
    id: number;
    name: string;
    zone?: string;
}

interface Order {
    id: number;
    status: 'pending' | 'in_progress' | 'delivered' | 'cancelled' | 'paid';
    deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
    formattedTotal: string;
    totalAmount: number;
    table?: TableInfo;
    pickupCode?: string;
    clientName?: string;
    clientPhone?: string;
    type: 'dine_in' | 'takeout' | 'delivery';
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
    dailyNumber: number;
    notes?: string;
}

export default function OrdersPage() {
    const { data, loading, refetch } = useFetch<{ data: Order[], meta: any }>('/staff/orders?limit=100&status=pending,in_progress,delivered,paid');

    // State
    const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
    const [pickupCode, setPickupCode] = useState('');
    const [pickupOrder, setPickupOrder] = useState<Order | null>(null);
    const [pickupLoading, setPickupLoading] = useState(false);
    const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
    const { branding } = useBranding();
    const { user } = useAuth();

    const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'dine_in' | 'takeout'>('all');
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState<Order | null>(null);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<number | string>('');
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    const { hasActiveSession, loading: sessionLoading } = useCashSession();
    const navigate = useNavigate();

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(refetch, 30000);
        return () => clearInterval(interval);
    }, [refetch]);

    const checkSessionBeforePayment = (orderType: string): boolean => {
        if (orderType === 'delivery') return true;
        if (sessionLoading) return true;
        if (!hasActiveSession) {
            toast.error("Session de caisse requise", {
                action: { label: 'Ouvrir', onClick: () => navigate('/admin/cash') }
            });
            return false;
        }
        return true;
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await api.patch(`/staff/orders/${id}/status`, { status });
            refetch();
        } catch { toast.error('Erreur lors du changement de statut'); }
    };

    const handlePickupSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPickupOrder(null);
        setPickupLoading(true);
        try {
            const res = await api.get<{ data: Order[] }>(`/staff/orders?pickup_code=${pickupCode}`);
            if (res.data.data.length > 0) setPickupOrder(res.data.data[0]);
            else toast.error('Code introuvable');
        } catch { toast.error('Erreur lors de la recherche'); }
        finally { setPickupLoading(false); }
    };

    const { can } = useSubscription();
    const hasKds = can('kds_enabled');

    useEffect(() => {
        if (!hasKds && viewMode !== 'list') setViewMode('list');
    }, [hasKds, viewMode]);

    const handlePayAndPrint = async (order: Order, skipConfirm = false) => {
        if (order.status !== 'paid' && !checkSessionBeforePayment(order.type)) return;

        if (order.status === 'paid') {
            const receipt: ReceiptOrder = {
                id: order.id,
                dailyNumber: order.dailyNumber,
                pickupCode: order.pickupCode || null,
                status: 'paid',
                totalAmount: order.totalAmount,
                items: order.items,
                createdAt: order.createdAt,
                type: order.type,
                clientName: order.clientName,
                table: order.table ? { name: order.table.name } : undefined,
                subtotal: Math.round(order.totalAmount / 1.18),
                tax: order.totalAmount - Math.round(order.totalAmount / 1.18)
            };
            setReceiptOrder(receipt);
            setTimeout(() => window.print(), 500);
            return;
        }

        if (order.type === 'takeout' && !skipConfirm) {
            setVerifyingOrder(order);
            setVerifyCode('');
            return;
        }
        setPaymentModalOrder(order);
    };

    const fetchDrivers = async () => {
        setLoadingDrivers(true);
        try {
            const res = await api.get('/admin/users?role=livreur&limit=100');
            setDrivers(res.data.data);
        } catch { toast.error("Erreur de chargement des livreurs"); }
        finally { setLoadingDrivers(false); }
    };

    const handlePrintOnly = (order: Order) => {
        const receipt: ReceiptOrder = {
            id: order.id,
            dailyNumber: order.dailyNumber,
            pickupCode: order.pickupCode || null,
            status: order.status as any,
            totalAmount: order.totalAmount,
            items: order.items,
            createdAt: order.createdAt,
            type: order.type,
            clientName: order.clientName,
            table: order.table ? { name: order.table.name } : undefined,
            subtotal: Math.round(order.totalAmount / 1.18),
            tax: order.totalAmount - Math.round(order.totalAmount / 1.18)
        };
        setReceiptOrder(receipt);
        setTimeout(() => window.print(), 500);
    };

    const handleDeliveryHandover = (order: Order) => {
        setSelectedOrderForAssignment(order);
        setSelectedDriverId('');
        setIsAssignModalOpen(true);
        fetchDrivers();
    };

    const handleAssignDriver = async () => {
        if (!selectedOrderForAssignment || !selectedDriverId) return;
        try {
            await api.post('/delivery/assign', {
                orderId: selectedOrderForAssignment.id,
                deliveryPersonId: Number(selectedDriverId)
            });
            toast.success("Livreur assigné !");
            setIsAssignModalOpen(false);
            setSelectedOrderForAssignment(null);
            refetch();
        } catch { toast.error("Erreur lors de l'assignation"); }
    };

    if (loading && !data) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                <ChefHat className="w-12 h-12 text-stone-200 animate-bounce" />
                <span className="font-black text-stone-300 uppercase tracking-[0.2em] text-xs">Mise en place...</span>
            </div>
        </div>
    );

    const filterOrders = (orders: Order[]) => {
        return orders.filter(order => {
            if (typeFilter !== 'all') {
                if (typeFilter === 'takeout') {
                    if (order.type !== 'takeout' && order.type !== 'delivery') return false;
                } else if (order.type !== typeFilter) return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return order.pickupCode?.toLowerCase().includes(query) ||
                    order.clientName?.toLowerCase().includes(query) ||
                    order.dailyNumber?.toString().includes(query) ||
                    order.table?.name?.toLowerCase().includes(query);
            }
            return true;
        });
    };

    const ordersByStatus = {
        pending: filterOrders(data?.data.filter(o => o.status === 'pending') || []),
        in_progress: filterOrders(data?.data.filter(o => o.status === 'in_progress') || []),
        delivered: filterOrders(data?.data.filter(o => o.status === 'delivered') || []),
        paid: filterOrders((data?.data.filter(o => o.status === 'paid') || []).sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ))
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {!sessionLoading && <NoCashSessionAlert show={!hasActiveSession} />}

            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 md:gap-6 bg-white p-4 sm:p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <UtensilsCrossed className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base xs:text-xl sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Cuisine & Commandes</h1>
                        <p className="text-[10px] md:text-sm font-bold mt-2 truncate tracking-wide uppercase text-stone-400">Gestion de flux en temps réel</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 relative z-10">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rechercher #ID, table..."
                            className="w-full h-12 md:h-14 pl-12 pr-4 rounded-2xl bg-stone-50 border-none focus:ring-4 focus:ring-orange-100/50 text-xs font-black uppercase tracking-widest transition-all placeholder:text-stone-300"
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                        <button
                            onClick={() => setIsNewOrderModalOpen(true)}
                            className="flex-1 sm:flex-none h-12 md:h-14 px-4 sm:px-6 bg-stone-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-stone-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nouvelle</span>
                        </button>
                        <button
                            onClick={() => setIsPickupModalOpen(true)}
                            className="flex-1 sm:flex-none h-12 md:h-14 px-4 sm:px-6 bg-white border border-stone-100 text-stone-900 rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-sm hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Retrait</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 overflow-x-auto pb-4 premium-scrollbar w-full sm:w-auto p-1">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={cn(
                            "whitespace-nowrap px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
                            typeFilter === 'all' ? "bg-stone-900 text-white border-stone-900 translate-y-[-2px]" : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                        )}
                    >
                        Flux Global ({data?.data?.length || 0})
                    </button>
                    <button
                        onClick={() => setTypeFilter('dine_in')}
                        className={cn(
                            "whitespace-nowrap px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
                            typeFilter === 'dine_in' ? "bg-orange-500 text-white border-orange-500 translate-y-[-2px]" : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                        )}
                    >
                        Salle ({data?.data?.filter(o => o.type === 'dine_in').length || 0})
                    </button>
                    <button
                        onClick={() => setTypeFilter('takeout')}
                        className={cn(
                            "whitespace-nowrap px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border",
                            typeFilter === 'takeout' ? "bg-indigo-500 text-white border-indigo-500 translate-y-[-2px]" : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                        )}
                    >
                        Retrait/Liv ({data?.data?.filter(o => o.type === 'takeout' || o.type === 'delivery').length || 0})
                    </button>
                </div>

                {hasKds && (
                    <div className="bg-white p-1.5 rounded-2xl border border-stone-100 shadow-sm flex gap-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'kanban' ? "bg-stone-900 text-white shadow-lg" : "text-stone-300 hover:text-stone-500")}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-stone-900 text-white shadow-lg" : "text-stone-300 hover:text-stone-500")}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Views */}
            <div className="flex-1">
                {viewMode === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full pb-6">
                        <Column
                            title="En attente"
                            count={ordersByStatus.pending.length}
                            icon={BellRing}
                            accentColor="bg-yellow-400"
                        >
                            {ordersByStatus.pending.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAction={() => handleStatusChange(order.id, 'in_progress')}
                                    actionLabel="LANCER"
                                    variant="pending"
                                />
                            ))}
                            {ordersByStatus.pending.length === 0 && <EmptyState message="File d'attente libre" icon={Clock} />}
                        </Column>

                        <Column
                            title="Au Feu"
                            count={ordersByStatus.in_progress.length}
                            icon={Flame}
                            accentColor="bg-orange-500"
                        >
                            {ordersByStatus.in_progress.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAction={() => handleStatusChange(order.id, 'delivered')}
                                    actionLabel="SERVIR"
                                    variant="progress"
                                />
                            ))}
                            {ordersByStatus.in_progress.length === 0 && <EmptyState message="Cuisine calme" icon={ChefHat} />}
                        </Column>

                        <Column
                            title="Prêtes"
                            count={ordersByStatus.delivered.length}
                            icon={Check}
                            accentColor="bg-green-500"
                        >
                            {ordersByStatus.delivered.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAction={() => {
                                        if (order.type === 'takeout') handlePayAndPrint(order);
                                        else if (order.type === 'delivery') handleDeliveryHandover(order);
                                    }}
                                    actionLabel={order.type === 'takeout' ? 'REMETTRE' : (order.type === 'delivery' && !order.deliveryStatus?.includes('assigned') ? 'CONFIER' : undefined)}
                                    onSecondaryAction={order.type === 'delivery' ? () => handlePrintOnly(order) : undefined}
                                    secondaryActionLabel={order.type === 'delivery' ? 'TICKET' : undefined}
                                    variant="delivered"
                                />
                            ))}
                            {ordersByStatus.delivered.length === 0 && <EmptyState message="Rien à servir" icon={ShoppingBag} />}
                        </Column>

                        <Column
                            title="Payées"
                            count={ordersByStatus.paid.length}
                            icon={Receipt}
                            accentColor="bg-stone-300"
                        >
                            {ordersByStatus.paid.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    actionLabel="TICKET"
                                    onAction={() => handlePayAndPrint(order)}
                                    variant="paid"
                                />
                            ))}
                        </Column>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-stone-50 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-16rem)]">
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-stone-50/50 text-stone-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-6 font-black uppercase tracking-widest text-[10px]">#ID</th>
                                        <th className="p-6 font-black uppercase tracking-widest text-[10px]">Origine</th>
                                        <th className="p-6 font-black uppercase tracking-widest text-[10px]">Client / Table</th>
                                        <th className="p-6 font-black uppercase tracking-widest text-[10px]">Statut</th>
                                        <th className="p-6 text-right font-black uppercase tracking-widest text-[10px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {filterOrders(data?.data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <tr key={order.id} className="hover:bg-stone-50/30 transition-colors group">
                                            <td className="p-6 font-black text-stone-900">#{order.dailyNumber}</td>
                                            <td className="p-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    order.type === 'dine_in' ? "bg-orange-50 text-orange-500" : order.type === 'takeout' ? "bg-indigo-50 text-indigo-500" : "bg-blue-50 text-blue-500"
                                                )}>
                                                    {order.type === 'dine_in' ? 'Salle' : order.type === 'takeout' ? 'Retrait' : 'Livreur'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-black text-stone-900 uppercase text-xs">{order.table?.name || order.clientName || '-'}</p>
                                                {order.pickupCode && <p className="text-[10px] font-bold text-stone-300 mt-1">{order.pickupCode}</p>}
                                            </td>
                                            <td className="p-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    order.status === 'pending' ? "text-yellow-600" : order.status === 'in_progress' ? "text-orange-600" : order.status === 'delivered' ? "text-green-600" : "text-stone-400"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => handlePayAndPrint(order)}
                                                    className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-900 hover:text-white transition-all inline-flex items-center justify-center p-0"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Surgery view */}
                        <div className="md:hidden grid grid-cols-1 divide-y divide-stone-50 overflow-y-auto">
                            {filterOrders(data?.data || []).map(order => (
                                <div key={order.id} className="p-6 flex justify-between items-center group active:bg-stone-50 transition-colors">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-black text-stone-900 text-sm">#{order.dailyNumber}</span>
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                order.status === 'pending' ? "bg-yellow-400 animate-pulse" : order.status === 'in_progress' ? "bg-orange-500" : order.status === 'delivered' ? "bg-green-500" : "bg-stone-200"
                                            )}></span>
                                        </div>
                                        <p className="font-black text-stone-900 uppercase text-xs truncate mb-1">{order.table?.name || order.clientName || '---'}</p>
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{order.items.length} Articles • {formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-stone-200" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Portals */}
            <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Module de Retrait">
                <div className="space-y-6 pt-4">
                    {!pickupOrder ? (
                        <form onSubmit={handlePickupSearch} className="space-y-6">
                            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 text-center">
                                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-6 leading-relaxed">Saisir le code de validation client</p>
                                <Input
                                    value={pickupCode}
                                    onChange={e => setPickupCode(e.target.value.toUpperCase())}
                                    autoFocus
                                    className="text-center text-4xl font-black uppercase tracking-[0.4em] h-20 bg-white border-none shadow-xl shadow-stone-200/50 rounded-2xl focus:ring-4 focus:ring-orange-100 placeholder:opacity-10"
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                />
                            </div>
                            <button type="submit" disabled={pickupLoading} className="w-full h-16 bg-stone-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-stone-200 flex items-center justify-center gap-3">
                                {pickupLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                                Rechercher Commande
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-1">#{pickupOrder.dailyNumber}</h2>
                                        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">{pickupOrder.clientName || 'Client'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-stone-900 tracking-tighter">{formatCurrency(pickupOrder.totalAmount)}</p>
                                        <p className="text-[10px] font-black uppercase text-green-500 tracking-widest mt-1">Ready</p>
                                    </div>
                                </div>
                                <div className="space-y-4 py-6 border-t border-stone-50">
                                    {pickupOrder.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-xs font-bold text-stone-600 capitalize">
                                            <span>{item.quantity}x {item.menuItem.name}</span>
                                            <span className="text-stone-300">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPickupOrder(null)} className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</button>
                                <button
                                    onClick={() => handlePayAndPrint(pickupOrder, true)}
                                    className="flex-1 h-14 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                                    disabled={pickupOrder.status !== 'delivered'}
                                >
                                    <Check className="w-4 h-4" />
                                    Tout est bon
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {createPortal(
                <div id="printable-receipt" className="hidden print:block">
                    <Receipt order={receiptOrder} branding={branding} cashierName={user?.fullName} />
                </div>,
                document.body
            )}

            <VerificationModal
                isOpen={!!verifyingOrder}
                onClose={() => { setVerifyingOrder(null); setVerifyCode(''); }}
                order={verifyingOrder}
                verifyCode={verifyCode}
                setVerifyCode={setVerifyCode}
                onConfirm={() => { if (verifyingOrder) { handlePayAndPrint(verifyingOrder, true); setVerifyingOrder(null); setVerifyCode(''); } }}
            />

            <NewOrderModal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} onOrderCreated={refetch} />

            <PaymentModal
                order={paymentModalOrder}
                onClose={() => setPaymentModalOrder(null)}
                onConfirm={async (amountReceived, method) => {
                    if (!paymentModalOrder) return;
                    try {
                        await api.patch(`/staff/orders/${paymentModalOrder.id}/status`, {
                            status: 'paid',
                            amountReceived,
                            paymentMethod: method
                        });
                        handlePrintOnly(paymentModalOrder);
                        setPaymentModalOrder(null);
                        setIsPickupModalOpen(false);
                        setPickupOrder(null);
                        refetch();
                    } catch { toast.error('Échec du paiement'); }
                }}
            />

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assignation Livreur">
                <div className="space-y-6 pt-4">
                    <div className="bg-stone-50 p-6 rounded-[2rem] text-center">
                        <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-4" />
                        <h3 className="font-black text-stone-900 uppercase tracking-widest text-xs">Commande #{selectedOrderForAssignment?.dailyNumber}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                        {loadingDrivers ? (
                            <div className="py-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-stone-200 mx-auto" /></div>
                        ) : drivers.map(driver => (
                            <div
                                key={driver.id}
                                onClick={() => setSelectedDriverId(driver.id)}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer",
                                    selectedDriverId === driver.id ? "bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-200" : "bg-white border-stone-100 text-stone-900 hover:bg-stone-50"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center font-black uppercase overflow-hidden shrink-0">
                                        {driver.avatar ? <img src={driver.avatar} className="object-cover w-full h-full" /> : driver.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-xs truncate max-w-[150px]">{driver.fullName}</p>
                                        <p className={cn("text-[10px] font-bold mt-1 uppercase tracking-widest", selectedDriverId === driver.id ? "text-stone-500" : "text-stone-300")}>{driver.phone || 'Pas de numéro'}</p>
                                    </div>
                                </div>
                                {selectedDriverId === driver.id && <Check className="w-5 h-5 text-orange-400" />}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Retour</button>
                        <button
                            onClick={handleAssignDriver}
                            disabled={!selectedDriverId}
                            className="flex-1 h-14 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200"
                        >
                            Confier Charge
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Subcomponents with Surgery treatments
function Column({ title, count, icon: Icon, children, accentColor }: any) {
    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-stone-50 overflow-hidden">
            <div className="p-6 md:p-8 flex items-center justify-between relative">
                <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full", accentColor)}></div>
                <div className="flex items-center gap-4 pl-2">
                    <Icon className="w-5 h-5 text-stone-900" />
                    <h3 className="font-black text-stone-900 uppercase tracking-[0.2em] text-[10px] md:text-xs">{title}</h3>
                </div>
                <span className="bg-white px-3 py-1.5 rounded-xl border border-stone-50 text-[10px] font-black text-stone-400 shadow-sm">{count}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 space-y-4 no-scrollbar">
                {children}
            </div>
        </div>
    );
}

function EmptyState({ message, icon: Icon }: { message: string, icon: any }) {
    return (
        <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 pointer-events-none select-none">
            <Icon className="w-16 h-16 mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px]">{message}</p>
        </div>
    );
}

function OrderCard({ order, onAction, actionLabel, variant, onSecondaryAction, secondaryActionLabel }: any) {
    const isHot = (new Date().getTime() - new Date(order.createdAt).getTime()) > 15 * 60000 && order.status !== 'paid';

    return (
        <div className={cn(
            "group bg-white p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden",
            variant === 'paid' ? "border-stone-50 opacity-60" : "border-stone-100 hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/40",
            isHot && "border-red-100 shadow-lg shadow-red-50"
        )}>
            {isHot && (
                <div className="absolute top-2 right-4 flex items-center gap-1.5 animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Late</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-stone-900 tracking-tighter">#{order.dailyNumber}</span>
                        {order.type !== 'dine_in' && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                order.type === 'delivery' ? "bg-blue-50 text-blue-500" : "bg-indigo-50 text-indigo-500"
                            )}>{order.type === 'delivery' ? 'LIV' : 'RET'}</span>
                        )}
                    </div>
                    <p className="font-black text-stone-900 uppercase text-[10px] tracking-widest truncate max-w-[120px]">
                        {order.table?.name || order.clientName || '---'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-stone-300 font-bold mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] tracking-widest">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 leading-tight">
                        <span className="w-6 h-6 flex items-center justify-center bg-stone-50 rounded-lg text-[10px] font-black text-stone-500 shrink-0">{item.quantity}</span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-stone-700 uppercase tracking-wide truncate">{item.menuItem?.name}</p>
                            {item.specialInstructions && (
                                <p className="text-[9px] font-black text-red-500 uppercase mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {item.specialInstructions}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {(actionLabel || secondaryActionLabel) && (
                <div className="flex gap-2">
                    {actionLabel && (
                        <button
                            onClick={onAction}
                            className={cn(
                                "flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95",
                                variant === 'pending' ? "bg-stone-900 text-white shadow-stone-200" :
                                    variant === 'progress' ? "bg-orange-500 text-white shadow-orange-100" :
                                        "bg-white text-stone-900 border border-stone-100 shadow-stone-100"
                            )}
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && (
                        <button
                            onClick={onSecondaryAction}
                            className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 hover:bg-stone-200 transition-all flex items-center justify-center shrink-0"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {order.notes && (
                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <p className="text-[9px] font-bold text-stone-400 italic">"{order.notes}"</p>
                </div>
            )}
        </div>
    );
}

function VerificationModal({ isOpen, onClose, order, verifyCode, setVerifyCode, onConfirm }: any) {
    const isMatch = order && order.pickupCode === verifyCode.toUpperCase();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Validation Sécurisée">
            <div className="space-y-8 text-center pt-4">
                <div className="w-20 h-20 bg-stone-50 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
                    <div className="absolute inset-0 bg-stone-900/5 rounded-full animate-ping opacity-20"></div>
                    <Check className="w-10 h-10 text-stone-900 relative z-10" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-2">Code de Vérification</h3>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest leading-loose">
                        Demandez le sésame au client pour libérer la commande <span className="text-stone-900">#{order?.dailyNumber}</span>
                    </p>
                </div>
                <Input
                    value={verifyCode}
                    onChange={(e: any) => setVerifyCode(e.target.value.toUpperCase())}
                    placeholder="------"
                    autoFocus
                    className="text-center text-5xl font-black uppercase tracking-[0.4em] h-24 bg-stone-50 border-none shadow-inner rounded-3xl focus:ring-4 focus:ring-stone-100"
                    maxLength={6}
                />
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 h-16 bg-stone-50 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-xs">Annuler</button>
                    <button
                        onClick={onConfirm}
                        disabled={!isMatch}
                        className={cn(
                            "flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95",
                            isMatch ? "bg-green-600 text-white shadow-green-100" : "bg-stone-50 text-stone-200 cursor-not-allowed"
                        )}
                    >
                        Valider
                    </button>
                </div>
            </div>
        </Modal>
    );
}
