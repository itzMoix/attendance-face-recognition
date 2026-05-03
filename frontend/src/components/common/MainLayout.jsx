import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Video, LayoutDashboard, GraduationCap, User, BarChart3 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

// Navegación por rol
const NAV_BY_ROLE = {
    ADMIN: [
        { to: '/admin',     label: 'Admin',     icon: LayoutDashboard },
        { to: '/live',      label: 'Live Cam',  icon: Video, highlight: true },
        { to: '/reports',   label: 'Reportes',  icon: BarChart3 },
    ],
    PROFESSOR: [
        { to: '/professor', label: 'Mis Clases', icon: GraduationCap },
        { to: '/live',      label: 'Live Cam',   icon: Video, highlight: true },
        { to: '/reports',   label: 'Reportes',   icon: BarChart3 },
    ],
    STUDENT: [
        { to: '/student',   label: 'Mi Portal',  icon: User },
    ],
};

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    const role = user?.role || 'STUDENT';
    const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.STUDENT;

    // Nombre / iniciales del usuario
    const displayName = user?.email?.split('@')[0] || 'Usuario';
    const initials = displayName.slice(0, 2).toUpperCase();

    // Determina si un link está activo
    const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
            {/* ── Navbar ── */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo + Nav */}
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link to={navItems[0]?.to} className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                                    <Video className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                    FaceAttend
                                </span>
                            </Link>

                            {/* Links según rol */}
                            <nav className="hidden sm:flex items-center gap-1">
                                {navItems.map(({ to, label, icon: Icon, highlight }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                            highlight
                                                ? isActive(to)
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                    : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                : isActive(to)
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                        {highlight && (
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Acciones derechas */}
                        <div className="flex items-center gap-3">
                            {/* Tema */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>

                            {/* Separador */}
                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-600" />

                            {/* Usuario + logout */}
                            <div className="flex items-center gap-3">
                                {/* Avatar con iniciales */}
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {initials}
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{displayName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{role.toLowerCase()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Contenido principal ── */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* ── Footer mínimo ── */}
            <footer className="border-t border-gray-200 dark:border-gray-700 py-4 text-center text-xs text-gray-400 dark:text-gray-500 transition-colors duration-200">
                FaceAttend © {new Date().getFullYear()} — Sistema de Asistencias con Reconocimiento Facial
            </footer>
        </div>
    );
};

export default MainLayout;
