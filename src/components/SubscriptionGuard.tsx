import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription, type FeatureKey } from '../hooks/useSubscription';
import { toast } from 'sonner';

interface SubscriptionGuardProps {
    feature: FeatureKey;
    children: ReactNode;
}

/**
 * SubscriptionGuard
 * Protects a route or component based on the user's subscription features.
 * Redirects to /admin if unauthorized.
 */
export default function SubscriptionGuard({ feature, children }: SubscriptionGuardProps) {
    const { can } = useSubscription();
    const isAllowed = can(feature);

    useEffect(() => {
        if (!isAllowed) {
            toast.error("Votre abonnement actuel ne permet pas d'accéder à cette fonctionnalité.");
        }
    }, [isAllowed]);

    if (!isAllowed) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
