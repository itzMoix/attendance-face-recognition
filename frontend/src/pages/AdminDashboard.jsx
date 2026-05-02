import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Activity, TrendingUp, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import StudentManagement from '../components/admin/StudentManagement';
import ProfessorManagement from '../components/admin/ProfessorManagement';
import LaboratoryManagement from '../components/admin/LaboratoryManagement';
import SubjectManagement from '../components/admin/SubjectManagement';
import { attendanceService, professorService, subjectService } from '../services/apiService';
import studentService from '../services/studentService';
import useAuthStore from '../store/authStore';

// ─── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub, loading }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
        <div className="p-5">
            <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg p-3 ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin text-gray-300" /> : value}
                    </dd>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-2.5">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{sub}</span>
        </div>
    </div>
);

// ─── Tabla de asistencias recientes ───────────────────────────────
const RecentAttendances = ({ attendances, loading }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Asistencias Recientes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Últimos registros del sistema</p>
        </div>
        <div className="overflow-x-auto">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
            ) : attendances.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay asistencias registradas aún</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3">Estudiante</th>
                            <th className="px-6 py-3">Materia</th>
                            <th className="px-6 py-3">Confianza</th>
                            <th className="px-6 py-3">Hora</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {attendances.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    {a.student_name || '—'}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                                    {a.subject_name || '—'}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 w-16">
                                            <div
                                                className={`h-1.5 rounded-full ${a.confidence_score >= 0.8 ? 'bg-emerald-500' : a.confidence_score >= 0.6 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                style={{ width: `${(a.confidence_score * 100).toFixed(0)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {(a.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">
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
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'professors' | 'laboratories' | 'subjects'

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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Bienvenido, <span className="font-medium text-indigo-600 dark:text-indigo-400">{user?.email}</span>
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-fit">
                {[
                    ['overview',     'Resumen'],
                    ['students',     'Estudiantes'],
                    ['professors',   'Profesores'],
                    ['laboratories', 'Laboratorios'],
                    ['subjects',     'Materias'],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Estudiantes"  value={stats.students}         icon={Users}         color="bg-indigo-600" sub="Alumnos registrados"     loading={loading} />
                        <StatCard title="Asistencias Hoy"    value={stats.attendancesToday}  icon={CheckCircle}   color="bg-emerald-500" sub="Registros de hoy"       loading={loading} />
                        <StatCard title="Profesores"         value={stats.professors}        icon={GraduationCap} color="bg-blue-500"   sub="Docentes activos"        loading={loading} />
                        <StatCard title="Materias"           value={stats.subjects}          icon={BookOpen}      color="bg-amber-500"  sub="Asignaturas activas"     loading={loading} />
                    </div>

                    {/* Asistencias recientes */}
                    <RecentAttendances attendances={recentAttendances} loading={loading} />
                </>
            )}

            {activeTab === 'students'     && <StudentManagement />}
            {activeTab === 'professors'   && <ProfessorManagement />}
            {activeTab === 'laboratories' && <LaboratoryManagement />}
            {activeTab === 'subjects'     && <SubjectManagement />}
        </div>
    );
};

export default AdminDashboard;
