import { useState, useEffect } from 'react';

import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Clock, Check, Bell } from 'lucide-react';

interface ServerCall {
    id: number;
    table_id: number;
    call_type: 'general' | 'water' | 'bill' | 'other';
    message: string | null;
    created_at: string;
    table: {
        name: string;
        zone: string;
    };
}

export default function ServerCallsPage() {
    // Determine endpoint based on role or simple default to My Calls? 
    // Plan said "Mes Appels" links to /admin/calls. 
    // Since this page is likely only accessed by servers via "Mes Appels", we can default to myCalls or handle filter.
    // Let's implement active polling like the notification.
    
    const [calls, setCalls] = useState<ServerCall[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCalls = async () => {
        try {
            // Using the specific 'myCalls' endpoint for this page as it's intended for "Mes Appels"
            const res = await api.get('/staff/calls/me');
            setCalls(res.data.data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch calls");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();
        const interval = setInterval(fetchCalls, 15000); // 15s poll
        return () => clearInterval(interval);
    }, []);

    const handleResolve = async (id: number) => {
        try {
            await api.patch(`/staff/calls/${id}/resolve`);
            await fetchCalls();
        } catch (e) {
            alert('Erreur lors de la résolution');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des appels...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-red-600" />
                    Mes Appels
                </h1>
                <Button variant="secondary" onClick={fetchCalls}>
                    Actualiser
                </Button>
            </div>

            {calls.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tout est calme !</h3>
                    <p className="text-gray-500">Aucun appel en attente pour vos tables.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calls.map(call => (
                        <div key={call.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                            call.call_type === 'bill' ? 'border-green-500' : 'border-blue-500'
                        }`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                        call.call_type === 'bill' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {call.call_type === 'bill' ? 'Addition' : 'Aide'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(call.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-1">{call.table?.name}</h3>
                                <p className="text-gray-500 text-sm mb-4">{call.call_type === 'bill' ? "Demande l'addition" : "Besoin d'assistance"}</p>
                            </div>
                            
                            <Button 
                                onClick={() => handleResolve(call.id)}
                                className={`w-full flex items-center justify-center gap-2 ${
                                    call.call_type === 'bill' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                Traiter la demande
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
