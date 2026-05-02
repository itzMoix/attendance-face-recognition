import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Loader2, X, Save, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { subjectService, professorService, laboratoryService } from '../../services/apiService';

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

const Field = ({ label, children }) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {children}
    </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors";

const EMPTY = { code: '', name: '', professor_id: '', laboratory_id: '', schedule: '', is_active: true };

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const [subjRes, profRes, labRes] = await Promise.all([
                subjectService.list(),
                professorService.list(),
                laboratoryService.list(),
            ]);
            setSubjects(subjRes.subjects ?? []);
            setProfessors(profRes.professors ?? []);
            setLabs(labRes.laboratories ?? []);
        } catch {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create'); };
    const openEdit = (subj) => {
        setSelected(subj);
        setForm({
            code: subj.code,
            name: subj.name,
            professor_id: subj.professor_id || '',
            laboratory_id: subj.laboratory_id || '',
            schedule: subj.schedule || '',
            is_active: subj.is_active,
        });
        setModal('edit');
    };
    const closeModal = () => { setModal(null); setSelected(null); };
    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: val });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                professor_id: form.professor_id || null,
                laboratory_id: form.laboratory_id || null,
            };
            if (modal === 'create') {
                await subjectService.create(payload);
                toast.success('Materia creada');
            } else {
                await subjectService.update(selected.id, payload);
                toast.success('Materia actualizada');
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al guardar materia');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (subj) => {
        if (!window.confirm(`¿Eliminar la materia "${subj.name}"?`)) return;
        setDeleting(subj.id);
        try {
            await subjectService.delete(subj.id);
            toast.success('Materia eliminada');
            load();
        } catch {
            toast.error('Error al eliminar materia');
        } finally {
            setDeleting(null);
        }
    };

    const getProfName = (pid) => {
        const p = professors.find(x => x.id === pid);
        return p ? `${p.first_name} ${p.last_name}` : '—';
    };
    const getLabName = (lid) => {
        const l = labs.find(x => x.id === lid);
        return l ? l.name : '—';
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus className="h-4 w-4" /> Nueva Materia
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No hay materias registradas</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Materia</th>
                                <th className="px-5 py-3 hidden md:table-cell">Profesor</th>
                                <th className="px-5 py-3 hidden lg:table-cell">Horario</th>
                                <th className="px-5 py-3 hidden lg:table-cell">Estado</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {subjects.map(subj => (
                                <tr key={subj.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                                                {subj.code}
                                            </span>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{subj.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">{getProfName(subj.professor_id)}</td>
                                    <td className="px-5 py-3 hidden lg:table-cell">
                                        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="h-3.5 w-3.5" /> {subj.schedule || '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 hidden lg:table-cell">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${subj.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            {subj.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {subj.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(subj)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(subj)} disabled={deleting === subj.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                                                {deleting === subj.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'create' ? 'Nueva Materia' : 'Editar Materia'} onClose={closeModal}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Código *">
                                <input name="code" required value={form.code} onChange={handleChange} className={inputCls} placeholder="ISC-401" disabled={modal === 'edit'} />
                            </Field>
                            <Field label="Horario">
                                <input name="schedule" value={form.schedule} onChange={handleChange} className={inputCls} placeholder="Lun-Mié 10:00-12:00" />
                            </Field>
                        </div>
                        <Field label="Nombre *">
                            <input name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Programación Web" />
                        </Field>
                        <Field label="Profesor">
                            <select name="professor_id" value={form.professor_id} onChange={handleChange} className={inputCls}>
                                <option value="">— Sin asignar —</option>
                                {professors.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Laboratorio">
                            <select name="laboratory_id" value={form.laboratory_id} onChange={handleChange} className={inputCls}>
                                <option value="">— Sin asignar —</option>
                                {labs.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </Field>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="is_active_subj" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded" />
                            <label htmlFor="is_active_subj" className="text-sm text-gray-700 dark:text-gray-300">Materia activa</label>
                        </div>
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

export default SubjectManagement;
