"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserResponse
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_active_user
from app.core.exceptions import CredentialsException

router = APIRouter()


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login de usuario.
    
    Verifica email y password, retorna JWT token si son correctos.
    
    Args:
        credentials: Email y password del usuario
        db: Sesión de base de datos
        
    Returns:
        Token JWT de acceso
        
    Raises:
        CredentialsException: Si las credenciales son incorrectas
    """
    # Buscar usuario por email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise CredentialsException("Incorrect email or password")
    
    # Verificar password
    if not verify_password(credentials.password, user.password_hash):
        raise CredentialsException("Incorrect email or password")
    
    # Verificar que el usuario esté activo
    if not user.is_active:
        raise CredentialsException("Inactive user")
    
    # Datos base del token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    }

    # Si es estudiante, incluir su student_id (UUID de la tabla students)
    if user.role.value == "STUDENT" and user.student:
        token_data["student_id"] = str(user.student.id)
    
    # Crear token JWT
    access_token = create_access_token(data=token_data)
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener información del usuario actual.
    
    Args:
        current_user: Usuario autenticado desde el token
        
    Returns:
        Información del usuario actual, incluyendo student_id si aplica
    """
    # Construir respuesta base
    response_data = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "student_id": current_user.student.id if current_user.student else None,
    }
    return UserResponse(**response_data)



@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logout de usuario.
    
    Nota: En JWT el logout se maneja en el cliente eliminando el token.
    Este endpoint es principalmente para mantener consistencia en la API.
    
    Returns:
        Mensaje de confirmación
    """
    return {"message": "Successfully logged out"}
