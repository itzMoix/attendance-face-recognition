/**
 * Servicio reutilizable de Axios con token JWT automático
 */
import axios from 'axios';
import api from '../config/api';

const axiosAuth = axios.create({ baseURL: api.baseURL });

axiosAuth.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Asistencias ──────────────────────────────────────────────────
export const attendanceService = {
    async list({ skip = 0, limit = 50, subject_id, student_id, date } = {}) {
        const params = { skip, limit };
        if (subject_id) params.subject_id = subject_id;
        if (student_id) params.student_id = student_id;
        if (date) params.date = date;
        const res = await axiosAuth.get('/api/attendance', { params });
        return res.data; // { total, attendances }
    },
};

// ─── Profesores ───────────────────────────────────────────────────
export const professorService = {
    async list() {
        const res = await axiosAuth.get('/api/professors');
        return res.data; // { total, professors }
    },
    async create(data) {
        const res = await axiosAuth.post('/api/professors', data);
        return res.data;
    },
    async update(id, data) {
        const res = await axiosAuth.put(`/api/professors/${id}`, data);
        return res.data;
    },
    async delete(id) {
        await axiosAuth.delete(`/api/professors/${id}`);
    },
};

// ─── Laboratorios ─────────────────────────────────────────────────
export const laboratoryService = {
    async list() {
        const res = await axiosAuth.get('/api/laboratories');
        return res.data; // { total, laboratories }
    },
};

// ─── Materias ─────────────────────────────────────────────────────
export const subjectService = {
    async list({ professor_id, is_active } = {}) {
        const params = {};
        if (professor_id) params.professor_id = professor_id;
        if (is_active !== undefined) params.is_active = is_active;
        const res = await axiosAuth.get('/api/subjects', { params });
        return res.data; // { total, subjects }
    },
};

// ─── Reconocimiento facial ────────────────────────────────────────
export const faceService = {
    async getStatus() {
        const res = await axiosAuth.get('/api/face/status');
        return res.data;
    },
    async uploadPhoto(studentId, file) {
        const form = new FormData();
        form.append('file', file);
        const res = await axiosAuth.post(`/api/face/upload/${studentId}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    async deleteEncoding(studentId) {
        await axiosAuth.delete(`/api/face/${studentId}`);
    },
    async startSession(subject_id, camera_index = 0) {
        const res = await axiosAuth.post('/api/attendance/start-session', {
            subject_id,
            camera_index,
        });
        return res.data;
    },
    async stopSession() {
        const res = await axiosAuth.post('/api/attendance/stop-session');
        return res.data;
    },
    async getSessionStatus() {
        const res = await axiosAuth.get('/api/attendance/session-status');
        return res.data;
    },
    getLiveFrameUrl() {
        const token = localStorage.getItem('token');
        return `${api.baseURL}/api/attendance/live-frame?token=${token}`;
    },
};

export default axiosAuth;
