"""
Script de Seed para datos de prueba.
Crea: Laboratorio, Profesor, Materia, Estudiante + Encoding Facial Real.

Uso: python seed.py  (desde dentro del contenedor backend)
"""
import sys
import os
import uuid
import bcrypt
import numpy as np
import urllib.request

# ── Setup de path para que encuentre los módulos de la app ─────────
sys.path.insert(0, '/app')

from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.professor import Professor
from app.models.laboratory import Laboratory
from app.models.subject import Subject
from app.models.face_encoding import FaceEncoding


def hash_pwd(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def download_face_image(path: str) -> bool:
    """
    Descarga una imagen de rostro conocida para generar el encoding.
    Usa la imagen de ejemplo del repositorio de face_recognition.
    """
    urls = [
        "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/800px-President_Barack_Obama.jpg",
    ]
    for url in urls:
        try:
            print(f"  Descargando imagen de ejemplo desde: {url[:60]}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                with open(path, 'wb') as f:
                    f.write(r.read())
            print(f"  ✓ Imagen descargada ({os.path.getsize(path)} bytes)")
            return True
        except Exception as e:
            print(f"  ✗ Falló {url[:60]}: {e}")
    return False


def generate_encoding_from_image(image_path: str):
    """
    Genera el encoding facial (vector de 128 dimensiones) desde una imagen.
    Retorna bytes o None si no se detecta ningún rostro.
    """
    try:
        import face_recognition
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        if not encodings:
            print("  ✗ No se detectó ningún rostro en la imagen descargada.")
            return None
        print(f"  ✓ Encoding generado ({len(encodings)} rostro(s) detectados)")
        return encodings[0].tobytes()
    except Exception as e:
        print(f"  ✗ Error generando encoding: {e}")
        return None


def seed(db: Session):
    print("\n" + "="*60)
    print("  SEED DE DATOS DE PRUEBA")
    print("="*60)

    # ── 1. Laboratorio ────────────────────────────────────────────
    print("\n[1/6] Creando Laboratorio...")
    lab = db.query(Laboratory).filter_by(name="Laboratorio A101").first()
    if not lab:
        lab = Laboratory(
            id=uuid.uuid4(),
            name="Laboratorio A101",
            location="Edificio A, Planta Baja",
            capacity=30,
            camera_ip="192.168.1.100",
            is_active=True,
        )
        db.add(lab)
        db.flush()
        print(f"  ✓ Laboratorio creado: {lab.name} (id={lab.id})")
    else:
        print(f"  → Ya existe: {lab.name}")

    # ── 1.5. Administrador ─────────────────────────────────────────
    print("\n[1.5/6] Creando Administrador...")
    admin_user = db.query(User).filter_by(email="admin@sistema.edu").first()
    if not admin_user:
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@sistema.edu",
            password_hash=hash_pwd("admin1234"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.flush()
        print(f"  ✓ Admin creado: admin@sistema.edu")
    else:
        print(f"  → Ya existe: admin@sistema.edu")

    # ── 2. Profesor (usuario + registro de profesor) ───────────────
    print("\n[2/6] Creando Profesor...")
    prof_user = db.query(User).filter_by(email="profesor@sistema.edu").first()
    if not prof_user:
        prof_user = User(
            id=uuid.uuid4(),
            email="profesor@sistema.edu",
            password_hash=hash_pwd("profesor1234"),
            role=UserRole.PROFESSOR,
            is_active=True,
        )
        db.add(prof_user)
        db.flush()

        professor = Professor(
            id=uuid.uuid4(),
            user_id=prof_user.id,
            employee_id="EMP-2024001",
            first_name="Carlos",
            last_name="Ramírez",
            department="Ingeniería en Sistemas",
        )
        db.add(professor)
        db.flush()
        print(f"  ✓ Profesor creado: Carlos Ramírez (email=profesor@sistema.edu)")
    else:
        professor = db.query(Professor).filter_by(user_id=prof_user.id).first()
        print(f"  → Ya existe: profesor@sistema.edu")

    # ── 3. Materia ────────────────────────────────────────────────
    print("\n[3/6] Creando Materia...")
    subject = db.query(Subject).filter_by(code="SIS-401").first()
    if not subject:
        subject = Subject(
            id=uuid.uuid4(),
            code="SIS-401",
            name="Sistemas Operativos",
            professor_id=professor.id,
            laboratory_id=lab.id,
            schedule="Lunes y Miércoles 10:00-12:00",
            is_active=True,
        )
        db.add(subject)
        db.flush()
        print(f"  ✓ Materia creada: {subject.name} ({subject.code})")
    else:
        print(f"  → Ya existe: {subject.name}")

    # ── 4. Estudiante (usuario + registro de estudiante) ──────────
    print("\n[4/6] Creando Estudiante...")
    stud_user = db.query(User).filter_by(email="juan.perez@student.edu").first()
    if not stud_user:
        stud_user = User(
            id=uuid.uuid4(),
            email="juan.perez@student.edu",
            password_hash=hash_pwd("student1234"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        db.add(stud_user)
        db.flush()

        student = Student(
            id=uuid.uuid4(),
            user_id=stud_user.id,
            student_id="EST-2024001",
            first_name="Juan",
            last_name="Pérez",
            career="Ingeniería en Sistemas",
            semester=4,
        )
        db.add(student)
        db.flush()
        print(f"  ✓ Estudiante creado: Juan Pérez (email=juan.perez@student.edu)")
    else:
        student = db.query(Student).filter_by(user_id=stud_user.id).first()
        print(f"  → Ya existe: juan.perez@student.edu")

    # ── 5. Encoding facial ────────────────────────────────────────
    print("\n[5/6] Generando Encoding Facial...")
    existing_enc = db.query(FaceEncoding).filter_by(student_id=student.id).first()
    if not existing_enc:
        tmp_path = "/tmp/test_face.jpg"
        downloaded = download_face_image(tmp_path)

        if downloaded:
            encoding_bytes = generate_encoding_from_image(tmp_path)
            if encoding_bytes:
                face_enc = FaceEncoding(
                    id=uuid.uuid4(),
                    student_id=student.id,
                    encoding=encoding_bytes,
                    version=1,
                )
                db.add(face_enc)
                db.flush()
                print(f"  ✓ Encoding facial guardado en BD (128 dimensiones)")
            else:
                print("  ⚠ No se pudo generar encoding — el estudiante existe pero sin encoding facial")
        else:
            print("  ⚠ No se pudo descargar imagen — el estudiante existe pero sin encoding facial")
    else:
        encoding_arr = np.frombuffer(existing_enc.encoding, dtype=np.float64)
        print(f"  → Ya existe encoding ({len(encoding_arr)} dimensiones)")

    # ── 6. Segundo estudiante (sin encoding, para probar ese caso) ─
    print("\n[6/6] Creando segundo estudiante (sin encoding)...")
    stud2_user = db.query(User).filter_by(email="maria.garcia@student.edu").first()
    if not stud2_user:
        stud2_user = User(
            id=uuid.uuid4(),
            email="maria.garcia@student.edu",
            password_hash=hash_pwd("student1234"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        db.add(stud2_user)
        db.flush()

        student2 = Student(
            id=uuid.uuid4(),
            user_id=stud2_user.id,
            student_id="EST-2024002",
            first_name="María",
            last_name="García",
            career="Ingeniería en Software",
            semester=3,
        )
        db.add(student2)
        db.flush()
        print(f"  ✓ Segundo estudiante creado: María García (sin encoding aún)")
    else:
        print(f"  → Ya existe: maria.garcia@student.edu")

    db.commit()

    # ── Resumen final ─────────────────────────────────────────────
    print("\n" + "="*60)
    print("  ✅ SEED COMPLETADO")
    print("="*60)
    print("\n📋 CREDENCIALES DE ACCESO:")
    print("  Admin:    admin@sistema.edu     / admin1234")
    print("  Profesor: profesor@sistema.edu  / profesor1234")
    print("  Alumno 1: juan.perez@student.edu / student1234")
    print("  Alumno 2: maria.garcia@student.edu / student1234")
    print("\n📚 DATOS CREADOS:")
    print(f"  Laboratorio: Laboratorio A101 (id={lab.id})")
    print(f"  Materia:     SIS-401 — Sistemas Operativos")
    print(f"  Estudiantes: 2 (1 con encoding facial, 1 sin)")
    print("\n🌐 ACCEDE EN: http://localhost:5173")
    print("="*60 + "\n")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante el seed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
