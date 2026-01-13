import { useFetch } from '../lib/useFetch';
import { useAuth } from '../context/AuthContext';

interface CashSession {
    id: number;
    cashRegisterId: number;
    openedBy: number;
    status: 'open' | 'closed';
    cashRegister?: { name: string };
}

/**
 * Hook to check if the current user has an active cash session
 */
export function useCashSession() {
    const { user } = useAuth();

    // Fetch current open sessions (for the user)
    const { data, loading, refetch } = useFetch<{ data: CashSession[] }>('/admin/cash/sessions/current');

    // Find the session opened by the current user
    const mySession = data?.data?.find(s => s.openedBy === user?.id && s.status === 'open') || null;

    return {
        hasActiveSession: !!mySession,
        session: mySession,
        loading,
        refetch,
    };
}
