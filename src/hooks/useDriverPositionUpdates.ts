import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface DriverPosition {
    lat: number;
    lng: number;
    driverId?: number;
    driverName?: string;
    timestamp?: string;
}

/**
 * Hook to listen for driver position updates via SSE
 * Also fetches initial position from backend on mount
 * Used by clients to track their delivery in real-time
 */
export function useDriverPositionUpdates(orderId: number | undefined) {
    const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial position from backend
    useEffect(() => {
        if (!orderId) return;

        const fetchInitialPosition = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/orders/${orderId}/driver-location`);
                if (res.data.position) {
                    setDriverPosition({
                        lat: res.data.position.lat,
                        lng: res.data.position.lng,
                        timestamp: res.data.position.updatedAt,
                    });
                }
            } catch (err) {
                console.error('Failed to fetch initial driver position:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialPosition();
    }, [orderId]);

    // Listen for SSE updates
    useEffect(() => {
        if (!orderId) return;

        // Listen for SSE events
        const handleSSEMessage = (event: CustomEvent) => {
            const data = event.detail;

            // Check if this update is for our order
            if (data.type === 'driver:location' && data.payload?.orderId === orderId) {
                setDriverPosition({
                    lat: data.payload.lat,
                    lng: data.payload.lng,
                    driverId: data.payload.driverId,
                    driverName: data.payload.driverName,
                    timestamp: data.payload.timestamp,
                });
            }
        };

        // Subscribe to SSE events (using custom event from NotificationContext)
        window.addEventListener('sse:message', handleSSEMessage as EventListener);
        setIsConnected(true);

        return () => {
            window.removeEventListener('sse:message', handleSSEMessage as EventListener);
            setIsConnected(false);
        };
    }, [orderId]);

    const clearPosition = useCallback(() => {
        setDriverPosition(null);
    }, []);

    return {
        driverPosition,
        isConnected,
        isLoading,
        clearPosition,
    };
}
