"""
Laboratory model - Laboratorios
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Laboratory(Base):
    """
    Modelo de laboratorios.
    Representa espacios físicos con cámaras para reconocimiento facial.
    """
    __tablename__ = "laboratories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    location = Column(String(200), nullable=False)
    capacity = Column(Integer, nullable=False)
    camera_ip = Column(String(45), nullable=True)  # IPv4 o IPv6
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    subjects = relationship("Subject", back_populates="laboratory")
    attendances = relationship("Attendance", back_populates="laboratory")
    
    def __repr__(self):
        return f"<Laboratory {self.name} - {self.location}>"
