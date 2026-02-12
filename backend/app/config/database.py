"""
Database configuration and session management.
SQLAlchemy setup para PostgreSQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .settings import settings

# Motor de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexión antes de usarla
    pool_size=10,  # Número de conexiones en el pool
    max_overflow=20,  # Conexiones adicionales permitidas
    echo=settings.DEBUG  # Log de queries SQL en modo debug
)

# SessionLocal para crear sesiones de base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para modelos declarativos
Base = declarative_base()


# Dependencia para obtener sesión de BD en endpoints
def get_db():
    """
    Generador de sesiones de base de datos.
    Usar como dependencia en endpoints de FastAPI.
    
    Ejemplo:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
