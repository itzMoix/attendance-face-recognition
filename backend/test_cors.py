"""
Test CORS desde Python para verificar headers
"""
import requests

url = "http://localhost:8000/health"
headers = {
    "Origin": "http://localhost:5173"
}

print("Testing GET request with Origin header...")
response = requests.get(url, headers=headers)

print(f"\nStatus Code: {response.status_code}")
print(f"\nResponse Headers:")
for header, value in response.headers.items():
    print(f"  {header}: {value}")

print(f"\nResponse Body: {response.text}")

# Test login endpoint
print("\n" + "="*60)
print("Testing POST to /api/auth/login...")
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "email": "admin@university.edu",
    "password": "Password123!"
}

response = requests.post(login_url, json=login_data, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"\nResponse Headers:")
for header, value in response.headers.items():
    if 'access-control' in header.lower() or 'cors' in header.lower():
        print(f"  {header}: {value}")

if response.status_code == 200:
    print(f"\nLogin successful!")
else:
    print(f"\nResponse: {response.text}")
