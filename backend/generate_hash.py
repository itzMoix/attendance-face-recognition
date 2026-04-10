"""
Script para generar hash bcrypt de la contraseña de prueba
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "Password123!"
hashed = pwd_context.hash(password)

print(f"Password: {password}")
print(f"Hash: {hashed}")
print(f"\nSQL para actualizar usuarios:")
print(f"UPDATE users SET password_hash = '{hashed}';")
