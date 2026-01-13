import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

interface UseDriverLocationOptions {
    enabled?: boolean;
    orderId?: number | null;
    intervalMs?: number;
}

interface DriverLocation {
    lat: number;
    lng: number;
    timestamp: Date;
}

/**
 * Hook to track driver's location and send updates to backend
 * Updates every 60 seconds (or custom interval) when enabled
 */
export function useDriverLocation(options: UseDriverLocationOptions = {}) {
    const { enabled = false, orderId = null, intervalMs = 60000 } = options;

    const [location, setLocation] = useState<DriverLocation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Send location to backend
    const sendLocationToBackend = useCallback(async (lat: number, lng: number) => {
        try {
            await api.post('/driver/location', {
                lat,
                lng,
                orderId,
            });
        } catch (err) {
            console.error('Failed to send location:', err);
        }
    }, [orderId]);

    // Handle position update
    const handlePosition = useCallback((position: GeolocationPosition) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const newLocation = { lat, lng, timestamp: new Date() };
        setLocation(newLocation);
        setError(null);

        // Send to backend
        sendLocationToBackend(lat, lng);
    }, [sendLocationToBackend]);

    // Handle error
    const handleError = useCallback((err: GeolocationPositionError) => {
        setError(err.message);
        console.error('Geolocation error:', err);
    }, []);

    // Start tracking
    useEffect(() => {
        if (!enabled || !navigator.geolocation) {
            if (!navigator.geolocation) {
                setError('Géolocalisation non supportée');
            }
            return;
        }

        setLoading(true);

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                handlePosition(pos);
                setLoading(false);
            },
            (err) => {
                handleError(err);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );

        // Set up interval for updates
        intervalRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                handlePosition,
                handleError,
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }, intervalMs);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, intervalMs, handlePosition, handleError]);

    // Manual refresh
    const refresh = useCallback(() => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    handlePosition(pos);
                    setLoading(false);
                },
                (err) => {
                    handleError(err);
                    setLoading(false);
                },
                { enableHighAccuracy: true }
            );
        }
    }, [handlePosition, handleError]);

    return {
        location,
        loading,
        error,
        refresh,
    };
}
