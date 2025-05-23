// Test script for the FastAPI authentication flow
// Run with Node.js: node scripts/test-api.js

// Using Node fetch
const fetch = require('node-fetch');
const FormData = require('form-data');

// Test credentials - must match exactly what was created in ensure_test_user.py
const TEST_USER = {
  username: 'testuser',
  password: 'testpassword',
  email: 'test@example.com'
};

async function testRegistration() {
  try {
    // Create form data for registration
    const formData = new FormData();
    formData.append('username', TEST_USER.username);
    formData.append('password', TEST_USER.password);
    formData.append('email', TEST_USER.email);

    console.log('\nTesting registration at: http://localhost:8000/api/register');
    
    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      body: formData
    });
    
    console.log('Registration status:', response.status);
    
    const data = await response.json().catch(() => {
      console.log('No JSON response body');
      return null;
    });
    
    console.log('Registration response:', data);
    return response.status === 200;
  } catch (error) {
    console.error('Error during registration:', error);
    return false;
  }
}

async function testLogin() {
  try {
    const formData = new FormData();
    formData.append('username', TEST_USER.username);
    formData.append('password', TEST_USER.password);

    console.log('\nTesting login at: http://localhost:8000/api/login');
    
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body: formData
    });
    
    console.log('Login status:', response.status);
    
    const data = await response.json().catch(() => {
      console.log('No JSON response body');
      return null;
    });
    
    console.log('Login response:', data);
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

// Run the tests sequentially
async function runTests() {
  // Skip registration and just test login to verify persistence
  console.log('\nTesting login with existing user to verify persistence...');
  console.log(`Username: ${TEST_USER.username}, Password: ${TEST_USER.password.substring(0, 3)}...`);
  
  // Create the exact form data structure to match what the server expects
  try {
    console.log('Preparing FormData for request...');
    const formData = new URLSearchParams();
    formData.append('username', TEST_USER.username);
    formData.append('password', TEST_USER.password);
    
    console.log('Making direct fetch request to API...');
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Raw response headers:', response.status, response.statusText);
    const data = await response.json().catch(e => {
      console.log('Failed to parse JSON response:', e);
      return null;
    });
    console.log('Raw response data:', data);
    
    if (response.ok && data && data.session_id) {
      console.log('\n✅ SUCCESS: Authentication works directly!');
      console.log(`Session ID: ${data.session_id}`);
    } else {
      console.log('\n❌ FAILURE: Authentication still has issues.');
    }
  } catch (error) {
    console.error('Error during direct API test:', error);
  }
}

runTests();
