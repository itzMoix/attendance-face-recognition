"""
Students CRUD endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.core.dependencies import get_current_active_user, require_role
from app.core.security import hash_password
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

router = APIRouter()


@router.get("", response_model=StudentListResponse)
async def list_students(
    skip: int = Query(0, ge=0, description="Número de resultados a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de resultados"),
    career: Optional[str] = Query(None, description="Filtrar por carrera"),
    semester: Optional[int] = Query(None, ge=1, le=12, description="Filtrar por semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Listar estudiantes con paginación y filtros.
    
    Permisos: Admin y Professor pueden ver todos, Student solo ve su propio perfil
    """
    # Construir query base
    query = db.query(Student)
    
    # Si es estudiante, solo puede ver su propio perfil
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            raise NotFoundException("Student profile not found")
        return StudentListResponse(total=1, students=[student])
    
    # Aplicar filtros
    if career:
        query = query.filter(Student.career.ilike(f"%{career}%"))
    if semester:
        query = query.filter(Student.semester == semester)
    
    # Obtener total
    total = query.count()
    
    # Aplicar paginación
    students = query.offset(skip).limit(limit).all()
    
    return StudentListResponse(total=total, students=students)


@router.post("", response_model=StudentResponse, status_code=status.HTTP201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """
    Crear nuevo estudiante.
    
    Requiere rol: Admin
    
    Crea tanto el usuario como el perfil de estudiante.
    """
    # Verificar que el student_id no exista
    existing_student = db.query(Student).filter(Student.student_id == student_data.student_id).first()
    if existing_student:
        raise BadRequestException(f"Student ID {student_data.student_id} already exists")
    
    # Verificar que el email no exista
    existing_user = db.query(User).filter(User.email == student_data.email).first()
    if existing_user:
        raise BadRequestException(f"Email {student_data.email} already exists")
    
    # Crear usuario
    new_user = User(
        email=student_data.email,
        password_hash=hash_password(student_data.password),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(new_user)
    db.flush()  # Para obtener el ID sin hacer commit
    
    # Crear estudiante
    new_student = Student(
        user_id=new_user.id,
        student_id=student_data.student_id,
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        career=student_data.career,
        semester=student_data.semester,
        photo_url=student_data.photo_url
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return new_student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener un estudiante por ID.
    
    Permisos: Admin y Professor pueden ver cualquiera, Student solo su propio perfil
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise NotFoundException(f"Student with ID {student_id} not found")
    
    # Si es estudiante, verificar que sea su propio perfil
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise ForbiddenException("You can only access your own profile")
    
    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """
    Actualizar estudiante.
    
    Requiere rol: Admin
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise NotFoundException(f"Student with ID {student_id} not found")
    
    # Actualizar campos proporcionados
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """
    Eliminar estudiante.
    
    Requiere rol: Admin
    
    Nota: Esto también elimina el usuario asociado (cascade).
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise NotFoundException(f"Student with ID {student_id} not found")
    
    db.delete(student)
    db.commit()
    
    return None
