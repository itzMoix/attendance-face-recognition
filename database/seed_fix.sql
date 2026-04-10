-- =====================================================
-- Script de Reparación / Seed Seguro
-- Usa ON CONFLICT DO NOTHING para evitar duplicados
-- Corrige UUIDs inválidos (g → válido hex)
-- =====================================================

-- USUARIOS (solo los que faltan)
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@university.edu',        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'ADMIN',     true),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'garcia.juan@university.edu',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'PROFESSOR', true),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'martinez.maria@university.edu','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'PROFESSOR', true),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'lopez.carlos@student.edu',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'STUDENT',   true),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'fernandez.ana@student.edu',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'STUDENT',   true),
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'rodriguez.luis@student.edu',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'STUDENT',   true),
('c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'gonzalez.sofia@student.edu',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'STUDENT',   true),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'sanchez.miguel@student.edu',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILXw6O5K2', 'STUDENT',   true)
ON CONFLICT DO NOTHING;

-- PROFESORES
INSERT INTO professors (id, user_id, employee_id, first_name, last_name, department) VALUES
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'PROF-001', 'Juan',  'García',   'Ingeniería de Software'),
('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'PROF-002', 'María', 'Martínez', 'Ciencias de la Computación')
ON CONFLICT DO NOTHING;

-- ESTUDIANTES
INSERT INTO students (id, user_id, student_id, first_name, last_name, career, semester) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'EST-2024001', 'Carlos', 'López',     'Ingeniería en Sistemas',       5),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'EST-2024002', 'Ana',    'Fernández', 'Ingeniería en Sistemas',       5),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'EST-2024003', 'Luis',   'Rodríguez', 'Ingeniería en Software',        4),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'EST-2024004', 'Sofía',  'González',  'Ingeniería en Software',        6),
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'EST-2024005', 'Miguel', 'Sánchez',   'Ciencias de la Computación',    3)
ON CONFLICT DO NOTHING;

-- LABORATORIOS
INSERT INTO laboratories (id, name, location, capacity, camera_ip, is_active) VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lab A - Sistemas', 'Edificio 3, Piso 2, Sala 201', 30, '192.168.1.100', true),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lab B - Redes',    'Edificio 3, Piso 2, Sala 205', 25, '192.168.1.101', true)
ON CONFLICT DO NOTHING;

-- MATERIAS  (UUIDs corregidos: a1, a2, a3 en lugar de g1, g2, g3)
INSERT INTO subjects (id, code, name, professor_id, laboratory_id, schedule, is_active) VALUES
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ISW-401', 'Desarrollo de Software',   'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lunes y Miércoles 08:00-10:00',  true),
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'ISW-501', 'Arquitectura de Software', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Martes y Jueves 10:00-12:00',    true),
('a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'CC-301',  'Redes de Computadoras',    'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Miércoles y Viernes 14:00-16:00', true)
ON CONFLICT DO NOTHING;

-- ASISTENCIAS DE EJEMPLO (referencias corregidas)
INSERT INTO attendances (student_id, laboratory_id, subject_id, check_in_time, confidence_score, synced) VALUES
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days', 0.95, true),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days', 0.92, true),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP - INTERVAL '7 days', 0.89, true),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', CURRENT_TIMESTAMP - INTERVAL '6 days', 0.94, true),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', CURRENT_TIMESTAMP - INTERVAL '6 days', 0.91, true),
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', CURRENT_TIMESTAMP - INTERVAL '5 days', 0.97, true),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', CURRENT_TIMESTAMP - INTERVAL '5 days', 0.88, true)
ON CONFLICT DO NOTHING;

-- Verificar resultados
SELECT 'users'       AS tabla, COUNT(*) AS total FROM users
UNION ALL
SELECT 'professors',           COUNT(*)           FROM professors
UNION ALL
SELECT 'students',             COUNT(*)           FROM students
UNION ALL
SELECT 'laboratories',         COUNT(*)           FROM laboratories
UNION ALL
SELECT 'subjects',             COUNT(*)           FROM subjects
UNION ALL
SELECT 'attendances',          COUNT(*)           FROM attendances;
