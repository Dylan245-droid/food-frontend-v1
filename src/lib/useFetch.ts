import { useState, useEffect, useCallback } from 'react';
import api from './api';

export function useFetch<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(url);
            setData(res.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
