import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

import authService from '../services/authService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [resetToken, setResetToken] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call the real backend endpoint
            const response = await authService.forgotPassword(email);
            
            // For demo purposes, we capture the token to show it on screen.
            // In production, the backend wouldn't return this token, 
            // and we'd just show the success message.
            if (response.reset_token) {
                setResetToken(response.reset_token);
            }

            setIsSent(true);
            toast.success(response.message || 'Correo de recuperación enviado.');
        } catch (error) {
            console.error('Forgot password error:', error);
            const errorMessage =
                error.response?.data?.detail ||
                error.message ||
                'Error al enviar el correo. Intenta nuevamente.';
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
                {!isSent ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-xl mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                                <Mail className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                ¿Olvidaste tu contraseña?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">
                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                            </p>
                        </div>

                        {/* Form */}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="relative group">
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1 block">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        id="forgot-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Send className="w-5 h-5 mr-2" />
                                        Enviar Enlace de Recuperación
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Back to login */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </>
                ) : (
                    /* Success state */
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-2xl shadow-xl mb-6 animate-bounce">
                            <CheckCircle className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                            ¡Correo Enviado!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed mb-2">
                            Hemos enviado un enlace de recuperación a:
                        </p>
                        <p className="font-mono text-sm bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl py-2 px-4 inline-block text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-500/20 mb-6">
                            {email}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">
                            Revisa tu bandeja de entrada y carpeta de spam. El enlace expira en 30 minutos.
                        </p>

                        {resetToken && (
                            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-left">
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Demo Mode: Link de Reseteo</p>
                                <p className="text-sm text-amber-800 dark:text-amber-200 break-all mb-3">
                                    En producción esto se enviaría por correo. Token de prueba:
                                    <br/>
                                    <span className="font-mono text-xs opacity-75">{resetToken}</span>
                                </p>
                                <Link
                                    to={`/reset-password?token=${resetToken}`}
                                    className="inline-block w-full text-center py-2 px-4 text-xs font-bold rounded-lg text-amber-900 bg-amber-200 hover:bg-amber-300 transition-colors"
                                >
                                    Ir a Resetear Contraseña (Demo)
                                </Link>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={() => { setIsSent(false); setEmail(''); }}
                                className="w-full py-3 px-4 text-sm font-bold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                Enviar a otro correo
                            </button>
                            <Link
                                to="/login"
                                className="w-full inline-flex items-center justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver al Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
