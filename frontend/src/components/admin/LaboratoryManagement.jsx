import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Loader2, X, Save, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { laboratoryService } from '../../services/apiService';

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

const EMPTY = { name: '', location: '', capacity: '', camera_ip: '', is_active: true };

const LaboratoryManagement = () => {
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
            const res = await laboratoryService.list();
            setLabs(res.laboratories ?? []);
        } catch {
            toast.error('Error al cargar laboratorios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create'); };
    const openEdit = (lab) => {
        setSelected(lab);
        setForm({ name: lab.name, location: lab.location || '', capacity: lab.capacity || '', camera_ip: lab.camera_ip || '', is_active: lab.is_active });
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
            const payload = { ...form, capacity: parseInt(form.capacity) || 0 };
            if (modal === 'create') {
                await laboratoryService.create(payload);
                toast.success('Laboratorio creado');
            } else {
                await laboratoryService.update(selected.id, payload);
                toast.success('Laboratorio actualizado');
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (lab) => {
        if (!window.confirm(`¿Eliminar el laboratorio "${lab.name}"?`)) return;
        setDeleting(lab.id);
        try {
            await laboratoryService.delete(lab.id);
            toast.success('Laboratorio eliminado');
            load();
        } catch {
            toast.error('Error al eliminar laboratorio');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus className="h-4 w-4" /> Nuevo Laboratorio
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
            ) : labs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay laboratorios registrados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labs.map(lab => (
                        <div key={lab.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${lab.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        <Building2 className={`h-5 w-5 ${lab.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{lab.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lab.location || 'Sin ubicación'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(lab)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(lab)} disabled={deleting === lab.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50">
                                        {deleting === lab.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>Cap: <strong className="text-gray-700 dark:text-gray-300">{lab.capacity ?? '—'}</strong></span>
                                <span className="flex items-center gap-1">
                                    {lab.camera_ip ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-gray-400" />}
                                    {lab.camera_ip || 'Sin cámara'}
                                </span>
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${lab.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {lab.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <Modal title={modal === 'create' ? 'Nuevo Laboratorio' : 'Editar Laboratorio'} onClose={closeModal}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <Field label="Nombre *">
                            <input name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Lab de Cómputo A" />
                        </Field>
                        <Field label="Ubicación">
                            <input name="location" value={form.location} onChange={handleChange} className={inputCls} placeholder="Edificio 3, Planta Baja" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Capacidad">
                                <input name="capacity" type="number" min="0" value={form.capacity} onChange={handleChange} className={inputCls} placeholder="30" />
                            </Field>
                            <Field label="IP de Cámara">
                                <input name="camera_ip" value={form.camera_ip} onChange={handleChange} className={inputCls} placeholder="192.168.1.100" />
                            </Field>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded" />
                            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Laboratorio activo</label>
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

export default LaboratoryManagement;
