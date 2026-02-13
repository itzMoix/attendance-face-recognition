"""
User model - Usuarios del sistema
"""
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.config.database import Base


class UserRole(str, enum.Enum):
    """Roles de usuario en el sistema"""
    STUDENT = "student"
    PROFESSOR = "professor"
    ADMIN = "admin"


class User(Base):
    """
    Modelo de usuarios del sistema.
    Representa estudiantes, profesores y administradores.
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    professor = relationship("Professor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
