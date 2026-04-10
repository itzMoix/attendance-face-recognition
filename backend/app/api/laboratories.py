"""
Laboratories CRUD endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.laboratory import Laboratory
from app.schemas.laboratory import LaboratoryCreate, LaboratoryUpdate, LaboratoryResponse, LaboratoryListResponse
from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter()


@router.get("", response_model=LaboratoryListResponse)
async def list_laboratories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Listar laboratorios. Accesible para todos los roles autenticados."""
    query = db.query(Laboratory)
    if is_active is not None:
        query = query.filter(Laboratory.is_active == is_active)

    total = query.count()
    labs = query.offset(skip).limit(limit).all()
    return LaboratoryListResponse(total=total, laboratories=labs)


@router.post("", response_model=LaboratoryResponse, status_code=status.HTTP_201_CREATED)
async def create_laboratory(
    data: LaboratoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Crear nuevo laboratorio. Solo Admin."""
    if db.query(Laboratory).filter(Laboratory.name == data.name).first():
        raise BadRequestException(f"Laboratory '{data.name}' already exists")

    lab = Laboratory(**data.model_dump())
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


@router.get("/{lab_id}", response_model=LaboratoryResponse)
async def get_laboratory(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtener un laboratorio por UUID."""
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise NotFoundException(f"Laboratory '{lab_id}' not found")
    return lab


@router.put("/{lab_id}", response_model=LaboratoryResponse)
async def update_laboratory(
    lab_id: str,
    data: LaboratoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Actualizar laboratorio. Solo Admin."""
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise NotFoundException(f"Laboratory '{lab_id}' not found")

    # Verificar nombre único si se actualiza
    if data.name and data.name != lab.name:
        if db.query(Laboratory).filter(Laboratory.name == data.name).first():
            raise BadRequestException(f"Laboratory '{data.name}' already exists")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lab, field, value)

    db.commit()
    db.refresh(lab)
    return lab


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_laboratory(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Eliminar laboratorio. Solo Admin."""
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise NotFoundException(f"Laboratory '{lab_id}' not found")

    db.delete(lab)
    db.commit()
    return None
