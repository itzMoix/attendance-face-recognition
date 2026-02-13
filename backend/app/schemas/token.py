"""
Token schemas for JWT authentication
"""
from pydantic import BaseModel


class Token(BaseModel):
    """Respuesta del endpoint de login"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Datos contenidos en el JWT"""
    user_id: str
    email: str
    role: str
