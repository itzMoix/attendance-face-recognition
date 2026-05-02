import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, RefreshCw, User, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import studentService from '../../services/studentService';
import FaceRegistrationModal from '../camera/FaceRegistrationModal';

// ────────────────────────────────────────────────
// Modal para Crear / Editar estudiante
// ────────────────────────────────────────────────
const StudentModal = ({ isOpen, onClose, onSave, student }) => {
    const isEditing = !!student;
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        student_id: '',
        first_name: '',
        last_name: '',
        career: '',
        semester: 1,
        email: '',
        password: '',
        photo_url: '',
    });

    useEffect(() => {
        if (student) {
            setForm({
                student_id: student.student_id || '',
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                career: student.career || '',
                semester: student.semester || 1,
                email: student.user?.email || '',
                password: '',        // no se edita
                photo_url: student.photo_url || '',
            });
        } else {
            setForm({ student_id: '', first_name: '', last_name: '', career: '', semester: 1, email: '', password: '', photo_url: '' });
        }
    }, [student, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'semester' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                const updateData = { first_name: form.first_name, last_name: form.last_name, career: form.career, semester: form.semester, photo_url: form.photo_url || null };
                const updated = await studentService.update(student.id, updateData);
                onSave(updated, 'edit');
                toast.success('Estudiante actualizado correctamente');
            } else {
                const createData = { ...form, photo_url: form.photo_url || null };
                const created = await studentService.create(createData);
                onSave(created, 'create');
                toast.success('Estudiante creado correctamente');
                // Al crear, cerramos este modal y abrimos el de la cámara
                onClose();
                if (window.openFaceModal) {
                    window.openFaceModal(created);
                }
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Error al guardar';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Fila: Nombre / Apellido */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Nombre *</label>
                            <input name="first_name" value={form.first_name} onChange={handleChange} required className={inputClass} placeholder="Juan" />
                        </div>
                        <div>
                            <label className={labelClass}>Apellido *</label>
                            <input name="last_name" value={form.last_name} onChange={handleChange} required className={inputClass} placeholder="Pérez" />
                        </div>
                    </div>

                    {/* ID Estudiantil */}
                    {!isEditing && (
                        <div>
                            <label className={labelClass}>ID Estudiantil *</label>
                            <input name="student_id" value={form.student_id} onChange={handleChange} required className={inputClass} placeholder="EST-2024001" />
                        </div>
                    )}

                    {/* Carrera / Semestre */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Carrera *</label>
                            <select name="career" value={form.career} onChange={handleChange} required className={inputClass}>
                                <option value="">Seleccionar...</option>
                                <option value="Ingeniería en Sistemas">Ing. Sistemas</option>
                                <option value="Ingeniería en Software">Ing. Software</option>
                                <option value="Ingeniería en Redes">Ing. Redes</option>
                                <option value="Ciencias de la Computación">Ciencias Computación</option>
                                <option value="Ingeniería Industrial">Ing. Industrial</option>
                                <option value="Administración">Administración</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Semestre *</label>
                            <select name="semester" value={form.semester} onChange={handleChange} required className={inputClass}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                    <option key={s} value={s}>Semestre {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Email y Password (solo crear) */}
                    {!isEditing && (
                        <>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} placeholder="juan.perez@student.edu" />
                            </div>
                            <div>
                                <label className={labelClass}>Contraseña inicial *</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} className={inputClass} placeholder="Mínimo 8 caracteres" />
                            </div>
                        </>
                    )}

                    {/* Foto URL */}
                    <div>
                        <label className={labelClass}>URL de Foto (opcional)</label>
                        <input name="photo_url" value={form.photo_url} onChange={handleChange} className={inputClass} placeholder="https://..." />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Estudiante'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Modal de confirmación para eliminar
// ────────────────────────────────────────────────
const DeleteModal = ({ isOpen, onClose, onConfirm, student, loading }) => {
    if (!isOpen || !student) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Eliminar Estudiante</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    ¿Estás seguro de que quieres eliminar a <strong>{student.first_name} {student.last_name}</strong> ({student.student_id})?
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Componente principal StudentManagement
// ────────────────────────────────────────────────
const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
    const [faceModal, setFaceModal] = useState({ open: false, student: null });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Exponer la función globalmente solo para el Modal de creación
    useEffect(() => {
        window.openFaceModal = (student) => setFaceModal({ open: true, student });
        return () => delete window.openFaceModal;
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await studentService.list();
            setStudents(data.students);
            setTotal(data.total);
        } catch (err) {
            toast.error('Error al cargar estudiantes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const filteredStudents = students.filter(s =>
        (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.career?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenCreate = () => { setSelectedStudent(null); setModalOpen(true); };
    const handleOpenEdit = (student) => { setSelectedStudent(student); setModalOpen(true); };
    const handleOpenDelete = (student) => setDeleteModal({ open: true, student });
    const handleOpenFace = (student) => setFaceModal({ open: true, student });

    const handleSave = (saved, type) => {
        if (type === 'create') {
            setStudents(prev => [saved, ...prev]);
            setTotal(prev => prev + 1);
        } else {
            setStudents(prev => prev.map(s => s.id === saved.id ? saved : s));
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await studentService.delete(deleteModal.student.id);
            setStudents(prev => prev.filter(s => s.id !== deleteModal.student.id));
            setTotal(prev => prev - 1);
            toast.success('Estudiante eliminado correctamente');
            setDeleteModal({ open: false, student: null });
        } catch (err) {
            toast.error('Error al eliminar estudiante');
        } finally {
            setDeleting(false);
        }
    };

    const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

    return (
        <>
            <StudentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                student={selectedStudent}
            />
            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, student: null })}
                onConfirm={handleDelete}
                student={deleteModal.student}
                loading={deleting}
            />
            <FaceRegistrationModal
                isOpen={faceModal.open}
                onClose={() => setFaceModal({ open: false, student: null })}
                student={faceModal.student}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estudiantes</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {loading ? 'Cargando...' : `${total} alumno${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchStudents}
                            className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <User className="h-12 w-12 mb-3 opacity-40" />
                            <p className="text-sm font-medium">{searchTerm ? 'Sin resultados para tu búsqueda' : 'No hay estudiantes registrados'}</p>
                            {!searchTerm && (
                                <button onClick={handleOpenCreate} className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                                    + Crear primer estudiante
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Carrera</th>
                                    <th className="px-6 py-4">Semestre</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {student.photo_url ? (
                                                    <img className="h-10 w-10 rounded-full object-cover shadow-sm" src={student.photo_url} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                                                        {getInitials(student.first_name, student.last_name)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{student.first_name} {student.last_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{student.user?.email || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{student.student_id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{student.career}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                Sem. {student.semester}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenFace(student)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                    title="Registrar/Actualizar Rostro"
                                                >
                                                    <Camera className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(student)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete(student)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer con paginación */}
                {!loading && filteredStudents.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div>Mostrando {filteredStudents.length} de {total} estudiantes</div>
                    </div>
                )}
            </div>
        </>
    );
};

export default StudentManagement;
