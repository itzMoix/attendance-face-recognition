-- =====================================================
-- Sistema de Control de Asistencias - Base de Datos
-- PostgreSQL Initialization Script
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users
-- Usuarios del sistema (estudiantes, profesores, admins)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: students
-- Información de estudiantes
-- =====================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    career VARCHAR(150) NOT NULL,
    semester INTEGER NOT NULL,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: professors
-- Información de profesores
-- =====================================================
CREATE TABLE professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: laboratories
-- Laboratorios con cámaras
-- =====================================================
CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL,
    camera_ip VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: subjects
-- Materias/asignaturas
-- =====================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE RESTRICT,
    laboratory_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
    schedule VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: face_encodings
-- Encodings faciales de estudiantes
-- =====================================================
CREATE TABLE face_encodings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    encoding BYTEA NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: attendances
-- Registro de asistencias
-- =====================================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score FLOAT NOT NULL,
    photo_snapshot_url VARCHAR(500),
    synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: offline_queue
-- Cola para sincronización offline
-- =====================================================
CREATE TABLE offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data JSONB NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Búsquedas frecuentes por estudiante y fecha
CREATE INDEX idx_attendance_student_date ON attendances(student_id, check_in_time);

-- Búsquedas por laboratorio y materia
CREATE INDEX idx_attendance_lab_subject ON attendances(laboratory_id, subject_id);

-- Búsqueda rápida de encodings activos
CREATE INDEX idx_face_encodings_student ON face_encodings(student_id, version);

-- Cola offline - operaciones pendientes
CREATE INDEX idx_offline_queue_processed ON offline_queue(processed, created_at);

-- Índices para búsquedas de usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Índices para estudiantes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_id ON students(student_id);

-- Índices para profesores
CREATE INDEX idx_professors_user_id ON professors(user_id);

-- Índices para materias
CREATE INDEX idx_subjects_professor ON subjects(professor_id);
CREATE INDEX idx_subjects_laboratory ON subjects(laboratory_id);
CREATE INDEX idx_subjects_active ON subjects(is_active);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_face_encodings_updated_at BEFORE UPDATE ON face_encodings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Finalización
-- =====================================================
COMMENT ON TABLE users IS 'Usuarios del sistema (estudiantes, profesores, administradores)';
COMMENT ON TABLE students IS 'Información detallada de estudiantes';
COMMENT ON TABLE professors IS 'Información detallada de profesores';
COMMENT ON TABLE laboratories IS 'Laboratorios con sistema de cámaras';
COMMENT ON TABLE subjects IS 'Materias/asignaturas impartidas';
COMMENT ON TABLE face_encodings IS 'Encodings faciales para reconocimiento';
COMMENT ON TABLE attendances IS 'Registro de asistencias de estudiantes';
COMMENT ON TABLE offline_queue IS 'Cola de sincronización para modo offline';
