"""
Lógica de negocio para sincronización offline de asistencias.
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.schemas.attendance import OfflineSyncRecord


def sync_offline_attendances(records: List[OfflineSyncRecord], db: Session) -> Dict[str, int]:
    """
    Sincroniza registros de asistencia capturados en modo offline (IndexedDB).
    Ignora duplicados (mismo estudiante + materia en ventana de 1h).
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
    
    return {
        "received": len(records),
        "saved": saved,
        "duplicates_skipped": duplicates,
        "errors": errors
    }
