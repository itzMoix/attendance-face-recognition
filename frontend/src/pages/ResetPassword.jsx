import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, Save, CheckCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import authService from '../services/authService';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError('No se proporcionó un token de recuperación válido.');
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.resetPassword(token, formData.newPassword);
            setIsSuccess(true);
            toast.success(response.message || 'Contraseña actualizada exitosamente.');
        } catch (err) {
            console.error('Reset password error:', err);
            const errorMessage =
                err.response?.data?.detail ||
                err.message ||
                'Error al restablecer la contraseña. El token puede haber expirado.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (error && !isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 dynamic-bg-soft transition-colors duration-500">
                <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-red-500 to-rose-600 rounded-2xl shadow-xl mb-6">
                        <ShieldAlert className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                        Enlace Inválido
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                        {error}
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center justify-center w-full py-3.5 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all"
                    >
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 dynamic-bg-soft transition-colors duration-500">
            {/* Decorative background elements */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-md w-full glass-card rounded-3xl p-8 relative z-10 transition-all duration-500 hover:shadow-indigo-500/10">
                {!isSuccess ? (
                    <>
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                                <Lock className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                Nueva Contraseña
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">
                                Ingresa tu nueva contraseña a continuación.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="relative group">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1 block">
                                        Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            name="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            className="block w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                            placeholder="Mínimo 8 caracteres"
                                            minLength={8}
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

                                <div className="relative group">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1 block">
                                        Confirmar Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            className="block w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                            placeholder="Repite la contraseña"
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Save className="w-5 h-5 mr-2" />
                                        Actualizar Contraseña
                                    </span>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    /* Success state */
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-2xl shadow-xl mb-6 animate-bounce">
                            <CheckCircle className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                            ¡Completado!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                            Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva credencial.
                        </p>
                        <Link
                            to="/login"
                            className="w-full inline-flex items-center justify-center py-3.5 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Ir al Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
