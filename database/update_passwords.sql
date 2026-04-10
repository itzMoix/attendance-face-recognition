-- Actualizar hashes de contraseñas con hash válido de bcrypt
-- Password para todos: "Password123!"
-- Hash generado: $2b$12$uzpDM08EOrjPH.36C8VnBeeQWxNJzoU8h.Mkrcio/dxCyZ4BujU2.

UPDATE users 
SET password_hash = '$2b$12$uzpDM08EOrjPH.36C8VnBeeQWxNJzoU8h.Mkrcio/dxCyZ4BujU2.';

-- Verificar
SELECT email, role, LEFT(password_hash, 30) as hash_check FROM users;
