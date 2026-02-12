"""
Attendance model - Registro de asistencias
"""
from sqlalchemy import Column, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Attendance(Base):
    """
    Modelo de asistencias.
    Registra cada vez que un estudiante es reconocido en un laboratorio.
    """
    __tablename__ = "attendances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id", ondelete="RESTRICT"), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False, index=True)
    check_in_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    confidence_score = Column(Float, nullable=False)  # Score del reconocimiento facial (0.0-1.0)
    photo_snapshot_url = Column(String(500), nullable=True)  # Foto del momento de registro
    synced = Column(Boolean, default=True)  # Para manejo offline
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    student = relationship("Student", back_populates="attendances")
    laboratory = relationship("Laboratory", back_populates="attendances")
    subject = relationship("Subject", back_populates="attendances")
    
    def __repr__(self):
        return f"<Attendance {self.student_id} - {self.subject_id} @ {self.check_in_time}>"
