import urllib.request
import sys

# Test CORS headers
url = "http://localhost:8000/health"
req = urllib.request.Request(url)
req.add_header("Origin", "http://localhost:5173")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print("\nCORS Headers:")
        for header in ['access-control-allow-origin', 'access-control-allow-credentials', 
                      'access-control-allow-methods', 'access-control-allow-headers']:
            value = response.headers.get(header)
            print(f"  {header}: {value if value else 'NOT PRESENT'}")
        
        print(f"\nBody: {response.read().decode()}")
        
        if response.headers.get('access-control-allow-origin'):
            print("\n✅ CORS headers are present!")
            sys.exit(0)
        else:
            print("\n❌ CORS headers are MISSING!")
            sys.exit(1)
            
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
