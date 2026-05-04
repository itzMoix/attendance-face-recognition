"""
Script de Seed para datos de prueba.
Crea: Admin, Laboratorio, Profesor, Materia, 2 Estudiantes + Encoding Facial.

Uso: python seed.py  (desde la carpeta backend/)
"""
import sys
import os
import uuid
import tempfile
import bcrypt
import numpy as np
import urllib.request

# Forzar stdout en UTF-8 para evitar errores en Windows con caracteres especiales
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

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
    """
    urls = [
        "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/800px-President_Barack_Obama.jpg",
    ]
    for url in urls:
        try:
            print(f"  Descargando imagen desde: {url[:60]}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                with open(path, 'wb') as f:
                    f.write(r.read())
            print(f"  [OK] Imagen descargada ({os.path.getsize(path)} bytes)")
            return True
        except Exception as e:
            print(f"  [FAIL] {url[:60]}: {e}")
    return False


def generate_encoding_from_image(image_path: str):
    """
    Genera el encoding facial (128 dimensiones) desde una imagen.
    """
    try:
        import face_recognition
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        if not encodings:
            print("  [WARN] No se detecto ningun rostro en la imagen descargada.")
            return None
        print(f"  [OK] Encoding generado ({len(encodings)} rostro(s) detectados)")
        import pickle
        return pickle.dumps(encodings[0])
    except Exception as e:
        print(f"  [FAIL] Error generando encoding: {e}")
        return None


def seed(db: Session):
    print("\n" + "="*60)
    print("  SEED DE DATOS DE PRUEBA")
    print("="*60)

    # -- 0. Admin -------------------------------------------------------
    print("\n[0/6] Creando Admin...")
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
        print("  [OK] Admin creado: admin@sistema.edu / admin1234")
    else:
        print("  [->] Ya existe: admin@sistema.edu")

    # -- 1. Laboratorio -------------------------------------------------
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
        print(f"  [OK] Laboratorio creado: {lab.name} (id={lab.id})")
    else:
        print(f"  [->] Ya existe: {lab.name}")

    # -- 2. Profesor ----------------------------------------------------
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
            last_name="Ramirez",
            department="Ingenieria en Sistemas",
        )
        db.add(professor)
        db.flush()
        print("  [OK] Profesor creado: Carlos Ramirez (email=profesor@sistema.edu)")
    else:
        professor = db.query(Professor).filter_by(user_id=prof_user.id).first()
        print("  [->] Ya existe: profesor@sistema.edu")

    # -- 3. Materia -----------------------------------------------------
    print("\n[3/6] Creando Materia...")
    subject = db.query(Subject).filter_by(code="SIS-401").first()
    if not subject:
        subject = Subject(
            id=uuid.uuid4(),
            code="SIS-401",
            name="Sistemas Operativos",
            professor_id=professor.id,
            laboratory_id=lab.id,
            schedule="Lunes y Miercoles 10:00-12:00",
            is_active=True,
        )
        db.add(subject)
        db.flush()
        print(f"  [OK] Materia creada: {subject.name} ({subject.code})")
    else:
        print(f"  [->] Ya existe: {subject.name}")

    # -- 4. Estudiante 1 ------------------------------------------------
    print("\n[4/6] Creando Estudiante 1...")
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
            last_name="Perez",
            career="Ingenieria en Sistemas",
            semester=4,
        )
        db.add(student)
        db.flush()
        print("  [OK] Estudiante creado: Juan Perez (email=juan.perez@student.edu)")
    else:
        student = db.query(Student).filter_by(user_id=stud_user.id).first()
        print("  [->] Ya existe: juan.perez@student.edu")

    # -- 5. Encoding facial del estudiante 1 ----------------------------
    print("\n[5/6] Generando Encoding Facial...")
    existing_enc = db.query(FaceEncoding).filter_by(student_id=student.id).first()
    if not existing_enc:
        # Usar directorio temporal compatible con Windows y Linux
        tmp_dir = tempfile.gettempdir()
        tmp_path = os.path.join(tmp_dir, "test_face_seed.jpg")
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
                print("  [OK] Encoding facial guardado en BD (128 dimensiones, serializado con pickle)")
            else:
                print("  [WARN] No se pudo generar encoding — estudiante existe pero sin encoding facial")
        else:
            print("  [WARN] No se pudo descargar imagen — estudiante existe pero sin encoding facial")
    else:
        print(f"  [->] Ya existe encoding para el estudiante")

    # -- 6. Estudiante 2 (sin encoding) ---------------------------------
    print("\n[6/6] Creando Estudiante 2 (sin encoding)...")
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

        Student(
            id=uuid.uuid4(),
            user_id=stud2_user.id,
            student_id="EST-2024002",
            first_name="Maria",
            last_name="Garcia",
            career="Ingenieria en Software",
            semester=3,
        )
        db.add(Student(
            id=uuid.uuid4(),
            user_id=stud2_user.id,
            student_id="EST-2024002",
            first_name="Maria",
            last_name="Garcia",
            career="Ingenieria en Software",
            semester=3,
        ))
        db.flush()
        print("  [OK] Segundo estudiante creado: Maria Garcia (sin encoding aun)")
    else:
        print("  [->] Ya existe: maria.garcia@student.edu")

    db.commit()

    # -- Resumen --------------------------------------------------------
    print("\n" + "="*60)
    print("  SEED COMPLETADO EXITOSAMENTE")
    print("="*60)
    print("\nCREDENCIALES DE ACCESO:")
    print("  Admin:    admin@sistema.edu          / admin1234")
    print("  Profesor: profesor@sistema.edu        / profesor1234")
    print("  Alumno 1: juan.perez@student.edu      / student1234")
    print("  Alumno 2: maria.garcia@student.edu    / student1234")
    print("\nDATOS CREADOS:")
    print(f"  Laboratorio: Laboratorio A101 (id={lab.id})")
    print(f"  Materia:     SIS-401 - Sistemas Operativos")
    print(f"  Estudiantes: 2 (1 con encoding facial, 1 sin)")
    print("\nACCEDE EN: http://localhost:5173")
    print("="*60 + "\n")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error durante el seed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
