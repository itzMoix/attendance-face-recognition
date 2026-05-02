"""
Attendance schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AttendanceManualCreate(BaseModel):
    """Schema para registro manual de asistencia"""
    student_id: UUID
    subject_id: UUID
    laboratory_id: UUID
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)


class AttendanceResponse(BaseModel):
    """Schema de respuesta de asistencia"""
    id: UUID
    student_id: UUID
    laboratory_id: UUID
    subject_id: UUID
    check_in_time: datetime
    confidence_score: float
    photo_snapshot_url: Optional[str] = None
    synced: bool

    # Datos anidados opcionales
    student_name: Optional[str] = None
    subject_name: Optional[str] = None
    laboratory_name: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    """Schema de respuesta para lista de asistencias"""
    total: int
    attendances: list[AttendanceResponse]


class SessionStartRequest(BaseModel):
    """Schema para iniciar sesión de reconocimiento"""
    subject_id: UUID = Field(..., description="UUID de la materia activa")
    camera_index: int = Field(default=0, ge=0, description="Índice de la cámara (0=laptop)")


class SessionStatusResponse(BaseModel):
    """Estado de la sesión de reconocimiento"""
    is_running: bool
    subject_id: Optional[str] = None
    encodings_loaded: int
    message: str


class OfflineSyncRecord(BaseModel):
    """Un registro de asistencia capturado offline para sincronizar."""
    student_id: UUID
    subject_id: UUID
    laboratory_id: UUID
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    check_in_time: Optional[datetime] = None   # Si None, se usa now()


class OfflineSyncResponse(BaseModel):
    """Resultado de la sincronización offline."""
    received: int
    saved: int
    duplicates_skipped: int
    errors: int
