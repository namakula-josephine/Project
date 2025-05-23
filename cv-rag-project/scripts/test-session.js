// Script to test session management
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:8000';

// Test user credentials - Using our newly registered test user
const credentials = {
  username: 'testuser',
  password: 'password123'
};

// Login function
async function login() {
  console.log('1. Attempting to login...');
  
  // Using URL encoded form data for Node.js
  const params = new URLSearchParams();
  params.append('username', credentials.username);
  params.append('password', credentials.password);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('Login successful:', response.data);
    
    const sessionId = response.data.session_id;
    console.log('Received session ID:', sessionId);
    
    return sessionId;
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
}

// Get chat history function
async function getChatHistory(sessionId) {
  console.log('3. Getting chat history with session ID:', sessionId);
  try {
    const response = await axios.get(`${API_BASE_URL}/chat-history`, {
      params: { session_id: sessionId },
      headers: {
        'Authorization': sessionId
      }
    });
    
    console.log('Chat history response status:', response.status);
    console.log('Messages count:', response.data.messages?.length || 0);
    console.log('Response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Chat history error:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
}

// Query function
async function queryDocument(sessionId, question) {
  console.log('4. Sending query with session ID:', sessionId);
  try {
    const params = new URLSearchParams();
    params.append('question', question);
    params.append('session_id', sessionId);
    
    const response = await axios.post(`${API_BASE_URL}/query`, params, {
      headers: {
        'Authorization': sessionId,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Query response status:', response.status);
    console.log('Answer:', response.data.answer);
    
    return response.data;
  } catch (error) {
    console.error('Query error:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
}

// Create chat session function
async function createChatSession(sessionId) {
  console.log('2. Creating a chat session with ID:', sessionId);
  
  try {    const formData = new FormData();
    formData.append('title', 'Test Chat');
    formData.append('session_id', sessionId);
    
    // Use form-data-boundary workaround for Node.js
    const formDataPayload = `--form-data-boundary\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Chat\r\n--form-data-boundary\r\nContent-Disposition: form-data; name="session_id"\r\n\r\n${sessionId}\r\n--form-data-boundary--`;
    
    const response = await axios.post(`${API_BASE_URL}/chat-sessions`, formDataPayload, {
      headers: {
        'Authorization': sessionId,
        'Content-Type': 'multipart/form-data; boundary=form-data-boundary'
      }
    });
    
    console.log('Chat session created:', response.data);
    return true;
  } catch (error) {
    console.error('Error creating chat session:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return false;
  }
}

// Run the test
async function runTest() {
  console.log('Starting session management test...');
  
  // Step 1: Login
  const sessionId = await login();
  if (!sessionId) {
    console.error('Test failed: Could not login');
    return;
  }
  
  // Step 2: Create a chat session
  const chatSessionCreated = await createChatSession(sessionId);
  if (!chatSessionCreated) {
    console.error('Test failed: Could not create chat session');
    return;
  }
  
  // Step 3: Get chat history
  const chatHistory = await getChatHistory(sessionId);
  if (chatHistory === null) {
    console.error('Test failed: Could not retrieve chat history');
    return;
  }
    // Step 4: Send a query
  const question = 'What are the symptoms of early blight in potato plants?';
  const queryResponse = await queryDocument(sessionId, question);
  if (queryResponse === null) {
    console.error('Test failed: Could not send query');
    return;
  }
  
  // Step 5: Get updated chat history
  const updatedChatHistory = await getChatHistory(sessionId);
  if (updatedChatHistory === null) {
    console.error('Test failed: Could not retrieve updated chat history');
    return;
  }
  
  // Check if the new message is in the chat history
  const messageCount = updatedChatHistory.messages?.length || 0;
  const initialMessageCount = chatHistory.messages?.length || 0;
  
  console.log(`Initial message count: ${initialMessageCount}`);
  console.log(`Updated message count: ${messageCount}`);
  
  if (messageCount > initialMessageCount) {
    console.log('Test passed: New message was successfully added to chat history');
  } else {
    console.error('Test failed: New message was not added to chat history');
  }
  
  console.log('Session management test completed!');
}

// Run the test
runTest();
