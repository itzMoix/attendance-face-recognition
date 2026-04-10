"""Generate bcrypt hash for Password123!"""
import sys
sys.path.insert(0, 'c:\\Users\\moise\\Documents\\attendance-face-recognition\\backend')

from app.core.security import hash_password

password = "Password123!"
hashed = hash_password(password)

print(hashed)
