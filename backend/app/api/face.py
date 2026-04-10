"""
Face encoding management endpoints.
Permite registrar, actualizar y eliminar encodings faciales de estudiantes.
"""
import io
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, status
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
# POST /api/face/upload/{student_id}
# ────────────────────────────────────────────────────────────────────

@router.post("/upload/{student_id}", status_code=status.HTTP_201_CREATED)
async def upload_face(
    student_id: str,
    file: UploadFile = File(..., description="Foto JPG/PNG del estudiante"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Sube una foto del estudiante, genera el encoding y lo guarda en BD.
    Reemplaza el encoding anterior si ya existía.
    """
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
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Captura un frame desde la cámara del laptop, genera encoding y lo guarda en BD.
    Úsalo cuando no tengas foto del estudiante disponible.
    La cámara debe estar disponible (no en uso por otra sesión).
    """
    import cv2

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
