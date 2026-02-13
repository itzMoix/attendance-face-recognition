"""
Professor model - Profesores
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.config.database import Base


class Professor(Base):
    """
    Modelo de profesores.
    Contiene información de los profesores que imparten materias.
    """
    __tablename__ = "professors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    department = Column(String(150), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="professor")
    subjects = relationship("Subject", back_populates="professor")
    
    @property
    def full_name(self):
        """Nombre completo del profesor"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Professor {self.employee_id}: {self.full_name}>"
