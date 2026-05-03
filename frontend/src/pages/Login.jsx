import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Video, Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
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
            const { token, user } = await authService.login(
                formData.email,
                formData.password
            );

            setAuth(user, token);
            toast.success(`¡Bienvenido de nuevo!`);

            switch (user.role) {
                case 'ADMIN': navigate('/admin'); break;
                case 'PROFESSOR': navigate('/professor'); break;
                case 'STUDENT': navigate('/student'); break;
                default: navigate('/');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Credenciales incorrectas';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full mx-4 z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 mb-4 animate-bounce-subtle">
                        <Video className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">FaceAttend</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sistema de Reconocimiento Facial</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white dark:border-gray-800 transition-all">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Iniciar Sesión</h2>
                    
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Correo Institucional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                                    placeholder="nombre@universidad.edu"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="h-5 w-5" />
                                    Entrar al Sistema
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                            <p className="font-medium mb-1">Credenciales de demo:</p>
                            <p className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg inline-block">admin@sistema.edu / admin1234</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 justify-center">
                            <Lock className="h-3 w-3" />
                            Acceso seguro mediante encriptación SSL
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
                    FaceAttend © 2026 — Desarrollado para Modular
                </p>
            </div>
        </div>
    );
};

export default Login;
