import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Users, BookOpen, CheckCircle,
    Loader2, RefreshCw, Activity, Download, ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import { reportService, subjectService, exportToCSV } from '../services/apiService';
import studentService from '../services/studentService';

// ─── Mini tarjeta de stat ──────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{sub}</p>}
            </div>
        </div>
    </div>
);

// ─── Barra de tendencia diaria ─────────────────────────────────────
const DailyBar = ({ item, max }) => {
    const pct = max > 0 ? (item.count / max) * 100 : 0;
    return (
        <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.count}</span>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-sm" style={{ height: 80 }}>
                <div
                    className="w-full bg-indigo-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">{item.label}</span>
        </div>
    );
};

// ─── Tabla de estudiantes por materia ─────────────────────────────
const StudentTable = ({ students, subjectName, onExport }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{subjectName || 'Selecciona una materia'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {students.length > 0 ? `${students.length} estudiante(s) con asistencia` : 'Sin datos aún'}
                </p>
            </div>
            {students.length > 0 && (
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Download className="h-4 w-4" /> CSV
                </button>
            )}
        </div>
        {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay datos para esta materia</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="px-5 py-3">Estudiante</th>
                            <th className="px-5 py-3">Carrera</th>
                            <th className="px-5 py-3 text-center">Asistencias</th>
                            <th className="px-5 py-3 text-center">Confianza Prom.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {students.map((s) => (
                            <tr key={s.student_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                            {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{s.full_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{s.student_code}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{s.career}</td>
                                <td className="px-5 py-3 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                        {s.attendance_count}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.avg_confidence >= 0.8 ? 'bg-emerald-500' : s.avg_confidence >= 0.6 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                style={{ width: `${s.avg_confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-semibold ${s.avg_confidence >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : s.avg_confidence >= 0.6 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {Math.round(s.avg_confidence * 100)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

// ─── Página principal ──────────────────────────────────────────────
const ReportsDashboard = () => {
    const [stats, setStats]             = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [subjects, setSubjects]       = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectReport, setSubjectReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Cargar estadísticas generales y lista de materias al montar
    useEffect(() => {
        const init = async () => {
            try {
                const [statsData, subjectsData] = await Promise.all([
                    reportService.getStatistics(),
                    subjectService.list({ is_active: true }),
                ]);
                setStats(statsData);
                setSubjects(subjectsData.subjects || []);
            } catch (err) {
                console.error(err);
                toast.error('Error al cargar estadísticas');
            } finally {
                setLoadingStats(false);
            }
        };
        init();
    }, []);

    // Cargar reporte por materia cuando se selecciona una
    useEffect(() => {
        if (!selectedSubject) return;
        const fetchReport = async () => {
            setLoadingReport(true);
            try {
                const data = await reportService.getSubjectReport(selectedSubject.id);
                setSubjectReport(data);
            } catch (err) {
                toast.error('Error al cargar el reporte de la materia');
            } finally {
                setLoadingReport(false);
            }
        };
        fetchReport();
    }, [selectedSubject]);

    const handleExportSubject = () => {
        if (!subjectReport?.students) return;
        const rows = subjectReport.students.map(s => ({
            'Nombre': s.full_name,
            'ID Estudiantil': s.student_code,
            'Carrera': s.career,
            'Asistencias': s.attendance_count,
            'Confianza Promedio': `${Math.round(s.avg_confidence * 100)}%`,
        }));
        exportToCSV(rows, `reporte-${subjectReport.subject?.code || 'materia'}.csv`);
        toast.success('CSV exportado');
    };

    const maxDay = stats ? Math.max(...(stats.daily_trend?.map(d => d.count) || [1])) : 1;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        Reportes y Estadísticas
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Resumen general del sistema y análisis por materia
                    </p>
                </div>
                <button
                    onClick={() => { setLoadingStats(true); reportService.getStatistics().then(setStats).finally(() => setLoadingStats(false)); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} /> Actualizar
                </button>
            </div>

            {/* Stat Cards */}
            {loadingStats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Asistencias Hoy"   value={stats.attendance?.today}      icon={CheckCircle} color="bg-emerald-500" sub={`${stats.attendance?.this_week} esta semana`} />
                    <StatCard label="Total Estudiantes"  value={stats.totals?.students}        icon={Users}       color="bg-indigo-500" />
                    <StatCard label="Materias Activas"   value={stats.totals?.subjects}        icon={BookOpen}    color="bg-amber-500" />
                    <StatCard label="Confianza Promedio" value={`${Math.round((stats.attendance?.avg_confidence || 0) * 100)}%`} icon={TrendingUp} color="bg-purple-500" sub={`${stats.attendance?.this_month} este mes`} />
                </div>
            )}

            {/* Gráfica de tendencia diaria */}
            {stats?.daily_trend && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-500" /> Asistencias — Últimos 7 días
                    </h3>
                    <div className="flex items-end gap-3 h-28">
                        {stats.daily_trend.map((item) => (
                            <DailyBar key={item.date} item={item} max={maxDay || 1} />
                        ))}
                    </div>
                </div>
            )}

            {/* Reporte por Materia */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Reporte por Materia</h3>
                    <div className="relative w-full sm:w-72">
                        <select
                            value={selectedSubject?.id || ''}
                            onChange={(e) => {
                                const s = subjects.find(s => s.id === e.target.value);
                                setSelectedSubject(s || null);
                                setSubjectReport(null);
                            }}
                            className="w-full appearance-none px-3 py-2 pr-9 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Seleccionar materia...</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="p-5">
                    {loadingReport ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        <StudentTable
                            students={subjectReport?.students || []}
                            subjectName={subjectReport ? `${subjectReport.subject?.code} — ${subjectReport.subject?.name}` : null}
                            onExport={handleExportSubject}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
