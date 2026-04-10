import urllib.request
import json

# Test full login flow
print("=" * 60)
print("TEST 1: Login")
print("=" * 60)

login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "email": "admin@university.edu",
    "password": "Password123!"
}

req = urllib.request.Request(
    login_url,
    data=json.dumps(login_data).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print("\nCORS Headers:")
        cors_origin = response.headers.get('access-control-allow-origin')
        print(f"  access-control-allow-origin: {cors_origin if cors_origin else 'NOT PRESENT'}")
        
        body = json.loads(response.read().decode())
        token = body.get('access_token')
        print(f"\nToken received: {token[:50] if token else 'NONE'}...")
        
        # Test 2: Get current user
        print("\n" + "=" * 60)
        print("TEST 2: Get Current User (/api/auth/me)")
        print("=" * 60)
        
        me_url = "http://localhost:8000/api/auth/me"
        me_req = urllib.request.Request(
            me_url,
            headers={
                'Authorization': f'Bearer {token}',
                'Origin': 'http://localhost:5173'
            }
        )
        
        with urllib.request.urlopen(me_req) as me_response:
            print(f"Status: {me_response.status}")
            print("\nCORS Headers:")
            cors_origin = me_response.headers.get('access-control-allow-origin')
            print(f"  access-control-allow-origin: {cors_origin if cors_origin else 'NOT PRESENT'}")
            
            user_data = json.loads(me_response.read().decode())
            print(f"\nUser: {user_data.get('email')} - Role: {user_data.get('role')}")
            
            if cors_origin:
                print("\n✅ CORS works on /api/auth/me!")
            else:
                print("\n❌ CORS headers missing on /api/auth/me")
                
except urllib.error.HTTPError as e:
    print(f"❌ HTTP Error: {e.code} - {e.reason}")
    print(f"Response: {e.read().decode()}")
except Exception as e:
    print(f"❌ Error: {e}")
