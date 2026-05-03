"""
Reports API endpoints - Estadísticas y reportes
"""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException

from app.config.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import ForbiddenException
from app.services.report_service import (
    get_general_statistics,
    get_subject_statistics,
    get_student_statistics
)

router = APIRouter()


@router.get("/statistics")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Estadísticas generales del sistema. Requiere: Admin"""
    return get_general_statistics(db)


@router.get("/subject/{subject_id}")
async def get_subject_report(
    subject_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reporte de asistencias por materia. Requiere: Admin o Profesor"""
    if current_user.role == UserRole.STUDENT:
        raise ForbiddenException("Students cannot access subject reports")

    result = get_subject_statistics(subject_id, db, start_date, end_date)
    if not result:
        raise HTTPException(status_code=404, detail="Subject not found")

    return result


@router.get("/student/{student_id}")
async def get_student_report(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reporte de un estudiante. Requiere: Admin, Profesor, o el mismo estudiante."""
    # Verificar si el estudiante pertenece al usuario actual (si es rol STUDENT)
    if current_user.role == UserRole.STUDENT:
        if not current_user.student or str(current_user.student.id) != student_id:
            raise ForbiddenException("You can only view your own report")

    result = get_student_statistics(student_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")

    return result

