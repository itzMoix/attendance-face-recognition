"""
Professor schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class ProfessorBase(BaseModel):
    """Campos base de profesor"""
    employee_id: str = Field(..., description="ID único del empleado, ej: EMP-2024001")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., description="Departamento académico")


class ProfessorCreate(ProfessorBase):
    """Schema para crear profesor (también crea el usuario)"""
    email: str = Field(..., description="Email para crear cuenta de usuario")
    password: str = Field(..., min_length=8, description="Contraseña inicial")


class ProfessorUpdate(BaseModel):
    """Schema para actualizar profesor"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = None


class ProfessorResponse(ProfessorBase):
    """Schema de respuesta de profesor"""
    id: UUID
    user_id: UUID
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ProfessorListResponse(BaseModel):
    """Schema de respuesta para lista de profesores"""
    total: int
    professors: list[ProfessorResponse]
