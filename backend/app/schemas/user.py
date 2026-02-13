"""
User schemas for API requests/responses
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    """Campos base de usuario"""
    email: EmailStr


class UserLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserCreate(UserBase):
    """Schema para crear usuario"""
    password: str = Field(..., min_length=8)
    role: UserRole


class UserUpdate(BaseModel):
    """Schema para actualizar usuario"""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema de respuesta de usuario (sin password)"""
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Permite convertir desde ORM models
