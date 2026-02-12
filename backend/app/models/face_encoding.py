"""
FaceEncoding model - Encodings faciales para reconocimiento
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class FaceEncoding(Base):
    """
    Modelo de encodings faciales.
    Almacena los vectores de características faciales generados por face_recognition.
    """
    __tablename__ = "face_encodings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    encoding = Column(LargeBinary, nullable=False)  # Array serializado de numpy (128 dimensiones)
    version = Column(Integer, default=1)  # Para controlar versiones de encodings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    student = relationship("Student", back_populates="face_encodings")
    
    def __repr__(self):
        return f"<FaceEncoding {self.student_id} v{self.version}>"
