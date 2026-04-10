"""
Laboratory schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class LaboratoryBase(BaseModel):
    """Campos base de laboratorio"""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del laboratorio")
    location: str = Field(..., min_length=1, max_length=200, description="Ubicación física")
    capacity: int = Field(..., ge=1, description="Capacidad máxima de personas")
    camera_ip: Optional[str] = Field(None, max_length=45, description="IP de la cámara")


class LaboratoryCreate(LaboratoryBase):
    """Schema para crear laboratorio"""
    is_active: bool = True


class LaboratoryUpdate(BaseModel):
    """Schema para actualizar laboratorio"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    capacity: Optional[int] = Field(None, ge=1)
    camera_ip: Optional[str] = Field(None, max_length=45)
    is_active: Optional[bool] = None


class LaboratoryResponse(LaboratoryBase):
    """Schema de respuesta de laboratorio"""
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LaboratoryListResponse(BaseModel):
    """Schema de respuesta para lista de laboratorios"""
    total: int
    laboratories: list[LaboratoryResponse]
