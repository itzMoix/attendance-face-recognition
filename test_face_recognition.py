"""
Script de prueba completo para el sistema de reconocimiento facial.
Corre este script desde la carpeta raíz del proyecto.
"""
import sys
import os
import requests
import cv2
import time

BASE_URL = "http://localhost:8000"

# ─── Colores para la consola ─────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):   print(f"{GREEN}✅ {msg}{RESET}")
def err(msg):  print(f"{RED}❌ {msg}{RESET}")
def info(msg): print(f"{CYAN}ℹ️  {msg}{RESET}")
def warn(msg): print(f"{YELLOW}⚠️  {msg}{RESET}")
def title(msg): print(f"\n{BOLD}{CYAN}{'='*55}{RESET}\n{BOLD}   {msg}{RESET}\n{BOLD}{CYAN}{'='*55}{RESET}")

# ─── PASO 1: LOGIN ────────────────────────────────────────────────────
def login(email: str, password: str) -> str:
    title("PASO 1: Login")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        err(f"Login fallido: {res.text}")
        sys.exit(1)
    token = res.json()["access_token"]
    ok(f"Login exitoso como {email}")
    return token

# ─── PASO 2: Listar estudiantes ───────────────────────────────────────
def list_students(token: str) -> list:
    title("PASO 2: Estudiantes en la BD")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/students", headers=headers)
    if res.status_code != 200:
        err(f"Error al listar estudiantes: {res.text}")
        sys.exit(1)
    data = res.json()
    students = data["students"]
    if not students:
        warn("No hay estudiantes en la BD.")
        sys.exit(1)
    print(f"\n{'ID':>3}  {'Nombre':<25} {'ID Estudiantil':<15} {'UUID'}")
    print("-" * 80)
    for i, s in enumerate(students):
        name = f"{s['first_name']} {s['last_name']}"
        print(f"{i+1:>3}  {name:<25} {s['student_id']:<15} {s['id']}")
    return students

# ─── PASO 3: Capturar foto con la cámara ─────────────────────────────
def capture_photo_from_camera() -> str:
    title("PASO 3: Captura de foto con la cámara")
    info("Abriendo cámara... Presiona ESPACIO para tomar la foto, ESC para cancelar.")

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        err("No se pudo abrir la cámara.")
        sys.exit(1)

    face_classif = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    photo_path = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        display = frame.copy()

        faces = face_classif.detectMultiScale(frame, 1.1, 5)
        for (x, y, w, h) in faces:
            cv2.rectangle(display, (x, y), (x+w, y+h), (0, 255, 0), 2)

        msg = "ESPACIO=Tomar foto  ESC=Cancelar"
        cv2.putText(display, msg, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255,255,0), 2)
        if len(faces) > 0:
            cv2.putText(display, "Cara detectada!", (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,255,0), 2)
        else:
            cv2.putText(display, "Buscando cara...", (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,0,255), 2)

        cv2.imshow("Captura de Foto - Presiona ESPACIO", display)
        k = cv2.waitKey(1)

        if k == 27:  # ESC
            warn("Captura cancelada.")
            cap.release()
            cv2.destroyAllWindows()
            sys.exit(0)

        if k == 32 and len(faces) > 0:  # ESPACIO con cara detectada
            photo_path = "temp_capture.jpg"
            cv2.imwrite(photo_path, frame)
            ok(f"Foto guardada en {photo_path}")
            break

    cap.release()
    cv2.destroyAllWindows()
    return photo_path

# ─── PASO 4: Subir encoding ───────────────────────────────────────────
def upload_encoding(token: str, student_id: str, photo_path: str):
    title("PASO 4: Subir encoding facial")
    headers = {"Authorization": f"Bearer {token}"}
    with open(photo_path, "rb") as f:
        files = {"file": ("photo.jpg", f, "image/jpeg")}
        res = requests.post(
            f"{BASE_URL}/api/face/upload/{student_id}",
            headers=headers,
            files=files,
        )
    if res.status_code in (200, 201):
        ok(res.json().get("message", "Encoding guardado"))
    else:
        err(f"Error al subir encoding: {res.text}")
        sys.exit(1)

# ─── PASO 5: Listar materias ──────────────────────────────────────────
def list_subjects(token: str) -> list:
    title("PASO 5: Materias disponibles")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/subjects", headers=headers)
    if res.status_code != 200:
        err(f"Error: {res.text}")
        return []
    subjects = res.json().get("subjects", [])
    if not subjects:
        warn("No hay materias. Se usará None y el sistema registrará sin subject_id.")
        return []
    print(f"\n{'ID':>3}  {'Nombre':<30} {'Código':<12} {'UUID'}")
    print("-" * 80)
    for i, s in enumerate(subjects):
        print(f"{i+1:>3}  {s['name']:<30} {s['code']:<12} {s['id']}")
    return subjects

# ─── PASO 6: Iniciar sesión de reconocimiento ─────────────────────────
def start_session(token: str, subject_id: str):
    title("PASO 6: Iniciar reconocimiento")
    headers = {"Authorization": f"Bearer {token}"}
    body = {"subject_id": subject_id, "camera_index": 0}
    res = requests.post(f"{BASE_URL}/api/attendance/start-session", headers=headers, json=body)
    if res.status_code == 200:
        data = res.json()
        ok(data.get("message", "Sesión iniciada"))
    else:
        err(f"Error al iniciar sesión: {res.text}")
        sys.exit(1)

# ─── PASO 7: Ver stream de video ──────────────────────────────────────
def show_live_stream(token: str):
    title("PASO 7: Reconocimiento en vivo")
    info("Conectando al stream... Presiona ESC para detener.")

    url = f"{BASE_URL}/api/attendance/live-frame"
    headers = {"Authorization": f"Bearer {token}"}

    import urllib.request
    import numpy as np

    try:
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        stream = urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        err(f"No se pudo conectar al stream: {e}")
        info("Intenta abrir manualmente: http://localhost:8000/api/attendance/live-frame")
        return

    bytes_buffer = b""
    while True:
        bytes_buffer += stream.read(1024)
        a = bytes_buffer.find(b'\xff\xd8')
        b_idx = bytes_buffer.find(b'\xff\xd9')
        if a != -1 and b_idx != -1:
            jpg = bytes_buffer[a:b_idx+2]
            bytes_buffer = bytes_buffer[b_idx+2:]
            nparr = np.frombuffer(jpg, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                cv2.imshow("Reconocimiento en Vivo - ESC para salir", frame)
                if cv2.waitKey(1) == 27:
                    break

    cv2.destroyAllWindows()

# ─── PASO 8: Ver asistencias registradas ──────────────────────────────
def show_attendances(token: str):
    title("PASO 8: Asistencias registradas")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/attendance/", headers=headers)
    if res.status_code != 200:
        err(f"Error: {res.text}")
        return
    data = res.json()
    atts = data.get("attendances", [])
    if not atts:
        warn("No hay asistencias aún.")
        return
    print(f"\n{'Estudiante':<25} {'Materia':<25} {'Confianza':<10} {'Hora'}")
    print("-" * 80)
    for a in atts:
        print(f"{a.get('student_name','?'):<25} {a.get('subject_name','?'):<25} {a.get('confidence_score',0):<10.0%} {a.get('check_in_time','?')[:19]}")

# ─── PASO 9: Detener sesión ───────────────────────────────────────────
def stop_session(token: str):
    title("PASO 9: Detener sesión")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/api/attendance/stop-session", headers=headers)
    if res.status_code == 200:
        ok(res.json().get("message", "Sesión detenida"))
    else:
        err(f"Error al detener: {res.text}")

# ─── MAIN ─────────────────────────────────────────────────────────────
def main():
    print(f"\n{BOLD}{CYAN}🎓 Sistema de Asistencias con Reconocimiento Facial{RESET}")
    print(f"{CYAN}   Script de prueba completo{RESET}\n")

    # 1. Login
    token = login("admin@university.edu", "Password123!")

    # 2. Ver estudiantes
    students = list_students(token)

    # 3. Seleccionar estudiante
    print(f"\n{YELLOW}>> ¿Con qué estudiante hacer la prueba? (número): {RESET}", end="")
    idx = int(input()) - 1
    student = students[idx]
    student_id = student["id"]
    student_name = f"{student['first_name']} {student['last_name']}"
    ok(f"Seleccionado: {student_name}")

    # 4. Capturar foto
    print(f"\n{YELLOW}>> ¿Quieres capturar foto con la cámara ahora? (s/n): {RESET}", end="")
    use_camera = input().strip().lower() == "s"
    if use_camera:
        photo_path = capture_photo_from_camera()
        upload_encoding(token, student_id, photo_path)
        os.remove(photo_path)  # limpiar temporal
    else:
        print(f"{YELLOW}>> Escribe la ruta de la foto JPG (ej: C:/Users/moise/foto.jpg): {RESET}", end="")
        photo_path = input().strip().strip('"')
        if not os.path.exists(photo_path):
            err(f"Archivo no encontrado: {photo_path}")
            sys.exit(1)
        upload_encoding(token, student_id, photo_path)

    # 5. Seleccionar materia
    subjects = list_subjects(token)
    subject_id = None
    if subjects:
        print(f"\n{YELLOW}>> ¿Qué materia usar? (número, o 0 para ninguna): {RESET}", end="")
        s_idx = int(input()) - 1
        if s_idx >= 0:
            subject_id = subjects[s_idx]["id"]

    if not subject_id:
        warn("Sin materia seleccionada. Se necesita una materia para registrar asistencias.")
        warn("Crea una materia en Swagger: POST /api/subjects")
        sys.exit(0)

    # 6. Iniciar sesión
    start_session(token, subject_id)

    # 7. Ver stream en vivo
    info("Abriendo ventana de reconocimiento...")
    info("Cuando te detecte con caja VERDE, la asistencia se registra automáticamente.")
    time.sleep(1)
    show_live_stream(token)

    # 8. Ver asistencias
    show_attendances(token)

    # 9. Detener
    stop_session(token)
    ok("¡Prueba completada!")


if __name__ == "__main__":
    main()
