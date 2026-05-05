"""
Password reset schemas for API requests/responses
"""
from pydantic import BaseModel, EmailStr, Field


class ForgotPasswordRequest(BaseModel):
    """Schema para solicitar recuperación de contraseña"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema para resetear la contraseña con token"""
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class ForgotPasswordResponse(BaseModel):
    """Respuesta a solicitud de recuperación"""
    message: str


class ResetPasswordResponse(BaseModel):
    """Respuesta a reseteo de contraseña"""
    message: str
