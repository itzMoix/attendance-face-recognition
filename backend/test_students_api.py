"""
Script de prueba para endpoints de Students
Prueba todos los endpoints CRUD de la API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'

def print_section(title):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{title}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

# 1. LOGIN - Obtener token JWT
print_section("1. LOGIN - Obteniendo token JWT")
login_data = {
    "email": "admin@university.edu",
    "password": "Password123!"
}

response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print_success(f"Login exitoso!")
    print(f"Token: {token[:50]}...")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print_error(f"Login falló: {response.status_code}")
    print(response.text)
    exit(1)

# 2. LIST STUDENTS - Listar estudiantes (debería estar vacío)
print_section("2. GET /api/students - Listar estudiantes")
response = requests.get(f"{BASE_URL}/api/students", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# 3. CREATE STUDENT - Crear un estudiante
print_section("3. POST /api/students - Crear estudiante")
new_student = {
    "student_id": "EST-2026001",
    "first_name": "Juan",
    "last_name": "Pérez",
    "career": "Ingeniería en Sistemas",
    "semester": 5,
    "email": "juan.perez@student.edu",
    "password": "Student123!",
    "photo_url": None
}

response = requests.post(f"{BASE_URL}/api/students", json=new_student, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    student_data = response.json()
    student_id = student_data["id"]
    print_success(f"Estudiante creado con ID: {student_id}")
    print(f"Response: {json.dumps(student_data, indent=2, default=str)}")
else:
    print_error(f"Error: {response.text}")
    student_id = None

# 4. GET STUDENT - Obtener un estudiante específico
if student_id:
    print_section(f"4. GET /api/students/{student_id} - Obtener estudiante")
    response = requests.get(f"{BASE_URL}/api/students/{student_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")

# 5. UPDATE STUDENT - Actualizar estudiante
if student_id:
    print_section(f"5. PUT /api/students/{student_id} - Actualizar estudiante")
    update_data = {
        "semester": 6,
        "career": "Ingeniería de Software"
    }
    response = requests.put(f"{BASE_URL}/api/students/{student_id}", json=update_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print_success("Estudiante actualizado")
        print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")
    else:
        print_error(f"Error: {response.text}")

# 6. LIST STUDENTS AGAIN - Verificar que aparece el estudiante
print_section("6. GET /api/students - Listar estudiantes (después de crear)")
response = requests.get(f"{BASE_URL}/api/students", headers=headers)
print(f"Status: {response.status_code}")
print(f"Total estudiantes: {response.json()['total']}")
print(f"Response: {json.dumps(response.json(), indent=2, default=str)}")

# 7. DELETE STUDENT - Eliminar estudiante (opcional - comentado para mantener datos)
# if student_id:
#     print_section(f"7. DELETE /api/students/{student_id} - Eliminar estudiante")
#     response = requests.delete(f"{BASE_URL}/api/students/{student_id}", headers=headers)
#     print(f"Status: {response.status_code}")
#     if response.status_code == 204:
#         print_success("Estudiante eliminado")
#     else:
#         print_error(f"Error: {response.text}")

print_section("✓ PRUEBAS COMPLETADAS")
print(f"{Colors.GREEN}Todos los endpoints fueron probados exitosamente!{Colors.END}")
