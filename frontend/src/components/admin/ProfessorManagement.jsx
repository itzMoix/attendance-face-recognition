import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Loader2, X, Save, Search, GraduationCap } from 'lucide-react';
import { toast } from 'react-toastify';
import { professorService, laboratoryService, subjectService } from '../../services/apiService';

// ─── Modal reutilizable ───────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
    </div>
);

// ─── Campo de formulario ──────────────────────────────────────────
const Field = ({ label, children }) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors";

const EMPTY_FORM = { first_name: '', last_name: '', employee_id: '', department: '', email: '', password: '' };

// ─── Componente Principal ────────────────────────────────────────
const ProfessorManagement = () => {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | 'create' | 'edit'
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await professorService.list();
            setProfessors(res.professors ?? []);
        } catch {
            toast.error('Error al cargar profesores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = professors.filter(p =>
        `${p.first_name} ${p.last_name} ${p.employee_id} ${p.department}`.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setSelected(null);
        setModal('create');
    };

    const openEdit = (prof) => {
        setSelected(prof);
        setForm({
            first_name: prof.first_name,
            last_name: prof.last_name,
            employee_id: prof.employee_id,
            department: prof.department || '',
            email: '',
            password: '',
        });
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setSelected(null); };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (modal === 'create') {
                await professorService.create(form);
                toast.success('Profesor creado correctamente');
            } else {
                const updateData = { first_name: form.first_name, last_name: form.last_name, employee_id: form.employee_id, department: form.department };
                await professorService.update(selected.id, updateData);
                toast.success('Profesor actualizado');
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al guardar profesor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (prof) => {
        if (!window.confirm(`¿Eliminar al profesor ${prof.first_name} ${prof.last_name}?`)) return;
        setDeleting(prof.id);
        try {
            await professorService.delete(prof.id);
            toast.success('Profesor eliminado');
            load();
        } catch {
            toast.error('Error al eliminar profesor');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar profesores..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Nuevo Profesor
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{search ? 'Sin coincidencias' : 'No hay profesores registrados'}</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Nombre</th>
                                <th className="px-5 py-3 hidden md:table-cell">No. Empleado</th>
                                <th className="px-5 py-3 hidden lg:table-cell">Departamento</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filtered.map(prof => (
                                <tr key={prof.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold">
                                                {prof.first_name?.[0]}{prof.last_name?.[0]}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {prof.first_name} {prof.last_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400 font-mono">{prof.employee_id}</td>
                                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">{prof.department || '—'}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(prof)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prof)}
                                                disabled={deleting === prof.id}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                            >
                                                {deleting === prof.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            {!loading && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                    {filtered.length} de {professors.length} profesores
                </p>
            )}

            {/* Modal Crear / Editar */}
            {modal && (
                <Modal title={modal === 'create' ? 'Nuevo Profesor' : 'Editar Profesor'} onClose={closeModal}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Nombre *">
                                <input name="first_name" required value={form.first_name} onChange={handleChange} className={inputCls} placeholder="Juan" />
                            </Field>
                            <Field label="Apellido *">
                                <input name="last_name" required value={form.last_name} onChange={handleChange} className={inputCls} placeholder="García" />
                            </Field>
                        </div>
                        <Field label="No. Empleado *">
                            <input name="employee_id" required value={form.employee_id} onChange={handleChange} className={inputCls} placeholder="EMP-001" disabled={modal === 'edit'} />
                        </Field>
                        <Field label="Departamento">
                            <input name="department" value={form.department} onChange={handleChange} className={inputCls} placeholder="Ingeniería en Sistemas" />
                        </Field>
                        {modal === 'create' && (
                            <>
                                <Field label="Email *">
                                    <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputCls} placeholder="profesor@universidad.edu" />
                                </Field>
                                <Field label="Contraseña *">
                                    <input name="password" type="password" required value={form.password} onChange={handleChange} className={inputCls} placeholder="Mínimo 8 caracteres" />
                                </Field>
                            </>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ProfessorManagement;
