// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    baseURL: API_URL,
    endpoints: {
        login: `${API_URL}/api/auth/login`,
        logout: `${API_URL}/api/auth/logout`,
        me: `${API_URL}/api/auth/me`,
        students: `${API_URL}/api/students`,
    }
};

export default api;
