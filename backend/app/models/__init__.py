"""
Models package initialization.
Importa todos los modelos para que estén disponibles.
"""
from app.config.database import Base
from .user import User, UserRole
from .student import Student
from .professor import Professor
from .laboratory import Laboratory
from .subject import Subject
from .attendance import Attendance
from .face_encoding import FaceEncoding

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Student",
    "Professor",
    "Laboratory",
    "Subject",
    "Attendance",
    "FaceEncoding",
]
