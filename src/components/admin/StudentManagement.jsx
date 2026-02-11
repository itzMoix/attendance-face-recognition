import React, { useState } from 'react';
import { Search, Plus, User, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { mockStudents } from '../../services/mockData';

const StudentManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = mockStudents.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.includes(searchTerm)
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estudiantes</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de alumnos matriculados</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar estudiante..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 transition-colors duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus className="h-4 w-4" />
                        Nuevo Estudiante
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                            <th className="px-6 py-4">Estudiante</th>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Carrera</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img className="h-10 w-10 rounded-full object-cover shadow-sm bg-gray-100" src={student.photo_url} alt="" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{student.first_name} {student.last_name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{student.student_id}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white">{student.career}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Semestre {student.semester}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {student.status === 'Active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                <div>Mostrando {filteredStudents.length} resultados</div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
