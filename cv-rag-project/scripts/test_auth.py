"""
Test user creation and authentication in a single Python script.
"""
import os
import sys
import json
import requests

# Constants
API_BASE = "http://localhost:8000"
USERS_DB_FILE = '../fusion_project/users_db.json' 

def create_test_user():
    print("\n===== Creating Test User =====")
    username = "testuser_direct"
    password = "testpassword"
    email = "test_direct@example.com"
    
    # Register the user
    print(f"Registering user: {username}")
    response = requests.post(
        f"{API_BASE}/api/register",
        data={
            "username": username,
            "password": password,
            "email": email
        }
    )
    
    print(f"Registration response status: {response.status_code}")
    print(f"Registration response: {response.json() if response.ok else response.text}")
    
    return {
        "username": username,
        "password": password,
        "email": email
    }

def test_login(user):
    print("\n===== Testing Login =====")
    print(f"Logging in with user: {user['username']}")
    
    response = requests.post(
        f"{API_BASE}/api/login",
        data={
            "username": user['username'],
            "password": user['password']
        }
    )
    
    print(f"Login response status: {response.status_code}")
    print(f"Login response: {response.json() if response.ok else response.text}")
    
    return response.ok

def main():
    # Create a test user
    user = create_test_user()
    
    # Wait for the user to press enter to continue
    input("\nPress Enter to test logging in with the created user...")
    
    # Try to log in
    test_login(user)

if __name__ == "__main__":
    main()
