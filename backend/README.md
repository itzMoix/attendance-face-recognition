# Backend - Sistema de Control de Asistencias

Backend del sistema de control de asistencias con reconocimiento facial.

## Tecnologías

- **Framework**: FastAPI
- **Base de Datos**: PostgreSQL + SQLAlchemy
- **Migraciones**: Alembic
- **Reconocimiento Facial**: face_recognition + OpenCV
- **Autenticación**: JWT (python-jose)

## Estructura del Proyecto

```
backend/
├── app/
│   ├── config/          # Configuración (settings, database)
│   ├── models/          # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic (TODO)
│   ├── api/             # Endpoints (TODO)
│   ├── services/        # Lógica de negocio (TODO)
│   ├── core/            # Utilidades core (TODO)
│   └── middleware/      # Middleware (TODO)
├── alembic/             # Migraciones de base de datos
├── tests/               # Tests (TODO)
└── requirements.txt     # Dependencias Python
```

## Instalación

### 1. Crear entorno virtual

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del backend:

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=attendance_db

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-segura
DEBUG=True

# Face Recognition
FACE_RECOGNITION_THRESHOLD=0.6
```

### 4. Configurar PostgreSQL

#### Opción A: Docker (Recomendado)

```bash
docker run --name attendance-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=attendance_db \
  -p 5432:5432 \
  -d postgres:15
```

#### Opción B: Instalación local

Instalar PostgreSQL 15 y crear la base de datos:

```sql
CREATE DATABASE attendance_db;
```

### 5. Inicializar base de datos

Ejecutar el script de inicialización:

```bash
# Desde el directorio raíz del proyecto
psql -h localhost -U postgres -d attendance_db -f database/init.sql
```

Cargar datos de prueba (opcional):

```bash
psql -h localhost -U postgres -d attendance_db -f database/seed_data.sql
```

### 6. Configurar Alembic (Migraciones)

Crear migración inicial:

```bash
cd backend
alembic revision --autogenerate -m "Initial schema"
```

Aplicar migraciones:

```bash
alembic upgrade head
```

## Ejecución

### Desarrollo

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en: `http://localhost:8000`

Documentación interactiva:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Modelos de Base de Datos

### Principales tablas:

- **users**: Usuarios del sistema (estudiantes, profesores, admins)
- **students**: Información de estudiantes
- **professors**: Información de profesores
- **laboratories**: Laboratorios con cámaras
- **subjects**: Materias/asignaturas
- **attendances**: Registro de asistencias
- **face_encodings**: Encodings faciales para reconocimiento

## Próximos Pasos

- [ ] Crear schemas Pydantic
- [ ] Implementar endpoints de autenticación
- [ ] Implementar servicio de reconocimiento facial
- [ ] Implementar endpoints CRUD
- [ ] Añadir tests unitarios
- [ ] Configurar CORS

## Comandos Útiles

### Alembic

```bash
# Ver historial de migraciones
alembic history

# Ver estado actual
alembic current

# Crear nueva migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

### Base de datos

```bash
# Conectar a PostgreSQL
psql -h localhost -U postgres -d attendance_db

# Ver tablas
\dt

# Describir tabla
\d+ users

# Salir
\q
```
