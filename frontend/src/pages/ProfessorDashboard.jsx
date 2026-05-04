import React, { useState, useEffect, useCallback } from 'react';
import {
    BookOpen, Calendar, CheckCircle, Clock, Users,
    Loader2, RefreshCw, ChevronRight, Activity,
    Plus, Pencil, Trash2, X, FlaskConical, Save,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    attendanceService, subjectService, laboratoryService, exportToCSV,
} from '../services/apiService';
import useAuthStore from '../store/authStore';

// ─── Modal crear / editar clase ────────────────────────────────────
const SubjectModal = ({ open, onClose, onSaved, editingSubject, labs }) => {
    const emptyForm = { code: '', name: '', schedule: '', laboratory_id: '', is_active: true };
    const [form, setForm]       = useState(emptyForm);
    const [saving, setSaving]   = useState(false);

    // Cuando se abre para editar, pre-carga los valores
    useEffect(() => {
        if (editingSubject) {
            setForm({
                code: editingSubject.code,
                name: editingSubject.name,
                schedule: editingSubject.schedule,
                laboratory_id: editingSubject.laboratory_id,
                is_active: editingSubject.is_active,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editingSubject, open]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.laboratory_id) { toast.warn('Selecciona un laboratorio'); return; }
        setSaving(true);
        try {
            if (editingSubject) {
                await subjectService.update(editingSubject.id, {
                    name: form.name,
                    schedule: form.schedule,
                    laboratory_id: form.laboratory_id,
                    is_active: form.is_active,
                });
                toast.success('Clase actualizada correctamente');
            } else {
                await subjectService.create({
                    code: form.code,
                    name: form.name,
                    schedule: form.schedule,
                    laboratory_id: form.laboratory_id,
                    is_active: form.is_active,
                    // professor_id es auto-asignado por el backend para profesores
                });
                toast.success('Clase creada correctamente');
            }
            onSaved();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error al guardar la clase';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const field = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        {editingSubject ? 'Editar Clase' : 'Nueva Clase / Conferencia'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Código solo al crear */}
                    {!editingSubject && field('Código', 'code', 'text', 'Ej: CS-101')}

                    {field('Nombre de la clase', 'name', 'text', 'Ej: Redes de Computadoras')}
                    {field('Horario', 'schedule', 'text', 'Ej: Lunes y Miércoles 08:00-10:00')}

                    {/* Laboratorio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Laboratorio
                        </label>
                        <select
                            value={form.laboratory_id}
                            onChange={e => setForm(f => ({ ...f, laboratory_id: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                            <option value="">— Seleccionar laboratorio —</option>
                            {labs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estado activo/inactivo (solo al editar) */}
                    {editingSubject && (
                        <div className="flex items-center justify-between py-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</span>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                className="flex items-center gap-2 text-sm font-medium"
                            >
                                {form.is_active
                                    ? <><ToggleRight className="h-6 w-6 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Activa</span></>
                                    : <><ToggleLeft className="h-6 w-6 text-gray-400" /><span className="text-gray-500">Inactiva</span></>
                                }
                            </button>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                       text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50
                                       dark:hover:bg-gray-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                                       bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white
                                       text-sm font-medium transition"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editingSubject ? 'Guardar cambios' : 'Crear clase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Tarjeta de materia ───────────────────────────────────────────
const SubjectCard = ({ subject, onClick, selected, onEdit, onDelete }) => (
    <div className={`rounded-xl border-2 transition-all ${selected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-800'
        }`}
    >
        <button onClick={onClick} className="w-full text-left p-4">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        {subject.code}
                    </span>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-white text-sm truncate">{subject.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{subject.schedule}</span>
                    </p>
                    {subject.laboratory && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <FlaskConical className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{subject.laboratory.name}</span>
                        </p>
                    )}
                </div>
                <ChevronRight className={`h-4 w-4 mt-1 flex-shrink-0 transition-colors ${selected ? 'text-indigo-500' : 'text-gray-300'}`} />
            </div>
        </button>

        {/* Acciones rápidas */}
        <div className="flex border-t border-gray-100 dark:border-gray-700">
            <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium
                           text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400
                           hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-bl-xl transition"
            >
                <Pencil className="h-3 w-3" /> Editar
            </button>
            <div className="w-px bg-gray-100 dark:bg-gray-700" />
            <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium
                           text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-900/10 rounded-br-xl transition"
            >
                <Trash2 className="h-3 w-3" /> Eliminar
            </button>
        </div>
    </div>
);

// ─── Tabla de asistencias ─────────────────────────────────────────
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
                                                {a.student_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{a.student_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.confidence_score >= 0.8
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : a.confidence_score >= 0.6
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
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

// ─── Confirmación de eliminación ──────────────────────────────────
const ConfirmDeleteModal = ({ subject, onConfirm, onCancel }) => {
    if (!subject) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Eliminar clase</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    ¿Estás seguro de eliminar <strong className="text-gray-900 dark:text-white">{subject.name}</strong>?
                    Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Dashboard del Profesor ───────────────────────────────────────
const ProfessorDashboard = () => {
    const { user } = useAuthStore();
    const [subjects, setSubjects]               = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [attendances, setAttendances]         = useState([]);
    const [labs, setLabs]                       = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingAtt, setLoadingAtt]           = useState(false);
    const [totalToday, setTotalToday]           = useState(0);

    // Modal states
    const [showModal, setShowModal]         = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [deleteTarget, setDeleteTarget]   = useState(null);

    // ── Carga de materias ──
    const fetchSubjects = useCallback(async () => {
        setLoadingSubjects(true);
        try {
            const res = await subjectService.list({});
            setSubjects(res.subjects);
        } catch {
            toast.error('Error al cargar materias');
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    // ── Carga de laboratorios ──
    useEffect(() => {
        fetchSubjects();
        laboratoryService.list()
            .then(res => setLabs(res.laboratories || []))
            .catch(() => toast.error('Error al cargar laboratorios'));
    }, [fetchSubjects]);

    // ── Asistencias de la materia seleccionada ──
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

    // ── Eliminar ──
    const handleDelete = async () => {
        try {
            await subjectService.delete(deleteTarget.id);
            toast.success('Clase eliminada');
            if (selectedSubject?.id === deleteTarget.id) setSelectedSubject(null);
            setDeleteTarget(null);
            fetchSubjects();
        } catch {
            toast.error('Error al eliminar la clase');
        }
    };

    const openCreate = () => { setEditingSubject(null); setShowModal(true); };
    const openEdit   = (s) => { setEditingSubject(s); setShowModal(true); };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard del Profesor</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Bienvenido, <span className="font-medium text-indigo-600 dark:text-indigo-400">{user?.email}</span>
                    </p>
                </div>
                <button
                    id="btn-nueva-clase"
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700
                               text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4" /> Nueva Clase
                </button>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mis Clases</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clase Activa</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {selectedSubject?.name || 'Ninguna seleccionada'}
                    </p>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Lista de materias */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-500" /> Mis Clases
                            </h3>
                            <button
                                onClick={fetchSubjects}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Recargar"
                            >
                                <RefreshCw className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        {loadingSubjects ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                            </div>
                        ) : subjects.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Sin clases creadas</p>
                                <button
                                    onClick={openCreate}
                                    className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    + Crear primera clase
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {subjects.map(s => (
                                    <SubjectCard
                                        key={s.id}
                                        subject={s}
                                        onClick={() => setSelectedSubject(s)}
                                        selected={selectedSubject?.id === s.id}
                                        onEdit={() => openEdit(s)}
                                        onDelete={() => setDeleteTarget(s)}
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

            {/* Modales */}
            <SubjectModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSaved={fetchSubjects}
                editingSubject={editingSubject}
                labs={labs}
            />
            <ConfirmDeleteModal
                subject={deleteTarget}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default ProfessorDashboard;
