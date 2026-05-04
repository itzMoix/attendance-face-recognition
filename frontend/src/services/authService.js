import axios from 'axios';
import api from '../config/api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: api.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth Service
const authService = {
    /**
     * Login user with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{token: string, user: object}>}
     */
    async login(email, password) {
        const response = await axios.post(api.endpoints.login, {
            email,
            password,
        });

        const { access_token } = response.data;

        // Store token
        localStorage.setItem('token', access_token);

        // Get user info
        const user = await this.getCurrentUser(access_token);

        return { token: access_token, user };
    },

    /**
     * Get current user info from token
     * @param {string} token - Optional token, uses stored if not provided
     * @returns {Promise<object>}
     */
    async getCurrentUser(token = null) {
        const authToken = token || localStorage.getItem('token');

        if (!authToken) {
            throw new Error('No token available');
        }

        const response = await axios.get(api.endpoints.me, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        return response.data;
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        // Optionally call backend logout endpoint
        // axios.post(api.endpoints.logout).catch(() => {});
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    /**
     * Get stored token
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Request password reset
     * @param {string} email
     * @returns {Promise<object>}
     */
    async forgotPassword(email) {
        const response = await axios.post(api.endpoints.forgotPassword, {
            email
        });
        return response.data;
    },

    /**
     * Reset password with token
     * @param {string} token
     * @param {string} newPassword
     * @returns {Promise<object>}
     */
    async resetPassword(token, newPassword) {
        const response = await axios.post(api.endpoints.resetPassword, {
            token,
            new_password: newPassword
        });
        return response.data;
    }
};

export default authService;
