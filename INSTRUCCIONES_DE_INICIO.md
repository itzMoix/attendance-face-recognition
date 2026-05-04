# 🚀 Instrucciones para Iniciar el Sistema de Asistencia con Reconocimiento Facial

Este documento explica paso a paso cómo encender todos los servicios necesarios para que el proyecto funcione correctamente en tu computadora. Necesitas abrir al menos **3 ventanas de terminal** diferentes (PowerShell o Símbolo del Sistema) para mantener los procesos corriendo simultáneamente.

---

## 🛑 PASO 1: Iniciar la Base de Datos (PostgreSQL)

El proyecto utiliza Docker para ejecutar la base de datos de manera aislada y sin configuraciones complicadas.

1. Abre tu primera ventana de **Terminal**.
2. Dirígete a la carpeta raíz del proyecto:
   ```powershell
   cd C:\Users\moise\Documents\attendance-face-recognition
   ```
3. Ejecuta el contenedor de Docker en segundo plano (`-d`):
   ```powershell
   docker-compose up -d
   ```
4. **Verificación:** Puedes comprobar que la base de datos está corriendo ejecutando `docker ps`. Deberías ver un contenedor llamado `attendance-postgres`.

> **Nota:** Si acabas de encender la computadora, asegúrate de que la aplicación "Docker Desktop" esté abierta y ejecutándose en segundo plano antes de correr el comando.

---

## ⚙️ PASO 2: Iniciar el Backend (Python / FastAPI)

El backend maneja el reconocimiento facial, las reglas de negocio y se comunica con la base de datos.

1. Abre una **nueva (segunda) ventana de Terminal**.
2. Dirígete a la carpeta `backend`:
   ```powershell
   cd C:\Users\moise\Documents\attendance-face-recognition\backend
   ```
3. Ejecuta el servidor Uvicorn usando el entorno virtual (`venv`):
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. **Verificación:** Sabrás que encendió correctamente cuando veas mensajes como:
   `INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)` y `INFO: Application startup complete`.
5. **¡Importante!** No cierres esta ventana. Debe permanecer abierta mientras usas la aplicación.

---

## 🎨 PASO 3: Iniciar el Frontend (React / Vite)

El frontend es la interfaz visual donde los administradores, profesores y estudiantes interactúan con el sistema.

1. Abre una **nueva (tercera) ventana de Terminal**.
2. Dirígete a la carpeta `frontend`:
   ```powershell
   cd C:\Users\moise\Documents\attendance-face-recognition\frontend
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```powershell
   npm run dev
   ```
4. **Verificación:** Sabrás que encendió correctamente cuando veas el texto:
   `VITE ready in ... ms` y `➜  Local: http://localhost:5173/`.
5. **¡Importante!** Al igual que el backend, no cierres esta ventana.

---

## 🌐 PASO 4: Usar la Aplicación

Una vez que los tres componentes (Base de Datos, Backend y Frontend) están encendidos:

1. Abre tu navegador web favorito (Chrome, Edge, Firefox).
2. Entra a la siguiente dirección:
   👉 **http://localhost:5173**

### 🔑 Cuentas de Prueba:
Puedes usar las siguientes cuentas que vienen precargadas en la base de datos (Todas las contraseñas son: `Password123!`):

* **Administrador:** `admin@university.edu`
* **Profesor:** `garcia.juan@university.edu`
* **Estudiante:** `lopez.carlos@student.edu`

---

## 🔄 ¿Cómo Apagar Todo?

Cuando termines de trabajar y quieras apagar el sistema:
1. Ve a la **Terminal del Frontend** y presiona `Ctrl + C` (luego presiona `S` o `Y` para confirmar).
2. Ve a la **Terminal del Backend** y presiona `Ctrl + C`.
3. Ve a la **Terminal de Docker** (o abre una nueva en la raíz del proyecto) y ejecuta:
   ```powershell
   docker-compose down
   ```
   *(Esto detiene la base de datos de forma segura, tus datos NO se borrarán).*
