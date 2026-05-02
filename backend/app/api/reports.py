"""
Reports API endpoints - Estadísticas y reportes
"""
from typing import Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.subject import Subject
from app.models.professor import Professor
from app.models.laboratory import Laboratory
from app.core.dependencies import get_current_active_user, require_role
from app.core.exceptions import ForbiddenException

router = APIRouter()


@router.get("/statistics")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Estadísticas generales del sistema. Requiere: Admin"""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    week_start = datetime.combine(today - timedelta(days=7), datetime.min.time())
    month_start = datetime.combine(today.replace(day=1), datetime.min.time())

    attendance_today = db.query(Attendance).filter(
        Attendance.check_in_time >= today_start,
        Attendance.check_in_time <= today_end
    ).count()

    avg_confidence = db.query(func.avg(Attendance.confidence_score)).scalar() or 0.0

    # Tendencia de los últimos 7 días
    daily_stats = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        d_start = datetime.combine(day, datetime.min.time())
        d_end = datetime.combine(day, datetime.max.time())
        count = db.query(Attendance).filter(
            Attendance.check_in_time >= d_start,
            Attendance.check_in_time <= d_end
        ).count()
        daily_stats.append({"date": day.isoformat(), "label": day.strftime("%d %b"), "count": count})

    return {
        "totals": {
            "students": db.query(Student).count(),
            "professors": db.query(Professor).count(),
            "subjects": db.query(Subject).filter(Subject.is_active == True).count(),
            "laboratories": db.query(Laboratory).filter(Laboratory.is_active == True).count(),
            "attendances": db.query(Attendance).count(),
        },
        "attendance": {
            "today": attendance_today,
            "this_week": db.query(Attendance).filter(Attendance.check_in_time >= week_start).count(),
            "this_month": db.query(Attendance).filter(Attendance.check_in_time >= month_start).count(),
            "avg_confidence": round(float(avg_confidence), 4),
        },
        "daily_trend": daily_stats,
    }


@router.get("/subject/{subject_id}")
async def get_subject_report(
    subject_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reporte de asistencias por materia. Requiere: Admin o Profesor"""
    if current_user.role == UserRole.STUDENT:
        raise ForbiddenException("Students cannot access subject reports")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return {"error": "Subject not found"}

    query = db.query(Attendance).filter(Attendance.subject_id == subject_id)
    if start_date:
        query = query.filter(Attendance.check_in_time >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(Attendance.check_in_time <= datetime.combine(end_date, datetime.max.time()))

    attendances = query.order_by(Attendance.check_in_time.desc()).all()

    # Estadísticas por estudiante
    student_stats = {}
    for att in attendances:
        student = db.query(Student).filter(Student.id == att.student_id).first()
        if not student:
            continue
        sid = str(student.id)
        if sid not in student_stats:
            student_stats[sid] = {
                "student_id": sid,
                "student_code": student.student_id,
                "full_name": f"{student.first_name} {student.last_name}",
                "career": student.career,
                "attendance_count": 0,
                "avg_confidence": 0.0,
                "_confs": [],
            }
        student_stats[sid]["attendance_count"] += 1
        student_stats[sid]["_confs"].append(att.confidence_score)

    for s in student_stats.values():
        if s["_confs"]:
            s["avg_confidence"] = round(sum(s["_confs"]) / len(s["_confs"]), 4)
        del s["_confs"]

    return {
        "subject": {"id": str(subject.id), "code": subject.code, "name": subject.name, "schedule": subject.schedule},
        "total_attendances": len(attendances),
        "unique_students": len(student_stats),
        "students": sorted(student_stats.values(), key=lambda x: x["attendance_count"], reverse=True),
    }


@router.get("/student/{student_id}")
async def get_student_report(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reporte de un estudiante. Requiere: Admin, Profesor, o el mismo estudiante."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise ForbiddenException("You can only view your own report")

    attendances = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).order_by(Attendance.check_in_time.desc()).limit(200).all()

    by_subject = {}
    for att in attendances:
        subject = db.query(Subject).filter(Subject.id == att.subject_id).first()
        sid = str(att.subject_id)
        if sid not in by_subject:
            by_subject[sid] = {
                "subject_id": sid,
                "subject_name": subject.name if subject else "Desconocida",
                "subject_code": subject.code if subject else "—",
                "count": 0,
                "_confs": [],
            }
        by_subject[sid]["count"] += 1
        by_subject[sid]["_confs"].append(att.confidence_score)

    for s in by_subject.values():
        s["avg_confidence"] = round(sum(s["_confs"]) / len(s["_confs"]), 4) if s["_confs"] else 0.0
        del s["_confs"]

    avg_conf = (sum(a.confidence_score for a in attendances) / len(attendances)) if attendances else 0.0

    return {
        "student": {
            "id": str(student.id),
            "student_code": student.student_id,
            "full_name": f"{student.first_name} {student.last_name}",
            "career": student.career,
            "semester": student.semester,
        },
        "summary": {
            "total_attendances": len(attendances),
            "subjects_attended": len(by_subject),
            "avg_confidence": round(avg_conf, 4),
        },
        "by_subject": sorted(by_subject.values(), key=lambda x: x["count"], reverse=True),
        "recent_attendances": [
            {
                "id": str(a.id),
                "subject_id": str(a.subject_id),
                "subject_name": (db.query(Subject).filter(Subject.id == a.subject_id).first() or type('', (), {'name': 'Desconocida'})()).name,
                "check_in_time": a.check_in_time.isoformat(),
                "confidence_score": a.confidence_score
            }
            for a in attendances[:50]
        ],
    }
