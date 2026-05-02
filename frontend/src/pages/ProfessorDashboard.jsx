import React, { useState, useEffect } from 'react';
import {
    BookOpen, Calendar, CheckCircle, Clock, Users,
    Loader2, RefreshCw, ChevronRight, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService, subjectService, exportToCSV } from '../services/apiService';
import useAuthStore from '../store/authStore';

// ─── Tarjeta de materia ───────────────────────────────────────────
const SubjectCard = ({ subject, onClick, selected }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-800'
            }`}
    >
        <div className="flex items-start justify-between">
            <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                    {subject.code}
                </span>
                <p className="mt-2 font-semibold text-gray-900 dark:text-white text-sm">{subject.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {subject.schedule}
                </p>
            </div>
            <ChevronRight className={`h-4 w-4 mt-1 transition-colors ${selected ? 'text-indigo-500' : 'text-gray-300'}`} />
        </div>
    </button>
);

// ─── Tabla de asistencias de la materia ──────────────────────────
const AttendanceTable = ({ attendances, loading, subjectName }) => {
    const handleExport = () => {
        const rows = attendances.map(a => ({
            Estudiante: a.student_name || '',
            Confianza: `${(a.confidence_score * 100).toFixed(0)}%`,
            Fecha: new Date(a.check_in_time).toLocaleString('es-MX'),
        }));
        exportToCSV(rows, `asistencias-${(subjectName || 'materia').replace(/\s+/g, '-')}.csv`);
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        {subjectName ? `Asistencias — ${subjectName}` : 'Selecciona una materia'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {attendances.length > 0 ? `${attendances.length} registros` : 'Sin registros aún'}
                    </p>
                </div>
                {attendances.length > 0 && (
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                    >
                        ↓ Exportar CSV
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                    </div>
                ) : !subjectName ? (
                    <div className="text-center py-16 text-gray-400">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Selecciona una materia para ver sus asistencias</p>
                    </div>
                ) : attendances.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay asistencias para esta materia</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="px-5 py-3">Estudiante</th>
                                <th className="px-5 py-3">Confianza</th>
                                <th className="px-5 py-3">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {attendances.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                {a.student_name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{a.student_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            a.confidence_score >= 0.8 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : a.confidence_score >= 0.6 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {(a.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(a.check_in_time).toLocaleString('es-MX', {
                                            day: '2-digit', month: 'short', year: 'numeric',
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
};


// ─── Dashboard del Profesor ───────────────────────────────────────
const ProfessorDashboard = () => {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [attendances, setAttendances] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingAtt, setLoadingAtt] = useState(false);
    const [totalToday, setTotalToday] = useState(0);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await subjectService.list({ is_active: true });
                setSubjects(res.subjects);
            } catch {
                toast.error('Error al cargar materias');
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (!selectedSubject) return;
        const fetchAtt = async () => {
            setLoadingAtt(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const [allRes, todayRes] = await Promise.all([
                    attendanceService.list({ subject_id: selectedSubject.id, limit: 50 }),
                    attendanceService.list({ subject_id: selectedSubject.id, date: today, limit: 200 }),
                ]);
                setAttendances(allRes.attendances);
                setTotalToday(todayRes.total);
            } catch {
                toast.error('Error al cargar asistencias');
            } finally {
                setLoadingAtt(false);
            }
        };
        fetchAtt();
    }, [selectedSubject]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard del Profesor</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bienvenido, <span className="font-medium text-indigo-600 dark:text-indigo-400">{user?.email}</span>
                </p>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mis Materias</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {loadingSubjects ? '—' : subjects.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Asistencias Hoy</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {selectedSubject ? totalToday : '—'}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Materia Activa</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {selectedSubject?.name || 'Ninguna seleccionada'}
                    </p>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Lista de materias */}
                <div className="lg:w-72 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500" /> Mis Materias
                        </h3>
                        {loadingSubjects ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                            </div>
                        ) : subjects.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">Sin materias asignadas</p>
                        ) : (
                            <div className="space-y-2">
                                {subjects.map(s => (
                                    <SubjectCard
                                        key={s.id}
                                        subject={s}
                                        onClick={() => setSelectedSubject(s)}
                                        selected={selectedSubject?.id === s.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabla de asistencias */}
                <AttendanceTable
                    attendances={attendances}
                    loading={loadingAtt}
                    subjectName={selectedSubject?.name}
                />
            </div>
        </div>
    );
};

export default ProfessorDashboard;
