"""
Backend configuration settings.
Manejo de variables de entorno y configuración del sistema.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuración del sistema usando Pydantic Settings"""
    
    # Aplicación
    APP_NAME: str = "Sistema de Control de Asistencias"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Base de datos PostgreSQL
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_NAME: str = "attendance_db"
    
    # URL de conexión PostgreSQL
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
    
    # Seguridad JWT
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
    ]
    
    # Face Recognition
    FACE_RECOGNITION_THRESHOLD: float = 0.6
    FACE_ENCODING_MODEL: str = "large"  # 'large' or 'small'
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    FACE_PHOTOS_DIR: str = "uploads/faces"
    ATTENDANCE_SNAPSHOTS_DIR: str = "uploads/snapshots"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
