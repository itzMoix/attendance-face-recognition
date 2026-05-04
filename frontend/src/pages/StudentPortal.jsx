import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle, XCircle, Clock,
    TrendingUp, User, BookOpen, Loader2, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../services/apiService';
import studentService from '../services/studentService';
import useAuthStore from '../store/authStore';
import FaceRegistrationModal from '../components/camera/FaceRegistrationModal';
import { Camera } from 'lucide-react';

// ─── Badge de confianza ───────────────────────────────────────────
const ConfidenceBadge = ({ score }) => {
    const pct = Math.round(score * 100);
    const color = score >= 0.8
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
        : score >= 0.6
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            <CheckCircle className="h-3 w-3" /> {pct}%
        </span>
    );
};

// ─── Tarjeta de asistencia individual ────────────────────────────
const AttendanceRow = ({ att }) => (
    <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${att.confidence_score >= 0.6 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {att.subject_name || 'Materia desconocida'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(att.check_in_time).toLocaleString('es-MX', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
        <ConfidenceBadge score={att.confidence_score} />
    </div>
);

// ─── Stat mini ───────────────────────────────────────────────────
const MiniStat = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

// ─── Portal del Estudiante ────────────────────────────────────────
const StudentPortal = () => {
    const { user } = useAuthStore();
    const [attendances, setAttendances] = useState([]);
    const [studentProfile, setStudentProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'week'
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const resAtt = await attendanceService.list({ limit: 100 });
                setAttendances(resAtt.attendances);
                
                const resStu = await studentService.list();
                if (resStu.students && resStu.students.length > 0) {
                    setStudentProfile(resStu.students[0]);
                }
            } catch {
                toast.error('Error al cargar tu información');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // Filtrar según pestaña
    const filtered = attendances.filter(a => {
        const date = new Date(a.check_in_time);
        const now = new Date();
        if (filter === 'today') {
            return date.toDateString() === now.toDateString();
        }
        if (filter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
        }
        return true;
    });

    // Calcular stats
    const today = attendances.filter(a =>
        new Date(a.check_in_time).toDateString() === new Date().toDateString()
    ).length;

    const thisWeek = attendances.filter(a => {
        const d = new Date(a.check_in_time);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
    }).length;

    const avgConfidence = attendances.length > 0
        ? attendances.reduce((s, a) => s + a.confidence_score, 0) / attendances.length
        : 0;

    // Agrupar por materia
    const bySubject = filtered.reduce((acc, a) => {
        const key = a.subject_name || 'Sin materia';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                        <User className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Portal</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                </div>
                
                {/* Botón de actualizar rostro */}
                {studentProfile && (
                    <button
                        onClick={() => setIsCameraModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm border border-indigo-100 dark:border-indigo-800"
                    >
                        <Camera className="h-5 w-5" />
                        <span className="hidden sm:inline">Actualizar Mi Rostro</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MiniStat label="Asistencias Hoy"      value={today}    icon={CheckCircle} color="bg-emerald-500" />
                    <MiniStat label="Esta Semana"           value={thisWeek} icon={Calendar}    color="bg-indigo-500" />
                    <MiniStat label="Total Registradas"     value={attendances.length} icon={Activity} color="bg-blue-500" />
                </div>
            )}

            {/* Confianza promedio */}
            {!loading && attendances.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-sm font-medium text-indigo-100">Confianza Promedio de Reconocimiento</p>
                    <div className="flex items-end gap-3 mt-2">
                        <p className="text-5xl font-bold">{Math.round(avgConfidence * 100)}%</p>
                        <p className="text-indigo-200 mb-1 text-sm">
                            {avgConfidence >= 0.8 ? '🟢 Excelente' : avgConfidence >= 0.6 ? '🟡 Bueno' : '🔴 Bajo'}
                        </p>
                    </div>
                    <div className="mt-4 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ width: `${Math.round(avgConfidence * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Historial */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Mi Historial de Asistencias</h3>
                        {/* Filtros */}
                        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {[['all','Todos'],['week','Semana'],['today','Hoy']].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${filter === key
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay asistencias en este período</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 px-5">
                        {filtered.map(a => <AttendanceRow key={a.id} att={a} />)}
                    </div>
                )}

                {/* Resumen por materia */}
                {!loading && Object.keys(bySubject).length > 0 && (
                    <div className="p-5 border-t border-gray-100 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500" /> Por Materia
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(bySubject).sort((a,b) => b[1]-a[1]).map(([name, count]) => (
                                <div key={name} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${(count / filtered.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modal de Registro de Rostro */}
            {isCameraModalOpen && studentProfile && (
                <FaceRegistrationModal
                    isOpen={isCameraModalOpen}
                    onClose={() => setIsCameraModalOpen(false)}
                    student={studentProfile}
                />
            )}
        </div>
    );
};

export default StudentPortal;
