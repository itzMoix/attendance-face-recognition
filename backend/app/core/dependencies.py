"""
FastAPI dependencies - Authentication and authorization
"""
from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.core.security import decode_access_token
from app.core.exceptions import CredentialsException, ForbiddenException


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtiene el usuario actual desde el token JWT.
    
    Args:
        authorization: Header Authorization: Bearer <token>
        db: Sesión de base de datos
        
    Returns:
        Usuario autenticado
        
    Raises:
        CredentialsException: Si el token es inválido o no existe
    """
    if not authorization:
        raise CredentialsException("Authorization header missing")
    
    # Verificar que sea Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise CredentialsException("Invalid authorization header format")
    
    token = parts[1]
    
    # Decodificar token
    payload = decode_access_token(token)
    if payload is None:
        raise CredentialsException("Invalid token")
    
    # Obtener user_id del payload
    user_id: str = payload.get("sub")
    if user_id is None:
        raise CredentialsException("Invalid token payload")
    
    # Buscar usuario en base de datos
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise CredentialsException("User not found")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica que el usuario actual esté activo.
    
    Args:
        current_user: Usuario actual
        
    Returns:
        Usuario activo
        
    Raises:
        ForbiddenException: Si el usuario está inactivo
    """
    if not current_user.is_active:
        raise ForbiddenException("Inactive user")
    
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory para verificar roles de usuario.
    
    Args:
        *allowed_roles: Roles permitidos
        
    Returns:
        Función de dependencia que verifica el rol
        
    Ejemplo:
        @app.get("/admin", dependencies=[Depends(require_role(UserRole.ADMIN))])
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Access denied. Required role: {', '.join(r.value for r in allowed_roles)}")
        return current_user
    
    return role_checker
