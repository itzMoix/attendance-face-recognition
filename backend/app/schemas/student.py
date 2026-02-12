"""
Student schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class StudentBase(BaseModel):
    """Campos base de estudiante"""
    student_id: str = Field(..., description="ID único del estudiante, ej: EST-2024001")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    career: str = Field(..., description="Carrera del estudiante")
    semester: int = Field(..., ge=1, le=12, description="Semestre actual (1-12)")


class StudentCreate(StudentBase):
    """Schema para crear estudiante"""
    email: str = Field(..., description="Email para crear cuenta de usuario")
    password: str = Field(..., min_length=8, description="Contraseña inicial")
    photo_url: Optional[str] = None


class StudentUpdate(BaseModel):
    """Schema para actualizar estudiante"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    career: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=12)
    photo_url: Optional[str] = None


class StudentResponse(StudentBase):
    """Schema de respuesta de estudiante"""
    id: str
    user_id: str
    photo_url: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None  # Incluir datos del usuario
    
    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    """Schema de respuesta para lista de estudiantes"""
    total: int
    students: list[StudentResponse]
