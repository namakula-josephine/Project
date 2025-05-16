"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Message, Chat } from "@/types/chat"
import { apiService } from "@/lib/services/api-service"
import { sessionService } from "@/lib/services/session-service"
import { VisionService } from '@/lib/vision/vision-service';
import { APIClient } from "@/lib/api-client";
import Sidebar from "./sidebar"

const debugLog = (component: string, message: string, data?: any) => {
  console.log(`[${component}] ${message}`, data || '');
};

const debugError = (component: string, message: string, error: any) => {
  console.error(`[${component}] ${message}`, {
    error: error.message,
    stack: error.stack,
    response: error.response?.data,
    status: error.response?.status,
  });
};

export default function ChatInterface() {
  // Session state
  const [sessionId, setSessionId] = useState<string>("")

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("text")
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [currentChatTitle, setCurrentChatTitle] = useState("")
  const [chatStarted, setChatStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize session
  useEffect(() => {
    const id = sessionService.getSessionId()
    setSessionId(id)

    // Load recent chats
    const chats = sessionService.getRecentChats()
    setRecentChats(chats)
  }, [])

  // Save recent chats when they change
  useEffect(() => {
    sessionService.saveRecentChats(recentChats)
  }, [recentChats])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Update chat title based on first message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "user") {
      // Create a title from the first message
      const firstMessage = messages[0].content
      const title = firstMessage.length > 25 ? firstMessage.substring(0, 25) + "..." : firstMessage
      setCurrentChatTitle(title)
      setChatStarted(true)
    }
  }, [messages])

  // Load chat history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadChatHistory()
    }
  }, [sessionId])

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null) // Clear any previous errors
    }
  }

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Start a new chat
  const handleNewChat = () => {
    // Clear chat history for the current session
    if (sessionId) {
      APIClient.clearChatHistory(sessionId);
    }

    // Reset current chat
    setMessages([])
    setCurrentChatTitle("")
    setChatStarted(false)
    setActiveTab("text")
    setError(null)
  }

  // Handle image analysis
  const handleAnalyzeImage = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    // If this is the first message, start a new chat
    if (messages.length === 0) {
      setChatStarted(true)
      setCurrentChatTitle(`Analysis of ${file.name}`)
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `I've uploaded an image for analysis: ${file.name}`,
        timestamp: new Date().toISOString(),
      },
    ])

    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await APIClient.queryDocument(formData)

      // Add assistant message with results
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Here's my analysis of your potato plant:",
          result: {
            predicted_class: response.predicted_class,
            confidence: response.confidence,
            explanation: response.explanation,
            treatment_plans: response.treatment_plans
          },
          timestamp: new Date().toISOString(),
        },
      ])

      // Switch to text tab after analysis
      setActiveTab("text")
    } catch (error) {
      console.error("Image analysis error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Error processing the image",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setError(null);

    // If this is the first message, start a new chat
    if (messages.length === 0) {
      setChatStarted(true);
      setCurrentChatTitle(userMessage.length > 25 ? userMessage.substring(0, 25) + "..." : userMessage);
    }

    const newUserMessage = {
      role: "user" as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    // Add user message locally first
    setMessages((prev) => [...prev, newUserMessage]);
    
    setLoading(true);

    try {
      // Save user message to history
      await APIClient.saveChatMessage(sessionId, newUserMessage);

      // Send query to backend
      const formData = new FormData();
      formData.append('question', userMessage);
      formData.append('session_id', sessionId);
      const response = await APIClient.queryDocument(formData);

      const assistantMessage = {
        role: "assistant" as const,
        content: response.answer,
        timestamp: new Date().toISOString(),
      };

      // Add assistant message locally first
      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await APIClient.saveChatMessage(sessionId, assistantMessage);
    } catch (error: any) {
      debugError("MessageSubmit", "Error in message flow:", error);
      
      let errorMessage: Message;
      if (error.message.includes('log in')) {
        // Handle authentication errors
        errorMessage = {
          role: "system" as const,
          content: error.message,
          error: {
            message: error.message,
            status: 401
          },
          timestamp: new Date().toISOString(),
        };
        setError(error.message);
      } else {
        // Handle other errors
        errorMessage = {
          role: "assistant" as const,
          content: "I encountered an error processing your message. Please try again.",
          error: {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          },
          timestamp: new Date().toISOString(),
        };
      }
      
      setMessages((prev) => [...prev, errorMessage]);
      
      // Try to save the error message
      try {
        await APIClient.saveChatMessage(sessionId, errorMessage);
      } catch (saveError) {
        debugError("MessageSubmit", "Failed to save error message:", saveError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load a chat history
  const handleLoadChat = async (chatId: string) => {
    debugLog('ChatLoad', `Loading chat: ${chatId}`);
    
    try {
      setLoading(true);
      setError(null);

      const chat = recentChats.find((c) => c.id === chatId);
      debugLog('ChatLoad', 'Found chat:', chat);

      if (chat) {
        // Add loading indicator message
        setMessages([{
          role: 'system',
          content: `Loading chat "${chat.title}"...`,
          timestamp: new Date().toISOString()
        }]);

        // Fetch the actual messages for this chat
        const response = await APIClient.getChatHistory(sessionId);
        debugLog('ChatLoad', 'Loaded chat messages:', response);

        if (response.messages && Array.isArray(response.messages)) {
          setMessages(response.messages);
          setCurrentChatTitle(chat.title);
          setChatStarted(true);
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
    } catch (error: any) {
      debugError('ChatLoad', 'Failed to load chat:', error);
      setError(`Failed to load chat: ${error.message}`);
      
      // Show error in the chat
      setMessages([{
        role: 'system',
        content: 'Failed to load chat. Details:',
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Load chat history
  const loadChatHistory = async () => {
    if (!sessionId) {
      debugLog('ChatHistory', 'No session ID available');
      return;
    }

    debugLog('ChatHistory', `Loading chat history for session: ${sessionId}`);
    
    try {
      const { messages: chatHistory } = await APIClient.getChatHistory(sessionId);
      debugLog('ChatHistory', 'Received chat history:', chatHistory);

      if (chatHistory && Array.isArray(chatHistory)) {
        debugLog('ChatHistory', `Found ${chatHistory.length} messages`);
        setMessages(chatHistory);
        if (chatHistory.length > 0) {
          setCurrentChatTitle(chatHistory[0].content);
          setChatStarted(true);
        }
      } else {
        debugLog('ChatHistory', 'No chat history found');
        setMessages([]);
        setChatStarted(false);
      }
    } catch (error: any) {
      debugError('ChatHistory', 'Failed to load chat history:', error);
      // Start fresh instead of showing error
      setMessages([]);
      setChatStarted(false);
    }
  };

  // Render message
  const renderMessage = (message: Message, index: number) => {
    return (
      <div key={index} className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}>
        <div className="message-avatar">
          {message.role === "user" ? "👤" : message.role === "system" ? "⚙️" : "🤖"}
        </div>
        <div className="message-content">
          <p>{message.content}</p>

          {message.error && (
            <div className="message-error">
              <p><strong>Error:</strong> {message.error.message}</p>
              {message.error.status && (
                <p><strong>Status:</strong> {message.error.status}</p>
              )}
              {message.error.data && (
                <pre className="error-data">
                  {JSON.stringify(message.error.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {message.result && (
            <div className="message-result">
              <div className="result-item">
                <strong>Prediction:</strong> {message.result.predicted_class}
              </div>
              <div className="result-item">
                <strong>Confidence:</strong> {message.result.confidence}
              </div>
              <div className="result-item">
                <strong>Explanation:</strong> {message.result.explanation}
              </div>
              <div className="result-item">
                <strong>Treatment Plans:</strong> {message.result.treatment_plans}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render error message
  const renderError = () => {
    if (!error) return null

    return (
      <div className="error-message">
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar
        currentChatTitle={currentChatTitle}
        chatStarted={chatStarted}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
      />

      <div className="main-content">
        {chatStarted && (
          <div className="chat-header">
            <h2>{currentChatTitle}</h2>
          </div>
        )}

        <div className="chat-container">
          {renderError()}

          {messages.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-icon">🥔</div>
              <h1>How can I help you today?</h1>
              <p>
                This tool can analyze potato plant images for diseases and answer questions about potato plant care.
                Upload an image or ask a question below.
              </p>

              <div className="feature-cards">
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Disease Classification</h3>
                  <p>Upload images to detect Early Blight, Late Blight, or confirm healthy plants</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💊</div>
                  <h3>Treatment Recommendations</h3>
                  <p>Get personalized treatment plans based on disease diagnosis</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h3>Expert Knowledge</h3>
                  <p>Access information about potato diseases, prevention, and care</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />

              {loading && (
                <div className="message assistant-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="upload-section">
          {activeTab === "image" && (
            <div className="file-upload">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />

              <div className="file-upload-content">
                {file ? (
                  <>
                    <div className="file-name">{file.name}</div>
                    <button className="analyze-button" onClick={handleAnalyzeImage} disabled={loading}>
                      {loading ? "Analyzing..." : "Analyze Image"}
                    </button>
                  </>
                ) : (
                  <button className="upload-button" onClick={handleUploadClick}>
                    <span>📤</span>
                    <span>Upload Image</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab("text")}
            >
              Text
            </button>
            <button
              className={`tab-button ${activeTab === "image" ? "active" : ""}`}
              onClick={() => setActiveTab("image")}
            >
              <span>📷</span>
              <span>Image</span>
            </button>
            <button
              className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <span>📊</span>
              <span>Analytics</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              disabled={loading || activeTab !== "text"}
            />
            <button type="submit" disabled={loading || !input.trim() || activeTab !== "text"} className="send-button">
              ➤
            </button>
          </form>

          <div className="disclaimer">Powered by Next.js, TensorFlow, and OpenAI GPT-4</div>
        </div>
      </div>
    </div>
  )
}