import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';

const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call backend API
            const { token, user } = await authService.login(
                formData.email,
                formData.password
            );

            // Update global auth state
            setAuth(user, token);

            // Show success message
            toast.success(`¡Bienvenido, ${user.email}!`);

            // Redirect based on user role
            switch (user.role) {
                case 'ADMIN':
                    navigate('/admin');
                    break;
                case 'PROFESSOR':
                    navigate('/professor');
                    break;
                case 'STUDENT':
                    navigate('/student');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);

            // Show error message
            const errorMessage = error.response?.data?.detail ||
                error.message ||
                'Error al iniciar sesión. Verifica tus credenciales.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg transition-colors duration-200">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Sistema de Asistencias
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Inicia sesión con tu cuenta
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-200 disabled:opacity-50"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-200 disabled:opacity-50"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        <p>Credenciales de acceso:</p>
                        <p className="font-mono font-medium">admin@sistema.edu / admin1234</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
