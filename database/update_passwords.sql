-- Actualizar contraseñas con hash correcto de Password123!
UPDATE users SET password_hash = '$2b$12$Xv5nAyaq95LnC0gLdUQU.uYsULE7RWcGXyouwckljXHCQSlo0oRDy'
WHERE email IN (
    'admin@university.edu',
    'garcia.juan@university.edu',
    'martinez.maria@university.edu',
    'lopez.carlos@student.edu',
    'fernandez.ana@student.edu'
);

SELECT email, role, LEFT(password_hash, 30) AS hash_ok FROM users;
