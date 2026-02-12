"""
Student model - Estudiantes
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Student(Base):
    """
    Modelo de estudiantes.
    Contiene información académica y personal de los estudiantes.
    """
    __tablename__ = "students"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    career = Column(String(150), nullable=False)
    semester = Column(Integer, nullable=False)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="student")
    face_encodings = relationship("FaceEncoding", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    
    @property
    def full_name(self):
        """Nombre completo del estudiante"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Student {self.student_id}: {self.full_name}>"
