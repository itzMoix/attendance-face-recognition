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
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

router = APIRouter()


def _is_professor(user: User) -> bool:
    """Verifica si el usuario es profesor (tolerante a mayúsculas/minúsculas)."""
    val = user.role.value if hasattr(user.role, "value") else user.role
    return str(val).upper().replace("USERROLE.", "") == "PROFESSOR"


def _is_admin(user: User) -> bool:
    """Verifica si el usuario es admin (tolerante a mayúsculas/minúsculas)."""
    val = user.role.value if hasattr(user.role, "value") else user.role
    return str(val).upper().replace("USERROLE.", "") == "ADMIN"


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
    if _is_professor(current_user):
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
    current_user: User = Depends(get_current_active_user),
):
    """Crear nueva materia. Admin o Profesor."""

    # Solo admin y professor pueden crear materias
    if not _is_admin(current_user) and not _is_professor(current_user):
        # Para debug
        val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
        raise ForbiddenException(f"Se requiere rol ADMIN o PROFESSOR para crear materias. Tu rol actual detectado es: '{val}' (ID: {current_user.id})")

    # Validar código único
    if db.query(Subject).filter(Subject.code == data.code).first():
        raise BadRequestException(f"El código '{data.code}' ya existe")

    if _is_professor(current_user):
        # Profesor: se asigna automáticamente a sí mismo
        prof = db.query(Professor).filter(Professor.user_id == current_user.id).first()
        if not prof:
            raise NotFoundException("Tu cuenta de profesor no tiene un perfil asignado en la base de datos.")
        data.professor_id = prof.id
    elif _is_admin(current_user):
        # Admin: debe proveer professor_id válido
        if not data.professor_id:
            raise BadRequestException("Falta proveer el ID del profesor para esta clase")
        if not db.query(Professor).filter(Professor.id == data.professor_id).first():
            raise NotFoundException(f"Profesor '{data.professor_id}' no encontrado")

    # Validar que el laboratorio existe
    if not db.query(Laboratory).filter(Laboratory.id == data.laboratory_id).first():
        raise NotFoundException(f"Laboratorio '{data.laboratory_id}' no encontrado")

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
        raise NotFoundException(f"Materia '{subject_id}' no encontrada")
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Actualizar materia. Admin o su propio Profesor."""

    if not _is_admin(current_user) and not _is_professor(current_user):
        raise ForbiddenException("Se requiere rol ADMIN o PROFESSOR")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise NotFoundException(f"Materia '{subject_id}' no encontrada")

    # Validar propiedad si es profesor
    if _is_professor(current_user):
        prof = db.query(Professor).filter(Professor.user_id == current_user.id).first()
        if not prof or subject.professor_id != prof.id:
            raise ForbiddenException("No tienes permiso para editar esta materia")

    update_data = data.model_dump(exclude_unset=True)

    # Validar FK si se actualizan
    if "professor_id" in update_data and _is_admin(current_user):
        if not db.query(Professor).filter(Professor.id == update_data["professor_id"]).first():
            raise NotFoundException(f"Profesor '{update_data['professor_id']}' no encontrado")
    if "laboratory_id" in update_data:
        if not db.query(Laboratory).filter(Laboratory.id == update_data["laboratory_id"]).first():
            raise NotFoundException(f"Laboratorio '{update_data['laboratory_id']}' no encontrado")

    for field, value in update_data.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Eliminar materia. Admin o su propio Profesor."""

    if not _is_admin(current_user) and not _is_professor(current_user):
        raise ForbiddenException("Se requiere rol ADMIN o PROFESSOR")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise NotFoundException(f"Materia '{subject_id}' no encontrada")

    # Validar propiedad si es profesor
    if _is_professor(current_user):
        prof = db.query(Professor).filter(Professor.user_id == current_user.id).first()
        if not prof or subject.professor_id != prof.id:
            raise ForbiddenException("No tienes permiso para eliminar esta materia")

    db.delete(subject)
    db.commit()
    return None
