import axios from 'axios';
import api from '../config/api';

// Axios instance con token automático
const axiosAuth = axios.create({ baseURL: api.baseURL });
axiosAuth.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const studentService = {
    // Listar estudiantes con paginación y filtros
    async list({ skip = 0, limit = 100, career = null, semester = null } = {}) {
        const params = { skip, limit };
        if (career) params.career = career;
        if (semester) params.semester = semester;
        const res = await axiosAuth.get('/api/students', { params });
        return res.data; // { total, students }
    },

    // Obtener un estudiante por ID
    async getById(id) {
        const res = await axiosAuth.get(`/api/students/${id}`);
        return res.data;
    },

    // Crear estudiante (solo Admin)
    async create(studentData) {
        const res = await axiosAuth.post('/api/students', studentData);
        return res.data;
    },

    // Actualizar estudiante (solo Admin)
    async update(id, studentData) {
        const res = await axiosAuth.put(`/api/students/${id}`, studentData);
        return res.data;
    },

    // Eliminar estudiante (solo Admin)
    async delete(id) {
        await axiosAuth.delete(`/api/students/${id}`);
    },
};

export default studentService;
