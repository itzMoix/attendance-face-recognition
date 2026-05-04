"""
Face encoding management endpoints.
Permite registrar, actualizar y eliminar encodings faciales de estudiantes.
"""
import io
import base64
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.face_encoding import FaceEncoding
from app.core.dependencies import require_role, get_current_active_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.face_service import (
    encode_face_from_bytes,
    encode_face_from_array,
    serialize_encoding,
    camera_session,
    FACE_RECOGNITION_AVAILABLE,
)

router = APIRouter()


def _check_fr_available():
    if not FACE_RECOGNITION_AVAILABLE:
        raise BadRequestException(
            "face_recognition no está instalado. "
            "Ejecuta: pip install face-recognition"
        )


def _get_student_or_404(student_id: str, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise NotFoundException(f"Estudiante '{student_id}' no encontrado")
    return student


# ────────────────────────────────────────────────────────────────────
# GET /api/face/status
# ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def face_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devuelve cuántos encodings hay en la BD y si face_recognition está disponible."""
    total = db.query(FaceEncoding).count()
    return {
        "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
        "encodings_in_db": total,
        "camera_running": camera_session.is_running,
    }


# ────────────────────────────────────────────────────────────────────
# GET /api/face/encodings  — Descargar todos los encodings
# ────────────────────────────────────────────────────────────────────

@router.get("/encodings")
async def get_all_encodings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Devuelve todos los encodings serializados en Base64 para reconocimiento local en clientes."""
    rows = (
        db.query(FaceEncoding, Student)
        .join(Student, FaceEncoding.student_id == Student.id)
        .all()
    )
    
    results = []
    for fe, student in rows:
        if fe.encoding:
            encoded_str = base64.b64encode(fe.encoding).decode('utf-8')
            results.append({
                "student_id": str(student.id),
                "name": f"{student.first_name} {student.last_name}",
                "encoding_base64": encoded_str
            })
            
    return {"data": results}


# ────────────────────────────────────────────────────────────────────
# POST /api/face/upload/{student_id}
# ────────────────────────────────────────────────────────────────────

@router.post("/upload/{student_id}", status_code=status.HTTP_201_CREATED)
async def upload_face(
    student_id: str,
    file: UploadFile = File(..., description="Foto JPG/PNG del estudiante"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Sube una foto del estudiante, genera el encoding y lo guarda en BD.
    Reemplaza el encoding anterior si ya existía.
    """
    # Verificar permisos (Admin o el propio estudiante)
    val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if str(val).upper().replace("USERROLE.", "") != "ADMIN":
        if str(val).upper().replace("USERROLE.", "") != "STUDENT":
            raise ForbiddenException("Rol no autorizado para esta acción")
        # Verificar que el estudiante que sube la foto sea dueño del perfil
        student_profile = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student_profile or str(student_profile.id) != student_id:
            raise ForbiddenException("No puedes actualizar el rostro de otro estudiante")

    _check_fr_available()
    student = _get_student_or_404(student_id, db)

    # Leer imagen
    contents = await file.read()
    if len(contents) == 0:
        raise BadRequestException("El archivo está vacío")

    # Generar encoding
    try:
        encoding = encode_face_from_bytes(contents)
    except ValueError as e:
        raise BadRequestException(str(e))

    if encoding is None:
        raise BadRequestException(
            "No se detectó ningún rostro en la imagen. "
            "Asegúrate de que la foto muestre claramente la cara."
        )

    # Guardar o actualizar en BD
    existing = db.query(FaceEncoding).filter(FaceEncoding.student_id == student.id).first()
    if existing:
        existing.encoding = serialize_encoding(encoding)
        existing.version += 1
        db.commit()
        action = "actualizado"
    else:
        fe = FaceEncoding(
            student_id=student.id,
            encoding=serialize_encoding(encoding),
            version=1,
        )
        db.add(fe)
        db.commit()
        action = "creado"

    return {
        "message": f"Encoding {action} correctamente para {student.first_name} {student.last_name}",
        "student_id": str(student.id),
        "student_name": f"{student.first_name} {student.last_name}",
    }


# ────────────────────────────────────────────────────────────────────
# POST /api/face/capture/{student_id}  — captura desde cámara del laptop
# ────────────────────────────────────────────────────────────────────

@router.post("/capture/{student_id}", status_code=status.HTTP_201_CREATED)
async def capture_face(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Captura un frame desde la cámara del laptop, genera encoding y lo guarda en BD.
    Úsalo cuando no tengas foto del estudiante disponible.
    La cámara debe estar disponible (no en uso por otra sesión).
    """
    import cv2

    val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if str(val).upper().replace("USERROLE.", "") != "ADMIN":
        if str(val).upper().replace("USERROLE.", "") != "STUDENT":
            raise ForbiddenException("Rol no autorizado para esta acción")
        student_profile = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student_profile or str(student_profile.id) != student_id:
            raise ForbiddenException("No puedes capturar el rostro de otro estudiante")

    _check_fr_available()
    student = _get_student_or_404(student_id, db)

    # Capturar frame de la cámara
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        raise BadRequestException("No se pudo abrir la cámara. Verifica que esté disponible.")

    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        raise BadRequestException("No se pudo capturar un frame de la cámara")

    # Generar encoding
    encoding = encode_face_from_array(frame)
    if encoding is None:
        raise BadRequestException(
            "No se detectó ningún rostro en la imagen capturada. "
            "Asegúrate de estar frente a la cámara y con buena iluminación."
        )

    # Guardar en BD
    existing = db.query(FaceEncoding).filter(FaceEncoding.student_id == student.id).first()
    if existing:
        existing.encoding = serialize_encoding(encoding)
        existing.version += 1
        db.commit()
        action = "actualizado"
    else:
        fe = FaceEncoding(
            student_id=student.id,
            encoding=serialize_encoding(encoding),
            version=1,
        )
        db.add(fe)
        db.commit()
        action = "creado"

    return {
        "message": f"Encoding {action} por captura de cámara para {student.first_name} {student.last_name}",
        "student_id": str(student.id),
    }


# ────────────────────────────────────────────────────────────────────
# POST /api/face/recognize-frame  — frame desde webcam del navegador
# ────────────────────────────────────────────────────────────────────

@router.post("/recognize-frame")
async def recognize_frame_endpoint(
    file: UploadFile = File(..., description="Frame JPEG capturado por el navegador"),
    subject_id: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Recibe un frame JPEG desde la webcam del navegador,
    reconoce caras y registra asistencias automáticamente.
    """
    import numpy as np
    from app.models.attendance import Attendance
    from datetime import datetime, timezone

    _check_fr_available()

    contents = await file.read()
    if len(contents) == 0:
        return {"recognized": False, "name": None, "confidence": 0.0}

    # Decodificar imagen
    nparr = np.frombuffer(contents, np.uint8)
    import cv2
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame_bgr is None:
        return {"recognized": False, "name": None, "confidence": 0.0}

    # Cargar encodings de la BD
    from app.services.face_service import recognize_frame, deserialize_encoding
    rows = db.query(FaceEncoding).all()
    if not rows:
        return {"recognized": False, "name": None, "confidence": 0.0, "message": "No hay encodings registrados"}

    known_encodings, known_ids, known_names = [], [], []
    for fe in rows:
        student = db.query(Student).filter(Student.id == fe.student_id).first()
        if student and fe.encoding:
            known_encodings.append(deserialize_encoding(fe.encoding))
            known_ids.append(str(student.id))
            known_names.append(f"{student.first_name} {student.last_name}")

    if not known_encodings:
        return {"recognized": False, "name": None, "confidence": 0.0}

    # Reconocer
    _, matches = recognize_frame(frame_bgr, known_encodings, known_ids, known_names)

    if not matches:
        return {"recognized": False, "name": None, "confidence": 0.0}

    best = matches[0]

    # Registrar asistencia si hay materia activa y el alumno no fue registrado hoy
    if subject_id:
        from app.models.subject import Subject
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject or not subject.laboratory_id:
            return {
                "recognized": True,
                "name": best["name"],
                "confidence": best["confidence"],
                "student_id": best["student_id"],
                "warning": "Materia sin laboratorio asignado. Asigna un laboratorio a la materia para registrar asistencia.",
            }

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        existing = db.query(Attendance).filter(
            Attendance.student_id == best["student_id"],
            Attendance.subject_id == subject_id,
            Attendance.check_in_time >= today_start,
        ).first()

        if not existing:
            att = Attendance(
                student_id=best["student_id"],
                subject_id=subject_id,
                laboratory_id=subject.laboratory_id,
                confidence_score=best["confidence"],
                check_in_time=datetime.now(timezone.utc),
            )
            db.add(att)
            db.commit()


    return {
        "recognized": True,
        "name": best["name"],
        "confidence": best["confidence"],
        "student_id": best["student_id"],
    }


# ────────────────────────────────────────────────────────────────────
# DELETE /api/face/{student_id}
# ────────────────────────────────────────────────────────────────────

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_face_encoding(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Elimina el encoding facial de un estudiante."""
    student = _get_student_or_404(student_id, db)
    encoding = db.query(FaceEncoding).filter(FaceEncoding.student_id == student.id).first()
    if not encoding:
        raise NotFoundException(f"No hay encoding para el estudiante '{student_id}'")
    db.delete(encoding)
    db.commit()
    return None
