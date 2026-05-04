// API Configuration
// En Docker: el proxy de Vite reenvía /api/* al contenedor backend.
// En producción: usar VITE_API_URL para apuntar al servidor real.
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = {
    baseURL: API_URL,
    endpoints: {
        login: `${API_URL}/api/auth/login`,
        logout: `${API_URL}/api/auth/logout`,
        me: `${API_URL}/api/auth/me`,
        forgotPassword: `${API_URL}/api/auth/forgot-password`,
        resetPassword: `${API_URL}/api/auth/reset-password`,
        students: `${API_URL}/api/students`,
    }
};

export default api;
