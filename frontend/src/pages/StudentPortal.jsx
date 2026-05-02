import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, BookOpen, User, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { reportService } from '../services/apiService';
import useAuthStore from '../store/authStore';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

const StudentPortal = () => {
    const { user } = useAuthStore();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!user?.student_id) {
                setLoading(false);
                return;
            }
            try {
                const data = await reportService.getStudentReport(user.student_id);
                setReport(data);
            } catch (err) {
                toast.error('Error al cargar tu reporte de asistencias');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [user?.student_id]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando tu portal...</p>
            </div>
        );
    }

    if (!user?.student_id && !loading) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-10">
                <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Perfil incompleto</h3>
                <p className="text-amber-700 dark:text-amber-500 mt-2">
                    Tu usuario no tiene un registro de estudiante vinculado. Contacta al administrador para asignar tu ID de estudiante.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Bienvenida */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Mi Portal Escolar</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Bienvenido, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{report?.student?.full_name || user?.email}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Asistencias" 
                    value={report?.summary?.total_attendances || 0} 
                    icon={CheckCircle} 
                    color="bg-emerald-500 shadow-emerald-200 dark:shadow-none" 
                />
                <StatCard 
                    title="Promedio Confianza" 
                    value={`${((report?.summary?.avg_confidence || 0) * 100).toFixed(0)}%`} 
                    icon={TrendingUp} 
                    color="bg-blue-500 shadow-blue-200 dark:shadow-none" 
                />
                <StatCard 
                    title="Materias Activas" 
                    value={report?.by_subject?.length || 0} 
                    icon={BookOpen} 
                    color="bg-amber-500 shadow-amber-200 dark:shadow-none" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tabla de asistencias detallada */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-500" />
                                Historial Reciente
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            {!report?.recent_attendances?.length ? (
                                <div className="text-center py-20 text-gray-400">
                                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-10" />
                                    <p>No tienes asistencias registradas aún</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Materia</th>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Hora</th>
                                            <th className="px-6 py-4">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {report.recent_attendances.map((a, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {a.subject_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(a.check_in_time).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                    {new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Presente
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resumen por materia */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Resumen por Materia
                        </h3>
                        <div className="space-y-6">
                            {report?.by_subject?.map((s, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.subject_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.count} asistencias</p>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            {Math.round(s.avg_confidence * 100)}% conf.
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${s.avg_confidence * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {!report?.by_subject?.length && (
                                <p className="text-sm text-gray-400 text-center py-4">No hay datos por materia</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPortal;
