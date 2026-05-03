"""
Attendance endpoints: sesión en vivo con cámara y registro manual.
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.subject import Subject
from app.models.laboratory import Laboratory
from app.models.face_encoding import FaceEncoding
from app.schemas.attendance import (
    AttendanceManualCreate,
    AttendanceResponse,
    AttendanceListResponse,
    SessionStartRequest,
    SessionStatusResponse,
    OfflineSyncRecord,
    OfflineSyncResponse,
)
from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.face_service import (
    deserialize_encoding,
    recognize_frame,
    frame_to_jpeg_bytes,
    camera_session,
    FACE_RECOGNITION_AVAILABLE,
)

router = APIRouter()

# ────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────

def _load_encodings(db: Session) -> tuple[list, list, list]:
    """Carga todos los encodings de la BD. Retorna (encodings, ids, names)."""
    rows = (
        db.query(FaceEncoding, Student)
        .join(Student, FaceEncoding.student_id == Student.id)
        .all()
    )
    encodings, ids, names = [], [], []
    for fe, student in rows:
        try:
            enc = deserialize_encoding(fe.encoding)
            encodings.append(enc)
            ids.append(str(student.id))
            names.append(f"{student.first_name} {student.last_name}")
        except Exception:
            continue
    return encodings, ids, names


def _already_registered(student_id, subject_id, db: Session) -> bool:
    """Evita duplicados: True si el estudiante ya tiene asistencia en la última hora."""
    cutoff = datetime.utcnow() - timedelta(hours=1)
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id,
            Attendance.subject_id == subject_id,
            Attendance.check_in_time >= cutoff,
        )
        .first()
    )
    return existing is not None


def _build_response(att: Attendance) -> AttendanceResponse:
    student_name = None
    subject_name = None
    lab_name = None
    if att.student:
        student_name = f"{att.student.first_name} {att.student.last_name}"
    if att.subject:
        subject_name = att.subject.name
    if att.laboratory:
        lab_name = att.laboratory.name

    return AttendanceResponse(
        id=att.id,
        student_id=att.student_id,
        laboratory_id=att.laboratory_id,
        subject_id=att.subject_id,
        check_in_time=att.check_in_time,
        confidence_score=att.confidence_score,
        photo_snapshot_url=att.photo_snapshot_url,
        synced=att.synced,
        student_name=student_name,
        subject_name=subject_name,
        laboratory_name=lab_name,
    )


# ────────────────────────────────────────────────────────────────────
# GET /api/attendance/  — listar asistencias
# ────────────────────────────────────────────────────────────────────

@router.get("", response_model=AttendanceListResponse)
async def list_attendances(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    subject_id: Optional[UUID] = Query(None),
    student_id: Optional[UUID] = Query(None),
    date: Optional[str] = Query(None, description="Fecha YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista asistencias con filtros opcionales."""
    query = db.query(Attendance)

    # Estudiante solo ve sus propias asistencias
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(Attendance.student_id == student.id)

    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if student_id and current_user.role != UserRole.STUDENT:
        query = query.filter(Attendance.student_id == student_id)
    if date:
        try:
            d = datetime.strptime(date, "%Y-%m-%d")
            query = query.filter(
                Attendance.check_in_time >= d,
                Attendance.check_in_time < d + timedelta(days=1),
            )
        except ValueError:
            raise BadRequestException("Formato de fecha inválido. Usa YYYY-MM-DD")

    total = query.count()
    rows = query.order_by(Attendance.check_in_time.desc()).offset(skip).limit(limit).all()
    return AttendanceListResponse(
        total=total,
        attendances=[_build_response(a) for a in rows],
    )


# ────────────────────────────────────────────────────────────────────
# POST /api/attendance/manual  — registro manual
# ────────────────────────────────────────────────────────────────────

@router.post("/manual", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def register_manual(
    data: AttendanceManualCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROFESSOR)),
):
    """Registra asistencia manualmente sin necesidad de cámara."""
    # Validar que existan las FK
    if not db.query(Student).filter(Student.id == data.student_id).first():
        raise NotFoundException(f"Estudiante '{data.student_id}' no encontrado")
    if not db.query(Subject).filter(Subject.id == data.subject_id).first():
        raise NotFoundException(f"Materia '{data.subject_id}' no encontrada")
    if not db.query(Laboratory).filter(Laboratory.id == data.laboratory_id).first():
        raise NotFoundException(f"Laboratorio '{data.laboratory_id}' no encontrado")

    att = Attendance(
        student_id=data.student_id,
        subject_id=data.subject_id,
        laboratory_id=data.laboratory_id,
        confidence_score=data.confidence_score,
        synced=True,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return _build_response(att)


# ────────────────────────────────────────────────────────────────────
# POST /api/attendance/start-session
# ────────────────────────────────────────────────────────────────────

@router.post("/start-session", response_model=SessionStatusResponse)
async def start_session(
    data: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROFESSOR)),
):
    """
    Inicia la sesión de reconocimiento facial.
    Abre la cámara del laptop y asigna la materia activa.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        raise BadRequestException(
            "face_recognition no está instalado. Ejecuta: pip install face-recognition"
        )

    # Verificar que la materia existe
    subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    if not subject:
        raise NotFoundException(f"Materia '{data.subject_id}' no encontrada")

    # Cargar cuántos encodings hay
    total_enc = db.query(FaceEncoding).count()
    if total_enc == 0:
        raise BadRequestException(
            "No hay encodings registrados. Sube fotos de los estudiantes primero "
            "usando POST /api/face/upload/{student_id}"
        )

    ok = camera_session.start(
        camera_index=data.camera_index,
        subject_id=str(data.subject_id),
    )
    if not ok:
        raise BadRequestException(
            f"No se pudo abrir la cámara {data.camera_index}. "
            "Verifica que no esté en uso por otra aplicación."
        )

    return SessionStatusResponse(
        is_running=True,
        subject_id=str(data.subject_id),
        encodings_loaded=total_enc,
        message=f"Sesión iniciada para '{subject.name}' con {total_enc} encodings cargados.",
    )


# ────────────────────────────────────────────────────────────────────
# POST /api/attendance/stop-session
# ────────────────────────────────────────────────────────────────────

@router.post("/stop-session", response_model=SessionStatusResponse)
async def stop_session(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.PROFESSOR)),
):
    """Detiene la sesión de reconocimiento y libera la cámara."""
    camera_session.stop()
    return SessionStatusResponse(
        is_running=False,
        subject_id=None,
        encodings_loaded=0,
        message="Sesión detenida. Cámara liberada.",
    )


# ────────────────────────────────────────────────────────────────────
# GET /api/attendance/session-status
# ────────────────────────────────────────────────────────────────────

@router.get("/session-status", response_model=SessionStatusResponse)
async def session_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devuelve el estado actual de la sesión de reconocimiento."""
    total_enc = db.query(FaceEncoding).count()
    return SessionStatusResponse(
        is_running=camera_session.is_running,
        subject_id=camera_session.subject_id,
        encodings_loaded=total_enc,
        message="Sesión activa" if camera_session.is_running else "Sin sesión activa",
    )


# ────────────────────────────────────────────────────────────────────
# GET /api/attendance/live-frame  — stream MJPEG con reconocimiento
# ────────────────────────────────────────────────────────────────────

@router.get("/live-frame")
async def live_frame(
    token: Optional[str] = Query(None, description="JWT token (para stream desde img tag)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Stream MJPEG: devuelve frames continuos con reconocimiento facial anotado.
    Cuando detecta un estudiante conocido → registra asistencia automáticamente.

    Úsalo en el frontend con: <img src="/api/attendance/live-frame" />
    """
    if not camera_session.is_running:
        raise BadRequestException(
            "No hay sesión activa. Inicia una con POST /api/attendance/start-session"
        )

    # Cargar encodings una vez al inicio del stream
    known_encodings, known_ids, known_names = _load_encodings(db)
    subject_id = camera_session.subject_id

    def generate():
        # Necesitamos una nueva sesión de BD para el generador (thread diferente)
        from app.config.database import SessionLocal

        db_gen = SessionLocal()
        try:
            while camera_session.is_running:
                frame = camera_session.read_frame()
                if frame is None:
                    break

                # Reconocimiento
                annotated_frame, matches = recognize_frame(
                    frame,
                    known_encodings,
                    known_ids,
                    known_names,
                    threshold=settings.FACE_RECOGNITION_THRESHOLD,
                )

                # Registrar asistencias detectadas (anti-duplicado 1h)
                for match in matches:
                    sid = match["student_id"]
                    if subject_id and not _already_registered(sid, subject_id, db_gen):
                        att = Attendance(
                            student_id=sid,
                            subject_id=subject_id,
                            laboratory_id=_get_lab_from_subject(subject_id, db_gen),
                            confidence_score=match["confidence"],
                            synced=True,
                        )
                        db_gen.add(att)
                        db_gen.commit()

                # Emitir frame como MJPEG
                jpeg = frame_to_jpeg_bytes(annotated_frame)
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
                )
        finally:
            db_gen.close()

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


def _get_lab_from_subject(subject_id: str, db: Session) -> Optional[UUID]:
    """Helper: obtiene el laboratory_id de una materia."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    return subject.laboratory_id if subject else None


# ────────────────────────────────────────────────────────────────────
# POST /api/attendance/sync-offline
# Recibe registros encolados en IndexedDB y los persiste en la BD.
# ────────────────────────────────────────────────────────────────────

@router.post("/sync-offline", response_model=OfflineSyncResponse)
async def sync_offline(
    records: list[OfflineSyncRecord],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Sincroniza registros de asistencia capturados en modo offline (IndexedDB).
    Ignora duplicados (mismo estudiante + materia en ventana de 1h).

    Body: lista de OfflineSyncRecord
    Retorna: { received, saved, duplicates_skipped, errors }
    """
    saved = 0
    duplicates = 0
    errors = 0

    for record in records:
        try:
            check_time = record.check_in_time or datetime.utcnow()

            # Verificar que el estudiante y la materia existen
            student = db.query(Student).filter(Student.id == record.student_id).first()
            subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
            if not student or not subject:
                errors += 1
                continue

            # Anti-duplicado: misma asistencia en ventana de 1h alrededor del check_in_time
            window_start = check_time - timedelta(hours=1)
            window_end   = check_time + timedelta(hours=1)
            exists = db.query(Attendance).filter(
                Attendance.student_id == record.student_id,
                Attendance.subject_id  == record.subject_id,
                Attendance.check_in_time >= window_start,
                Attendance.check_in_time <= window_end,
            ).first()

            if exists:
                duplicates += 1
                continue

            att = Attendance(
                student_id=record.student_id,
                subject_id=record.subject_id,
                laboratory_id=record.laboratory_id,
                confidence_score=record.confidence_score,
                check_in_time=check_time,
                synced=True,
            )
            db.add(att)
            db.flush()
            saved += 1

        except Exception:
            errors += 1

    db.commit()
    return OfflineSyncResponse(
        received=len(records),
        saved=saved,
        duplicates_skipped=duplicates,
        errors=errors,
    )
