import { useState, useEffect } from 'react';
import { Bell, Check, Info, CreditCard, ShoppingBag, Utensils } from 'lucide-react';
import api from '../lib/api';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

interface ServerCall {
    id: number;
    tableId: number;
    callType: 'general' | 'water' | 'bill' | 'other';
    message: string | null;
    createdAt: string;
    table: {
        name: string;
        zone: string;
        assignedServer?: {
            fullName: string;
        } | null;
    };
}

interface Order {
    id: number;
    dailyNumber: number;
    tableName: string;
    clientName?: string;
    type: 'dine_in' | 'takeout' | 'delivery';
    totalFormatted: string;
    items: any[];
    createdAt: string;
}

export function ServerCallsNotification() {
    const [calls, setCalls] = useState<ServerCall[]>([]);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'calls' | 'orders'>('calls');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [callsRes, ordersRes] = await Promise.all([
                api.get('/staff/calls'),
                api.get('/staff/orders?status=pending&limit=10')
            ]);
            setCalls(callsRes.data.data || []);
            setPendingOrders(ordersRes.data.data || []);
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    // Poll every 15 seconds
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleResolveCall = async (id: number) => {
        setLoading(true);
        try {
            await api.patch(`/staff/calls/${id}/resolve`);
            await fetchData();
        } catch (e) {
            alert('Erreur');
        } finally {
            setLoading(false);
        }
    };

    const totalNotifications = calls.length + pendingOrders.length;

    if (totalNotifications === 0) {
        return (
            <div className="relative">
                <div className="p-3 bg-white rounded-full shadow-md text-gray-400 border border-gray-100 transition-colors" title="Aucune notification">
                    <Bell className="w-6 h-6" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full relative transition-all duration-300 ${isOpen ? 'bg-red-600 text-white rotate-12 scale-110' : 'bg-white text-red-600 shadow-lg hover:shadow-xl hover:-translate-y-1'}`}
            >
                <Bell className={`w-6 h-6 ${totalNotifications > 0 ? 'animate-bounce-slow' : ''}`} />
                {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {totalNotifications}
                    </span>
                )}
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-200">
                    
                    {/* Header Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button 
                            onClick={() => setActiveTab('calls')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'calls' ? 'bg-white text-red-600 border-t-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Appels ({calls.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Cuisine ({pendingOrders.length})
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto bg-white p-2 space-y-2">
                        
                        {/* CALLS LIST */}
                        {activeTab === 'calls' && (
                            <>
                                {calls.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Aucun appel en attente</p>
                                    </div>
                                ) : (
                                    calls.map(call => (
                                        <div key={call.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between gap-3 animate-in slide-in-from-right-2 duration-300">
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                    call.callType === 'bill' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {call.callType === 'bill' ? <CreditCard className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">
                                                        {call.table?.name || 'Table Inconnue'}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {call.callType === 'bill' ? "Demande d'addition 💳" : "Besoin d'aide 🔔"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => handleResolveCall(call.id)}
                                                disabled={loading}
                                                className="h-8 w-8 p-0 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:bg-green-50 shadow-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {/* ORDERS LIST */}
                        {activeTab === 'orders' && (
                            <>
                                {pendingOrders.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Aucune commande en attente</p>
                                    </div>
                                ) : (
                                    <>
                                        {pendingOrders.map(order => (
                                            <div 
                                                key={order.id} 
                                                className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex justify-between gap-3 hover:bg-blue-50 transition-colors cursor-pointer" 
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    navigate('/admin/orders');
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                        <Utensils className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            Commande #{order.dailyNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {order.type === 'takeout' 
                                                                ? `🥡 À EMPORTER - ${order.clientName || 'Client'}` 
                                                                : `🍽️ SUR PLACE - ${order.tableName || 'Table ?'}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{order.items?.length || 0} articles • {order.totalFormatted}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-blue-600 hover:bg-blue-50 h-8 mt-2"
                                            onClick={() => {
                                                setIsOpen(false);
                                                navigate('/admin/orders');
                                            }}
                                        >
                                            Voir toutes les commandes
                                        </Button>
                                    </>
                                )}
                            </>
                        )}

                    </div>
                </div>
            )}
            
            {/* Backdrop */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
}
