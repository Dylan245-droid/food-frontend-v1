import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9015/api',
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
