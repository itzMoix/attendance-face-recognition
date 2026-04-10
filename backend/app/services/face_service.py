"""
Face Recognition Service
Adapta la lógica de face_recoginition.py para trabajar con PostgreSQL.
"""
import io
import pickle
import threading
from typing import Optional

import cv2
import numpy as np

# face_recognition se importa con try/except para no romper el arranque si no está instalado
try:
    import face_recognition as fr
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False


# ────────────────────────────────────────────────────────────────────
# Serialización de encodings (numpy array ↔ bytes para PostgreSQL)
# ────────────────────────────────────────────────────────────────────

def serialize_encoding(encoding: np.ndarray) -> bytes:
    """Convierte un encoding numpy (128-dim) a bytes para guardarlo en BD."""
    return pickle.dumps(encoding)


def deserialize_encoding(data: bytes) -> np.ndarray:
    """Convierte bytes de la BD de vuelta a numpy array."""
    return pickle.loads(data)


# ────────────────────────────────────────────────────────────────────
# Generación de encodings desde imagen
# ────────────────────────────────────────────────────────────────────

def encode_face_from_array(image_bgr: np.ndarray) -> Optional[np.ndarray]:
    """
    Recibe un frame BGR de OpenCV, detecta la cara y genera el encoding.
    Retorna None si no detecta ninguna cara.
    """
    if not FACE_RECOGNITION_AVAILABLE:
        raise RuntimeError("face_recognition no está instalado. Ejecuta: pip install face-recognition")

    # face_recognition trabaja con RGB
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    encodings = fr.face_encodings(image_rgb)

    if len(encodings) == 0:
        return None
    return encodings[0]


def encode_face_from_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Recibe bytes de una imagen (upload), la decodifica y genera encoding.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("No se pudo decodificar la imagen")
    return encode_face_from_array(img_bgr)


# ────────────────────────────────────────────────────────────────────
# Reconocimiento de frame
# ────────────────────────────────────────────────────────────────────

def recognize_frame(
    frame_bgr: np.ndarray,
    known_encodings: list[np.ndarray],
    known_ids: list[str],
    known_names: list[str],
    threshold: float = 0.6,
) -> tuple[np.ndarray, list[dict]]:
    """
    Dado un frame BGR, detecta y reconoce caras.

    Returns:
        frame anotado (BGR), lista de matches:
            [{"student_id": str, "name": str, "confidence": float, "box": (x,y,w,h)}]
    """
    if not FACE_RECOGNITION_AVAILABLE:
        raise RuntimeError("face_recognition no está instalado")

    face_classif = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    frame = cv2.flip(frame_bgr, 1)
    orig = frame.copy()
    faces = face_classif.detectMultiScale(frame, 1.1, 5)
    matches_found = []

    for (x, y, w, h) in faces:
        face_crop = orig[y : y + h, x : x + w]
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        actual_encodings = fr.face_encodings(face_rgb)

        name = "Desconocido"
        student_id = None
        confidence = 0.0
        color = (50, 50, 255)  # rojo

        if len(actual_encodings) > 0 and len(known_encodings) > 0:
            distances = fr.face_distance(known_encodings, actual_encodings[0])
            best_idx = int(np.argmin(distances))
            best_dist = float(distances[best_idx])

            if best_dist < threshold:
                confidence = round(1.0 - best_dist, 3)
                name = known_names[best_idx]
                student_id = known_ids[best_idx]
                color = (125, 220, 0)  # verde

                matches_found.append(
                    {
                        "student_id": student_id,
                        "name": name,
                        "confidence": confidence,
                        "box": (x, y, w, h),
                    }
                )

        # Dibujar anotaciones
        cv2.rectangle(frame, (x, y + h), (x + w, y + h + 30), color, -1)
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        label = f"{name} ({confidence:.0%})" if student_id else name
        cv2.putText(frame, label, (x + 4, y + h + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    return frame, matches_found


def frame_to_jpeg_bytes(frame_bgr: np.ndarray) -> bytes:
    """Convierte frame BGR a bytes JPEG para stream HTTP."""
    _, buffer = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return buffer.tobytes()


# ────────────────────────────────────────────────────────────────────
# Sesión de cámara (singleton thread-safe)
# ────────────────────────────────────────────────────────────────────

class CameraSession:
    """
    Singleton que mantiene la cámara abierta entre requests.
    Se inicia con start() y se cierra con stop().
    """

    def __init__(self):
        self._cap: Optional[cv2.VideoCapture] = None
        self._lock = threading.Lock()
        self.is_running = False
        self.subject_id: Optional[str] = None  # materia activa

    def start(self, camera_index: int = 0, subject_id: Optional[str] = None) -> bool:
        with self._lock:
            if self.is_running:
                return True  # ya está corriendo
            cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
            if not cap.isOpened():
                return False
            self._cap = cap
            self.is_running = True
            self.subject_id = subject_id
            return True

    def stop(self):
        with self._lock:
            if self._cap:
                self._cap.release()
                self._cap = None
            self.is_running = False
            self.subject_id = None

    def read_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            if not self._cap or not self.is_running:
                return None
            ret, frame = self._cap.read()
            return frame if ret else None


# Instancia global de la sesión de cámara
camera_session = CameraSession()
