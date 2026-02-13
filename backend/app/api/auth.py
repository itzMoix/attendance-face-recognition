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
    
    # Crear token JWT
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )
    
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
        Información del usuario actual
    """
    return current_user


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
