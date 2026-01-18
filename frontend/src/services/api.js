/**
 * IRIS API Service Layer
 * Centralized API configuration and utilities for connecting to FastAPI backend
 */

// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Handle empty responses (like DELETE)
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
        throw error;
    }
}

// HTTP method helpers
export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    patch: (endpoint, data) => request(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// ============ Authentication API ============
export const authAPI = {
    login: (username, password, role) =>
        api.post('/token', { username, password, role }),
};

// ============ Junctions API ============
export const junctionsAPI = {
    getAll: () => api.get('/junctions'),
    getById: (id) => api.get(`/junctions/${id}`),
    create: (data) => api.post('/junctions', data),
    update: (id, data) => api.put(`/junctions/${id}`, data),
    delete: (id) => api.delete(`/junctions/${id}`),
};

// ============ Cameras API ============
export const camerasAPI = {
    getAll: (junctionId = null) => {
        const query = junctionId ? `?junction_id=${junctionId}` : '';
        return api.get(`/cameras${query}`);
    },
    getById: (id) => api.get(`/cameras/${id}`),
};

// ============ Alerts API ============
export const alertsAPI = {
    getAll: (status = null, limit = 50) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (limit) params.append('limit', limit.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        return api.get(`/alerts${query}`);
    },
    create: (data) => api.post('/alerts', data),
    resolve: (id) => api.patch(`/alerts/${id}/resolve`),
};

// ============ Accidents API ============
export const accidentsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.junction_id) params.append('junction_id', filters.junction_id);
        if (filters.camera_id) params.append('camera_id', filters.camera_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.severity) params.append('severity', filters.severity);
        if (filters.limit) params.append('limit', filters.limit.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        return api.get(`/accidents${query}`);
    },
    getById: (id) => api.get(`/accidents/${id}`),
    resolve: (id, resolvedBy = null) => {
        const query = resolvedBy ? `?resolved_by=${resolvedBy}` : '';
        return api.patch(`/accidents/${id}/resolve${query}`);
    },
};

// ============ Signal Timings API ============
export const signalTimingsAPI = {
    getByJunction: (junctionId) => api.get(`/signal-timings/${junctionId}`),
    create: (data) => api.post('/signal-timings', data),
};

// ============ Traffic Data API ============
export const trafficDataAPI = {
    getHistory: (junctionId, limit = 100) =>
        api.get(`/traffic-data-history/${junctionId}?limit=${limit}`),
    record: (data) => api.post('/traffic-data-record', data),
    getLive: () => api.get('/traffic-data'),
};

// ============ System Stats API ============
export const systemStatsAPI = {
    get: () => api.get('/system-stats'),
};

// ============ Schedule API ============
export const scheduleAPI = {
    get: (junctionId = 'J-001') => api.get(`/schedule?junction_id=${junctionId}`),
};

// ============ Health Check ============
export const healthAPI = {
    check: () => api.get('/health'),
};

export default api;
