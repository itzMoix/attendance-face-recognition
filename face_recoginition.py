import cv2
import tkinter as tk
from tkinter import messagebox
import requests
import base64
import pickle
import numpy as np
import time

try:
    import face_recognition as fr
    FR_AVAILABLE = True
except ImportError:
    FR_AVAILABLE = False

API_BASE_URL = "http://localhost:8000/api"
TOKEN = None

# ==========================================
# 1. Autenticación y Conexión
# ==========================================

def login(root):
    global TOKEN
    login_window = tk.Toplevel(root)
    login_window.title("Terminal de Asistencia (Login)")
    login_window.geometry("350x250")
    login_window.grab_set()
    
    tk.Label(login_window, text="Conectar a la Base de Datos", font=("Helvetica", 11, "bold")).pack(pady=10)
    
    tk.Label(login_window, text="Email:").pack()
    entry_email = tk.Entry(login_window, width=35)
    entry_email.pack(pady=5)
    
    tk.Label(login_window, text="Contraseña:").pack()
    entry_password = tk.Entry(login_window, show="*", width=35)
    entry_password.pack(pady=5)
    
    def attempt_login():
        global TOKEN
        email = entry_email.get()
        password = entry_password.get()
        
        try:
            res = requests.post(f"{API_BASE_URL}/auth/login", data={"username": email, "password": password})
            if res.status_code == 200:
                TOKEN = res.json().get("access_token")
                messagebox.showinfo("Éxito", "Sesión iniciada.", parent=login_window)
                login_window.destroy()
            else:
                messagebox.showerror("Error", "Credenciales incorrectas.", parent=login_window)
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo conectar al backend:\n{e}", parent=login_window)
            
    tk.Button(login_window, text="Ingresar", command=attempt_login, bg="indigo", fg="white", width=15).pack(pady=20)
    root.wait_window(login_window)
    return TOKEN is not None


# ==========================================
# 2. Asistencia Automática (Terminal de Cámara)
# ==========================================

def iniciar_reconocimiento_local(subject_id, laboratory_id, subject_name, window_to_close):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # 1. Descargar los vectores faciales desde PostgreSQL
    print("Descargando huellas faciales desde la BD...")
    try:
        res = requests.get(f"{API_BASE_URL}/face/encodings", headers=headers)
        if res.status_code != 200:
            messagebox.showerror("Error", "No se pudieron descargar los rostros.")
            return
        data = res.json().get("data", [])
    except Exception as e:
        messagebox.showerror("Error", f"Fallo al conectar:\n{e}")
        return
        
    known_encodings = []
    known_ids = []
    known_names = []
    
    for row in data:
        try:
            b64_bytes = row["encoding_base64"].encode('utf-8')
            pkl_bytes = base64.b64decode(b64_bytes)
            encoding = pickle.loads(pkl_bytes)
            
            known_encodings.append(encoding)
            known_ids.append(row["student_id"])
            known_names.append(row["name"])
        except Exception:
            pass
            
    if not known_encodings:
        messagebox.showerror("Error", "La base de datos no tiene alumnos con fotos registradas aún.")
        return
        
    window_to_close.withdraw() # Ocultar ventana de menú para dejar solo la cámara
    
    # 2. Iniciar Cámara
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    
    # Prevenir spam de asistencias (cooldown de 1 hora por alumno por materia)
    last_attendance = {}
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        orig = frame.copy()
        
        faces = faceClassif.detectMultiScale(frame, 1.1, 5)
        
        for (x, y, w, h) in faces:
            face_crop = orig[y:y+h, x:x+w]
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            
            actual_encodings = fr.face_encodings(face_rgb)
            
            name = "Desconocido"
            color = (50, 50, 255) # Rojo
            
            if len(actual_encodings) > 0:
                distances = fr.face_distance(known_encodings, actual_encodings[0])
                best_idx = int(np.argmin(distances))
                best_dist = float(distances[best_idx])
                
                # Nivel de tolerancia
                if best_dist < 0.55:
                    confidence = round(1.0 - best_dist, 3)
                    name = known_names[best_idx]
                    student_id = known_ids[best_idx]
                    color = (125, 220, 0) # Verde
                    
                    now = time.time()
                    # Si no lo hemos registrado en los últimos 60 minutos... (3600 segs)
                    if student_id not in last_attendance or (now - last_attendance[student_id] > 3600):
                        att_data = {
                            "student_id": student_id,
                            "subject_id": subject_id,
                            "laboratory_id": laboratory_id,
                            "confidence_score": confidence
                        }
                        try:
                            r = requests.post(f"{API_BASE_URL}/attendance/manual", json=att_data, headers=headers)
                            if r.status_code == 201:
                                last_attendance[student_id] = now
                                print(f"[+] Asistencia marcada en BD: {name}")
                        except:
                            pass

            cv2.rectangle(frame, (x, y+h), (x+w, y+h+30), color, -1)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, name, (x, y+h+25), 2, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
        cv2.putText(frame, f"Asistencia: {subject_name}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,0), 2)
        cv2.putText(frame, "Cerrar ventana para salir", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,0), 2)
        
        cv2.imshow("Terminal de Asistencia Activa", frame)
        if cv2.waitKey(1) == 27 or cv2.getWindowProperty("Terminal de Asistencia Activa", cv2.WND_PROP_VISIBLE) < 1:
            break
        
    cap.release()
    cv2.destroyAllWindows()
    window_to_close.deiconify() # Mostrar menú de nuevo

# ==========================================
# 3. Menú Principal (Selección de Clase)
# ==========================================

def main():
    root = tk.Tk()
    root.title("Terminal de Asistencia Automática")
    root.geometry("400x300")
    
    root.withdraw() 
    if not login(root):
        root.destroy()
        return
    root.deiconify()
    
    if not FR_AVAILABLE:
        messagebox.showerror("Librería Faltante", "Para hacer reconocimiento en esta computadora, instala la librería:\npip install face-recognition")
        root.destroy()
        return

    tk.Label(root, text="Terminal de Asistencia", font=("Helvetica", 16, "bold")).pack(pady=20)
    tk.Label(root, text="Descargando materias...", fg="gray").pack()
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    try:
        res = requests.get(f"{API_BASE_URL}/subjects?is_active=true", headers=headers)
        if res.status_code == 200:
            subjects = res.json().get("subjects", [])
        else:
            subjects = []
    except:
        subjects = []
        
    for widget in root.winfo_children():
        widget.destroy()

    if not subjects:
        tk.Label(root, text="No tienes materias asignadas o activas.", fg="red").pack(pady=20)
        tk.Button(root, text="Salir", command=root.destroy).pack()
        root.mainloop()
        return
        
    tk.Label(root, text="Selecciona la materia que vas a impartir:", font=("Helvetica", 11)).pack(pady=20)
    
    subject_var = tk.StringVar(root)
    subject_map = {f"{s['code']} - {s['name']}": s for s in subjects}
    subject_var.set(list(subject_map.keys())[0])
    
    tk.OptionMenu(root, subject_var, *subject_map.keys()).pack(pady=10)
    
    def empezar():
        subj = subject_map[subject_var.get()]
        iniciar_reconocimiento_local(subj["id"], subj.get("laboratory_id"), subj["name"], root)
        
    tk.Button(root, text="Encender Cámara y Pasar Lista", command=empezar, bg="#4CAF50", fg="white", font=("Helvetica", 11, "bold")).pack(pady=30)
    
    tk.Label(root, text="El registro de alumnos nuevos se hace desde el panel web.", fg="gray", font=("Helvetica", 8)).pack(side=tk.BOTTOM, pady=10)

    root.mainloop()

if __name__ == "__main__":
    main()