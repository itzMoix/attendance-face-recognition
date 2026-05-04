"""
Authentication endpoints
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserResponse
from app.schemas.password_reset import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordResponse,
)
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_active_user
from app.core.exceptions import CredentialsException, BadRequestException, NotFoundException

router = APIRouter()

RESET_TOKEN_EXPIRE_MINUTES = 30


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


@router.post("/forgot-password", response_model=ForgotPasswordResponse, status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Solicitar recuperación de contraseña.

    Genera un token de reseteo y lo almacena en la base de datos.
    En producción, se enviaría un email con el enlace. En este demo,
    el token se devuelve directamente en la respuesta.

    Args:
        request: Email del usuario
        db: Sesión de base de datos

    Returns:
        Mensaje de confirmación y token de reseteo (solo en demo)
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Por seguridad, no revelar si el email existe o no
        return ForgotPasswordResponse(
            message="Si el correo está registrado, recibirás un enlace de recuperación.",
            reset_token=None,
        )

    # Invalidar tokens anteriores del usuario
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False,
    ).update({"is_used": True})

    # Crear nuevo token
    token_value = PasswordResetToken.generate_token()
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_value,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(reset_token)
    db.commit()

    # En producción: enviar email con el enlace
    # send_reset_email(user.email, token_value)

    return ForgotPasswordResponse(
        message="Si el correo está registrado, recibirás un enlace de recuperación.",
        reset_token=token_value,  # Solo para demo — quitar en producción
    )


@router.post("/reset-password", response_model=ResetPasswordResponse, status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resetear la contraseña usando un token válido.

    Verifica que el token sea válido, no esté expirado ni usado,
    y actualiza la contraseña del usuario.

    Args:
        request: Token de reseteo y nueva contraseña
        db: Sesión de base de datos

    Returns:
        Mensaje de confirmación

    Raises:
        BadRequestException: Si el token es inválido, expirado o ya usado
    """
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
    ).first()

    if not reset_token:
        raise BadRequestException("Token de recuperación inválido.")

    if reset_token.is_used:
        raise BadRequestException("Este token ya fue utilizado.")

    if reset_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise BadRequestException("El token ha expirado. Solicita uno nuevo.")

    # Buscar usuario
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise NotFoundException("Usuario no encontrado.")

    # Actualizar contraseña
    user.password_hash = hash_password(request.new_password)

    # Marcar token como usado
    reset_token.is_used = True

    db.commit()

    return ResetPasswordResponse(message="Contraseña actualizada exitosamente.")

