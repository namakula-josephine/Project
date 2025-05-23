// Browser-compatible test script that can be run from the browser console
// to validate the session ID fix

// Utility function for displaying session info
function displaySessionInfo() {
  const token = APIClient.getToken();
  const storedSession = localStorage.getItem('potato_assistant_session');
  const parsedSession = storedSession ? JSON.parse(storedSession) : null;
  
  console.log('========= SESSION INFO =========');
  console.log('API Token:', token);
  console.log('Stored Session:', parsedSession);
  console.log('Token matches stored ID:', token === (parsedSession?.id || null) ? 'Yes ✅' : 'No ❌');
  console.log('===============================');
  
  return {
    token,
    storedId: parsedSession?.id,
    match: token === (parsedSession?.id || null)
  };
}

// Step 1: Log in
async function testLogin() {
  try {
    console.log('1. Testing login...');
    console.log('Initial session state:');
    displaySessionInfo();
    
    const response = await APIClient.login({
      username: 'testuser', 
      password: 'password123'
    });
    
    console.log('Login response:', response);
    console.log('Auth token set to:', APIClient.getToken());
    
    console.log('Session state after login:');
    displaySessionInfo();
    
    return response.session_id;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Step 2: Get chat history
async function testChatHistory(sessionId) {
  try {
    console.log('\n2. Testing chat history with session ID:', sessionId);
    console.log('Using auth token:', APIClient.getToken());
    
    // First sync session
    console.log('Synchronizing session with backend...');
    const syncResult = await APIClient.synchronizeSession();
    console.log('Session synchronization result:', syncResult);
    
    // Check session info after sync
    console.log('Session state after sync:');
    const sessionInfo = displaySessionInfo();
    
    // Get chat history
    console.log('Getting chat history...');
    const history = await APIClient.getChatHistory(sessionId);
    console.log('Chat history response:', history);
    return history;
  } catch (error) {
    console.error('Chat history error:', error);
    return null;
  }
}

// Step 3: Send a message
async function testSendMessage(sessionId) {
  try {
    console.log('3. Testing sending a message with session ID:', sessionId);
    
    const message = {
      role: 'user',
      content: 'What are the symptoms of early blight in potato plants?',
      timestamp: new Date().toISOString()
    };
    
    await APIClient.saveChatMessage(sessionId, message);
    console.log('Message sent successfully');
    
    // Now query for a response
    const formData = new FormData();
    formData.append('question', message.content);
    formData.append('session_id', sessionId);
    
    const response = await APIClient.queryDocument(formData);
    console.log('Query response:', response);
    
    return true;
  } catch (error) {
    console.error('Send message error:', error);
    return false;
  }
}

// Step 4: Test creating a chat session
async function testCreateChatSession(sessionId) {
  try {
    console.log('\n4. Testing chat session creation with session ID:', sessionId);
    
    const result = await APIClient.createChatSession('Test Chat', sessionId);
    console.log('Create chat session result:', result);
    return result;
  } catch (error) {
    console.error('Create chat session error:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('===============================');
  console.log('Starting API client tests...');
  console.log('===============================');
  
  // Test 1: Login
  const sessionId = await testLogin();
  if (!sessionId) {
    console.error('❌ Login test failed');
    return;
  }
  console.log('✅ Login test passed');
  
  // Test 2: Get chat history
  const history = await testChatHistory(sessionId);
  if (history) {
    console.log('✅ Initial chat history test completed');
  } else {
    console.log('⚠️ Initial chat history test - no history found (this may be expected for new users)');
  }
  
  // Test 3: Send message
  const messageResult = await testSendMessage(sessionId);
  if (!messageResult) {
    console.error('❌ Send message test failed');
    return;
  }
  console.log('✅ Send message test passed');
  
  // Test 4: Create chat session
  const sessionResult = await testCreateChatSession(sessionId);
  if (sessionResult) {
    console.log('✅ Create chat session test completed');
  } else {
    console.log('⚠️ Create chat session test failed');
  }
  
  // Test 5: Get updated chat history
  const updatedHistory = await testChatHistory(sessionId);
  if (updatedHistory && updatedHistory.messages && updatedHistory.messages.length > 0) {
    console.log('✅ Final chat history test passed with messages');
  } else {
    console.log('⚠️ Final chat history test - no messages found');
  }
  
  console.log('===============================');
  console.log('All tests completed!');
  console.log('Final session state:');
  displaySessionInfo();
  console.log('===============================');
}

// Run the tests
runAllTests();
