import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, UserCheck, ShieldCheck } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);

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
            const { token, user } = await authService.login(
                formData.email,
                formData.password
            );

            setAuth(user, token);
            toast.success(`¡Bienvenido, ${user.email}!`);

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
            const errorMessage = error.response?.data?.detail ||
                error.message ||
                'Error al iniciar sesión. Verifica tus credenciales.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 dynamic-bg-soft transition-colors duration-500">
            {/* Decorative background elements */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-md w-full glass-card rounded-3xl p-8 relative z-10 transition-all duration-500 hover:shadow-indigo-500/10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                        <UserCheck className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        Bienvenido
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Sistema de Asistencias Inteligente
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1 block">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1 block">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                                Recordarme
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verificando...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <ShieldCheck className="w-5 h-5 mr-2" />
                                Iniciar Sesión
                            </span>
                        )}
                    </button>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100/50 dark:border-indigo-500/20">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 text-center">
                                Credenciales de Demo
                            </p>
                            <div className="flex justify-center space-x-2 font-mono text-xs text-indigo-900 dark:text-indigo-200">
                                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-indigo-100 dark:border-indigo-500/20">admin@sistema.edu</span>
                                <span className="flex items-center px-1">/</span>
                                <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-indigo-100 dark:border-indigo-500/20">admin1234</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
