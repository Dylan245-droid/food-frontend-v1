import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Loader2, Bike, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { DeliveryOrderCard } from '../../components/DeliveryOrderCard';

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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Bike className="w-8 h-8 text-blue-600" />
                        Dispatch Livraison
                    </h1>
                    <p className="text-gray-500">Assignez les commandes <strong>prêtes</strong> aux livreurs disponibles.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold">
                    {readyOrders.length} prêtes
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
                                    <select 
                                        className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                        value={driverSelections[order.id] || ''}
                                        onChange={(e) => handleDriverSelect(order.id, Number(e.target.value) || '')}
                                    >
                                        <option value="">Choisir un livreur...</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.fullName}</option>
                                        ))}
                                    </select>
                                    <Button 
                                        onClick={() => handleAssign(order.id)}
                                        isLoading={assigningId === order.id}
                                        disabled={!driverSelections[order.id]}
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
