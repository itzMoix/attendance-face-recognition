"""
Subject model - Materias/Asignaturas
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Subject(Base):
    """
    Modelo de materias/asignaturas.
    Representa las clases que se imparten en los laboratorios.
    """
    __tablename__ = "subjects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    professor_id = Column(UUID(as_uuid=True), ForeignKey("professors.id", ondelete="RESTRICT"), nullable=False, index=True)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id", ondelete="RESTRICT"), nullable=False, index=True)
    schedule = Column(String(200), nullable=False)  # Ej: "Lunes y Miércoles 08:00-10:00"
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    professor = relationship("Professor", back_populates="subjects")
    laboratory = relationship("Laboratory", back_populates="subjects")
    attendances = relationship("Attendance", back_populates="subject")
    
    def __repr__(self):
        return f"<Subject {self.code}: {self.name}>"
