"""
Professors CRUD endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.professor import Professor
from app.schemas.professor import ProfessorCreate, ProfessorUpdate, ProfessorResponse, ProfessorListResponse
from app.core.dependencies import get_current_active_user, require_role
from app.core.security import hash_password
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("", response_model=ProfessorListResponse)
async def list_professors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    department: Optional[str] = Query(None, description="Filtrar por departamento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Listar profesores. Admin ve todos; Professor solo se ve a sí mismo.
    """
    if current_user.role == UserRole.PROFESSOR:
        prof = db.query(Professor).filter(Professor.user_id == current_user.id).first()
        if not prof:
            raise NotFoundException("Professor profile not found")
        return ProfessorListResponse(total=1, professors=[prof])

    query = db.query(Professor)
    if department:
        query = query.filter(Professor.department.ilike(f"%{department}%"))

    total = query.count()
    professors = query.offset(skip).limit(limit).all()
    return ProfessorListResponse(total=total, professors=professors)


@router.post("", response_model=ProfessorResponse, status_code=status.HTTP_201_CREATED)
async def create_professor(
    data: ProfessorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Crear nuevo profesor. Solo Admin.
    Crea el usuario y el perfil de profesor en una misma transacción.
    """
    # Verificar duplicados
    if db.query(Professor).filter(Professor.employee_id == data.employee_id).first():
        raise BadRequestException(f"Employee ID '{data.employee_id}' already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise BadRequestException(f"Email '{data.email}' already registered")

    # Crear usuario
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.PROFESSOR,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # Crear perfil de profesor
    new_prof = Professor(
        user_id=new_user.id,
        employee_id=data.employee_id,
        first_name=data.first_name,
        last_name=data.last_name,
        department=data.department,
    )
    db.add(new_prof)
    db.commit()
    db.refresh(new_prof)
    return new_prof


@router.get("/{professor_id}", response_model=ProfessorResponse)
async def get_professor(
    professor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtener un profesor por UUID."""
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise NotFoundException(f"Professor '{professor_id}' not found")
    return prof


@router.put("/{professor_id}", response_model=ProfessorResponse)
async def update_professor(
    professor_id: str,
    data: ProfessorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Actualizar datos de un profesor. Solo Admin."""
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise NotFoundException(f"Professor '{professor_id}' not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prof, field, value)

    db.commit()
    db.refresh(prof)
    return prof


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_professor(
    professor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Eliminar profesor y su usuario asociado (cascade). Solo Admin."""
    prof = db.query(Professor).filter(Professor.id == professor_id).first()
    if not prof:
        raise NotFoundException(f"Professor '{professor_id}' not found")

    db.delete(prof)
    db.commit()
    return None
