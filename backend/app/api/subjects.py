"""
Subjects CRUD endpoints
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.subject import Subject
from app.models.professor import Professor
from app.models.laboratory import Laboratory
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse, SubjectListResponse
from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("", response_model=SubjectListResponse)
async def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    professor_id: Optional[UUID] = Query(None, description="Filtrar por profesor"),
    laboratory_id: Optional[UUID] = Query(None, description="Filtrar por laboratorio"),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Listar materias con filtros.
    - Admin: ve todas.
    - Professor: solo sus propias materias.
    - Student: ve todas las activas.
    """
    query = db.query(Subject)

    # Professors solo ven sus materias
    if current_user.role == UserRole.PROFESSOR:
        prof = db.query(Professor).filter(Professor.user_id == current_user.id).first()
        if prof:
            query = query.filter(Subject.professor_id == prof.id)

    if professor_id:
        query = query.filter(Subject.professor_id == professor_id)
    if laboratory_id:
        query = query.filter(Subject.laboratory_id == laboratory_id)
    if is_active is not None:
        query = query.filter(Subject.is_active == is_active)

    total = query.count()
    subjects = query.offset(skip).limit(limit).all()
    return SubjectListResponse(total=total, subjects=subjects)


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Crear nueva materia. Solo Admin."""
    # Validar código único
    if db.query(Subject).filter(Subject.code == data.code).first():
        raise BadRequestException(f"Subject code '{data.code}' already exists")

    # Validar que el profesor existe
    if not db.query(Professor).filter(Professor.id == data.professor_id).first():
        raise NotFoundException(f"Professor '{data.professor_id}' not found")

    # Validar que el laboratorio existe
    if not db.query(Laboratory).filter(Laboratory.id == data.laboratory_id).first():
        raise NotFoundException(f"Laboratory '{data.laboratory_id}' not found")

    subject = Subject(**data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtener una materia por UUID."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise NotFoundException(f"Subject '{subject_id}' not found")
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Actualizar materia. Solo Admin."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise NotFoundException(f"Subject '{subject_id}' not found")

    update_data = data.model_dump(exclude_unset=True)

    # Validar FK si se actualizan
    if "professor_id" in update_data:
        if not db.query(Professor).filter(Professor.id == update_data["professor_id"]).first():
            raise NotFoundException(f"Professor '{update_data['professor_id']}' not found")
    if "laboratory_id" in update_data:
        if not db.query(Laboratory).filter(Laboratory.id == update_data["laboratory_id"]).first():
            raise NotFoundException(f"Laboratory '{update_data['laboratory_id']}' not found")

    for field, value in update_data.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Eliminar materia. Solo Admin."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise NotFoundException(f"Subject '{subject_id}' not found")

    db.delete(subject)
    db.commit()
    return None
