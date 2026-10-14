import axios from 'axios';

const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
    }
    // If opened on a LAN IP from another device (tablet/smartphone in restaurant)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // If served on Vite dev port 5173, backend is on 3333, otherwise use same port/host
        const port = window.location.port === '5173' ? '3333' : (window.location.port || '3333');
        return `${window.location.protocol}//${window.location.hostname}:${port}/api`;
    }
    return envUrl || 'http://localhost:9015/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('gotchop_token');

    // Auth Header
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Multi-Tenant: Inject slug if in public route
    // Only apply if URL is relative and doesn't explicitly start with '/r/' or '/auth' or '/admin'
    // and if we are actually in a tenant context (URL bar has /r/:slug)
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('/r/') && !config.url.startsWith('/auth') && !config.url.startsWith('/admin') && !config.url.startsWith('/tenants/register')) {
        const path = window.location.pathname;
        const match = path.match(/^\/r\/([^\/]+)/);
        const tenantSlug = match ? match[1] : null;

        if (tenantSlug) {
            // Prefix with /r/:slug
            // Remove leading slash to avoid double slash if needed, but axios handles it.
            // Actually config.url starts with / (e.g. /menu), we want /r/slug/menu
            config.url = `/r/${tenantSlug}${config.url}`;
        }
    }

    return config;
});

export default api;
