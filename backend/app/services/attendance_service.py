"""
Lógica de negocio para registro y listado de asistencias.
"""
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.attendance import Attendance
from app.models.subject import Subject
from app.models.laboratory import Laboratory
from app.models.face_encoding import FaceEncoding
from app.core.exceptions import NotFoundException, BadRequestException
from app.schemas.attendance import AttendanceResponse
from app.services.face_service import deserialize_encoding


def get_lab_from_subject(subject_id: str, db: Session) -> Optional[UUID]:
    """Helper: obtiene el laboratory_id de una materia."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    return subject.laboratory_id if subject else None


def load_all_encodings(db: Session) -> Tuple[List, List, List]:
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


def is_already_registered(student_id: UUID, subject_id: UUID, db: Session) -> bool:
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


def build_attendance_response(att: Attendance) -> AttendanceResponse:
    """Construye el DTO de respuesta para una asistencia."""
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


def create_manual_attendance(
    student_id: UUID, 
    subject_id: UUID, 
    laboratory_id: UUID, 
    confidence_score: float, 
    db: Session
) -> Attendance:
    """Crea una asistencia manual validando las entidades."""
    if not db.query(Student).filter(Student.id == student_id).first():
        raise NotFoundException(f"Estudiante '{student_id}' no encontrado")
    if not db.query(Subject).filter(Subject.id == subject_id).first():
        raise NotFoundException(f"Materia '{subject_id}' no encontrada")
    if not db.query(Laboratory).filter(Laboratory.id == laboratory_id).first():
        raise NotFoundException(f"Laboratorio '{laboratory_id}' no encontrado")

    att = Attendance(
        student_id=student_id,
        subject_id=subject_id,
        laboratory_id=laboratory_id,
        confidence_score=confidence_score,
        synced=True,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att
