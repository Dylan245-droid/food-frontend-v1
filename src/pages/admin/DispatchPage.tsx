import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Loader2, Bike, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { DeliveryOrderCard } from '../../components/DeliveryOrderCard';
import DriverPicker from '../../components/admin/DriverPicker';

interface Order {
    id: number;
    dailyNumber: number;
    clientName: string;
    clientPhone: string;
    deliveryAddress: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
    deliveryFee: number;
    notes?: string;
    status: string; // For filtering ready orders
}

interface User {
    id: number;
    fullName: string;
    role: string;
}

export default function DispatchPage() {
    // 1. Fetch Pending Orders (only ready ones from backend)
    const { data: orders, loading: loadingOrders, refetch } = useFetch<Order[]>('/delivery/pending');

    // 2. Fetch Drivers
    const { data: usersData } = useFetch<{ data: User[] }>('/admin/users');
    const drivers = usersData?.data.filter(u => u.role === 'livreur') || [];

    // Per-order driver selection state: { [orderId]: driverId }
    const [driverSelections, setDriverSelections] = useState<Record<number, number | ''>>({});
    const [assigningId, setAssigningId] = useState<number | null>(null);

    const handleDriverSelect = (orderId: number, driverId: number | '') => {
        setDriverSelections(prev => ({ ...prev, [orderId]: driverId }));
    };

    const handleAssign = async (orderId: number) => {
        const selectedDriver = driverSelections[orderId];
        if (!selectedDriver) return alert('Veuillez sélectionner un livreur');
        setAssigningId(orderId);
        try {
            await api.post('/delivery/assign', { orderId, deliveryPersonId: selectedDriver });
            refetch(); // Reload list
            // Clear selection for this order
            setDriverSelections(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        } catch (error) {
            alert('Erreur lors de l\'assignation');
        } finally {
            setAssigningId(null);
        }
    };

    if (loadingOrders) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    // Filter: Only show orders that are "delivered" (Ready for dispatch)
    const readyOrders = orders?.filter(o => o.status === 'delivered') || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                    <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
                        <Bike className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Dispatch Livraison</h1>
                        <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">Assignation des commandes <strong className="text-blue-600">prêtes</strong></p>
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-black text-xs md:text-sm border border-blue-100 shadow-sm relative z-10 uppercase tracking-widest shrink-0">
                    {readyOrders.length} {readyOrders.length > 1 ? 'Commandes' : 'Commande'} prêtes
                </div>
            </div>

            {readyOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Tout est calme</h3>
                    <p className="text-gray-500">Aucune commande prête en attente de livraison.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {readyOrders.map(order => (
                        <DeliveryOrderCard
                            key={order.id}
                            order={order}
                            actions={
                                <>
                                    <DriverPicker
                                        drivers={drivers}
                                        selectedId={driverSelections[order.id] || ''}
                                        onSelect={(id) => handleDriverSelect(order.id, id)}
                                    />
                                    <Button
                                        onClick={() => handleAssign(order.id)}
                                        isLoading={assigningId === order.id}
                                        disabled={!driverSelections[order.id]}
                                        className="h-11 px-6 rounded-xl bg-stone-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shrink-0"
                                    >
                                        Assigner
                                    </Button>
                                </>
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
