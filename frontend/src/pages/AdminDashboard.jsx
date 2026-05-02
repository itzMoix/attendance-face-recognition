import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Activity, CheckCircle, Loader2, RefreshCw, Video, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import StudentManagement from '../components/admin/StudentManagement';
import ProfessorManagement from '../components/admin/ProfessorManagement';
import LaboratoryManagement from '../components/admin/LaboratoryManagement';
import SubjectManagement from '../components/admin/SubjectManagement';
import { attendanceService, professorService, subjectService } from '../services/apiService';
import studentService from '../services/studentService';
import useAuthStore from '../store/authStore';

// ─── Stat Card Premium ────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, trend, loading }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
        <div className="p-5">
            <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg p-3 ${color} shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                        <dd className="flex items-baseline">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-400" /> : value}
                            </div>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 px-5 py-3 border-t border-gray-50 dark:border-gray-700">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {trend}
            </div>
        </div>
    </div>
);

// ─── Tabla de asistencias recientes ───────────────────────────────
const RecentAttendances = ({ attendances, loading }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Asistencias Recientes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Últimos registros detectados por el sistema</p>
            </div>
            <Activity className="h-5 w-5 text-indigo-500 opacity-50" />
        </div>
        <div className="overflow-x-auto">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
            ) : attendances.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No hay asistencias registradas aún</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Estudiante</th>
                            <th className="px-6 py-4">Materia</th>
                            <th className="px-6 py-4">Precisión</th>
                            <th className="px-6 py-4">Fecha y Hora</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {attendances.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                            {a.student_name?.slice(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {a.student_name || 'Estudiante Desconocido'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                        {a.subject_name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 w-16 overflow-hidden">
                                            <div
                                                className={`h-1.5 rounded-full ${a.confidence_score >= 0.8 ? 'bg-emerald-500' : a.confidence_score >= 0.6 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                style={{ width: `${(a.confidence_score * 100).toFixed(0)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {(a.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(a.check_in_time).toLocaleString('es-MX', {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
);

// ─── Dashboard principal ───────────────────────────────────────────
const AdminDashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ students: 0, professors: 0, subjects: 0, attendancesToday: 0 });
    const [recentAttendances, setRecentAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); 

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [studentsRes, professorsRes, subjectsRes, attendancesRes, todayRes] = await Promise.all([
                studentService.list({ limit: 1 }),
                professorService.list(),
                subjectService.list(),
                attendanceService.list({ limit: 8 }),
                attendanceService.list({ limit: 200, date: today }),
            ]);
            setStats({
                students: studentsRes.total,
                professors: professorsRes.total,
                subjects: subjectsRes.total,
                attendancesToday: todayRes.total,
            });
            setRecentAttendances(attendancesRes.attendances);
        } catch (err) {
            toast.error('Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl tracking-tight">Panel de Control</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Bienvenido de nuevo, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.email?.split('@')[0]}</span>
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sincronizar</span>
                </button>
            </div>

            {/* Tabs Premium */}
            <div className="bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-2xl flex flex-wrap gap-1 w-full sm:w-fit border border-gray-200/50 dark:border-gray-700/50">
                {[
                    ['overview',     'Vista General', Activity],
                    ['students',     'Estudiantes',   Users],
                    ['professors',   'Profesores',    GraduationCap],
                    ['laboratories', 'Laboratorios',  Video],
                    ['subjects',     'Materias',      BookOpen],
                ].map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === key
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm scale-100'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    >
                        <Icon className={`h-4 w-4 ${activeTab === key ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-slideUp">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard 
                            title="Total Estudiantes" 
                            value={stats.students} 
                            icon={Users} 
                            color="bg-indigo-600" 
                            trend={`${stats.students > 0 ? '+'+stats.students : '0'} registrados`} 
                            loading={loading} 
                        />
                        <StatCard 
                            title="Asistencias Hoy" 
                            value={stats.attendancesToday} 
                            icon={CheckCircle} 
                            color="bg-emerald-500" 
                            trend="Actividad en tiempo real" 
                            loading={loading} 
                        />
                        <StatCard 
                            title="Profesores" 
                            value={stats.professors} 
                            icon={GraduationCap} 
                            color="bg-blue-500" 
                            trend="Docentes asignados" 
                            loading={loading} 
                        />
                        <StatCard 
                            title="Materias Activas" 
                            value={stats.subjects} 
                            icon={BookOpen} 
                            color="bg-amber-500" 
                            trend="Cursos en curso" 
                            loading={loading} 
                        />
                    </div>

                    {/* Asistencias recientes */}
                    <RecentAttendances attendances={recentAttendances} loading={loading} />
                </div>
            )}

            {activeTab === 'students'     && <div className="animate-slideUp"><StudentManagement /></div>}
            {activeTab === 'professors'   && <div className="animate-slideUp"><ProfessorManagement /></div>}
            {activeTab === 'laboratories' && <div className="animate-slideUp"><LaboratoryManagement /></div>}
            {activeTab === 'subjects'     && <div className="animate-slideUp"><SubjectManagement /></div>}
        </div>
    );
};

export default AdminDashboard;
