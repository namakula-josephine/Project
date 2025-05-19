// Simple script to test the FastAPI login endpoint directly
// Run with Node.js: node scripts/test-api.js

// Using Node fetch
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testLogin() {
  try {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'testpassword');

    console.log('Testing connection to: http://localhost:8000/api/login');
    
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json().catch(() => {
      console.log('No JSON response body');
      return null;
    });
    
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();
