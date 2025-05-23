// Script to register a test user
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

// Test user credentials
const userData = {
  username: 'testuser',
  password: 'password123',
  email: 'testuser@example.com'
};

// Registration function
async function register() {
  console.log('Attempting to register test user...');
  
  const params = new URLSearchParams();
  params.append('username', userData.username);
  params.append('password', userData.password);
  params.append('email', userData.email);

  try {
    const response = await axios.post(`${API_BASE_URL}/api/register`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Registration successful:', response.data);
    return true;
  } catch (error) {
    console.error('Registration error:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return false;
  }
}

// Run the registration
register()
  .then(success => {
    if (success) {
      console.log('Test user successfully registered!');
    } else {
      console.log('Failed to register test user.');
    }
  });
