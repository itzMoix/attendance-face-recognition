"""
Password Reset Token model - Tokens temporales para reseteo de contraseña
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import secrets

from app.config.database import Base


class PasswordResetToken(Base):
    """
    Modelo de tokens de reseteo de contraseña.
    Almacena tokens temporales generados cuando un usuario solicita
    recuperar su contraseña.
    """
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(128), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @staticmethod
    def generate_token() -> str:
        """Genera un token seguro de 64 caracteres."""
        return secrets.token_urlsafe(48)

    def __repr__(self):
        return f"<PasswordResetToken user={self.user_id} used={self.is_used}>"
