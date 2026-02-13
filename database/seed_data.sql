-- =====================================================
-- Sistema de Control de Asistencias
-- Datos de Prueba (Seed Data)
-- =====================================================

-- Nota: Las contraseñas están hasheadas con bcrypt
-- Todas las contraseñas de prueba son: "Password123!"

-- =====================================================
-- USUARIOS
-- =====================================================

-- Administrador
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'admin', true);

-- Profesores
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'garcia.juan@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'professor', true),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'martinez.maria@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'professor', true);

-- Estudiantes
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'lopez.carlos@student.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'student', true),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'fernandez.ana@student.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'student', true),
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'rodriguez.luis@student.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'student', true),
('c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'gonzalez.sofia@student.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'student', true),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'sanchez.miguel@student.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'student', true);

-- =====================================================
-- PROFESORES
-- =====================================================
INSERT INTO professors (id, user_id, employee_id, first_name, last_name, department) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'PROF-001', 'Juan', 'García', 'Ingeniería de Software'),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'PROF-002', 'María', 'Martínez', 'Ciencias de la Computación');

-- =====================================================
-- ESTUDIANTES
-- =====================================================
INSERT INTO students (id, user_id, student_id, first_name, last_name, career, semester) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'EST-2024001', 'Carlos', 'López', 'Ingeniería en Sistemas', 5),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'EST-2024002', 'Ana', 'Fernández', 'Ingeniería en Sistemas', 5),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'EST-2024003', 'Luis', 'Rodríguez', 'Ingeniería en Software', 4),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'EST-2024004', 'Sofía', 'González', 'Ingeniería en Software', 6),
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'EST-2024005', 'Miguel', 'Sánchez', 'Ciencias de la Computación', 3);

-- =====================================================
-- LABORATORIOS
-- =====================================================
INSERT INTO laboratories (id, name, location, capacity, camera_ip, is_active) VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lab A - Sistemas', 'Edificio 3, Piso 2, Sala 201', 30, '192.168.1.100', true),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lab B - Redes', 'Edificio 3, Piso 2, Sala 205', 25, '192.168.1.101', true);

-- =====================================================
-- MATERIAS
-- =====================================================
INSERT INTO subjects (id, code, name, professor_id, laboratory_id, schedule, is_active) VALUES
('g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ISW-401', 'Desarrollo de Software', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lunes y Miércoles 08:00-10:00', true),
('g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'ISW-501', 'Arquitectura de Software', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Martes y Jueves 10:00-12:00', true),
('g3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'CC-301', 'Redes de Computadoras', 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Miércoles y Viernes 14:00-16:00', true);

-- =====================================================
-- ASISTENCIAS DE EJEMPLO
-- =====================================================
INSERT INTO attendances (student_id, laboratory_id, subject_id, check_in_time, confidence_score, synced) VALUES
-- Clase del lunes pasado - Desarrollo de Software
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '8 hours', 0.95, true),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '8 hours', 0.92, true),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '8 hours', 0.89, true),

-- Clase del martes pasado - Arquitectura de Software
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '10 hours', 0.94, true),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '10 hours', 0.91, true),

-- Clase del miércoles pasado - Redes de Computadoras
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'g3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '14 hours', 0.97, true),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'g3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '14 hours', 0.88, true);

-- =====================================================
-- NOTA: Los face_encodings NO se incluyen en seed data
-- ya que deben generarse con fotografías reales usando
-- el sistema de enrollment del reconocimiento facial
-- =====================================================
