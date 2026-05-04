"""
Subject schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.professor import ProfessorResponse
from app.schemas.laboratory import LaboratoryResponse


class SubjectBase(BaseModel):
    """Campos base de materia"""
    code: str = Field(..., max_length=20, description="Código único de la materia, ej: CS-101")
    name: str = Field(..., min_length=1, max_length=150, description="Nombre de la materia")
    professor_id: UUID = Field(..., description="UUID del profesor asignado")
    laboratory_id: UUID = Field(..., description="UUID del laboratorio asignado")
    schedule: str = Field(..., max_length=200, description="Horario, ej: Lunes y Miércoles 08:00-10:00")


class SubjectCreate(BaseModel):
    """Schema para crear materia. professor_id es opcional: el backend lo asigna automáticamente si el usuario es PROFESSOR."""
    code: str = Field(..., max_length=20)
    name: str = Field(..., min_length=1, max_length=150)
    professor_id: Optional[UUID] = Field(None, description="UUID del profesor (requerido para Admin, auto-asignado para Professor)")
    laboratory_id: UUID = Field(..., description="UUID del laboratorio asignado")
    schedule: str = Field(..., max_length=200)
    is_active: bool = True


class SubjectUpdate(BaseModel):
    """Schema para actualizar materia"""
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    professor_id: Optional[UUID] = None
    laboratory_id: Optional[UUID] = None
    schedule: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    """Schema de respuesta de materia"""
    id: UUID
    is_active: bool
    created_at: datetime
    professor: Optional[ProfessorResponse] = None
    laboratory: Optional[LaboratoryResponse] = None

    class Config:
        from_attributes = True


class SubjectListResponse(BaseModel):
    """Schema de respuesta para lista de materias"""
    total: int
    subjects: list[SubjectResponse]
