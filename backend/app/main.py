"""
FastAPI main application
Sistema de Control de Asistencias con Reconocimiento Facial
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.api import auth, students, professors, laboratories, subjects, face, attendance, reports

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para sistema de control de asistencias universitarias con reconocimiento facial",
    debug=settings.DEBUG
)

# Configurar CORS - DEBE IR ANTES DE REGISTRAR ROUTERS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Registrar routers
app.include_router(auth.router,         prefix="/api/auth",        tags=["Authentication"])
app.include_router(students.router,     prefix="/api/students",    tags=["Students"])
app.include_router(professors.router,   prefix="/api/professors",  tags=["Professors"])
app.include_router(laboratories.router, prefix="/api/laboratories",tags=["Laboratories"])
app.include_router(subjects.router,     prefix="/api/subjects",    tags=["Subjects"])
app.include_router(face.router,         prefix="/api/face",        tags=["Face Recognition"])
app.include_router(attendance.router,   prefix="/api/attendance",  tags=["Attendance"])
app.include_router(reports.router,      prefix="/api/reports",     tags=["Reports"])


@app.get("/")
async def root():
    """Endpoint raíz - información de la API"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
