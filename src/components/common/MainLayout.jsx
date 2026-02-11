import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

const MainLayout = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
            <header className="bg-white dark:bg-gray-800 shadow-sm z-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">FaceAttend</span>
                            </div>
                            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/admin" className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    Admin
                                </Link>
                                <Link to="/professor" className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    Professor
                                </Link>
                                <Link to="/student" className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    Student
                                </Link>
                                <Link to="/live" className="border-transparent text-red-500 dark:text-red-400 hover:border-red-700 dark:hover:border-red-300 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    Live Cam
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
