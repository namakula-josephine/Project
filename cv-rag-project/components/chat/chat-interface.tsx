"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Message, Chat } from "@/types/chat"
import { APIClient } from "@/lib/api-client";
import Sidebar from "./sidebar"
import { ErrorDisplay } from "@/components/ui/error-display"
import { LoadingDots } from "@/components/ui/loading-dots"
import { ErrorBoundary } from "@/components/ui/error-boundary"

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

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ 
  id, 
  isSelected, 
  onSelect, 
  onKeyDown, 
  children,
  ...props 
}) => (
  <button
    {...props}
    role="tab"
    aria-selected={isSelected}
    aria-controls={`${id}-panel`}
    className={`tab-button ${isSelected ? "active" : ""}`}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    id={id}
    tabIndex={isSelected ? 0 : -1}
  >
    {children}
  </button>
);

export default function ChatInterface() {
  // Session state
  const [sessionId, setSessionId] = useState<string>("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [currentChatTitle, setCurrentChatTitle] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session and load chats
  useEffect(() => {
    const loadInitialChats = async () => {
      try {
        const chats = await APIClient.getChatSessions();
        setRecentChats(chats);
        if (chats.length > 0) {
          const firstChat = chats[0];
          setSessionId(firstChat.chat_id);
          setCurrentChatTitle(firstChat.title);
          setChatStarted(true);
          await handleLoadChat(firstChat.chat_id);
        }
      } catch (error) {
        debugError("Initialization", "Failed to load chats:", error);
      }
    };
    
    loadInitialChats();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update chat title based on first message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "user") {
      const firstMessage = messages[0].content;
      const title = firstMessage.length > 25 
        ? firstMessage.substring(0, 25) + "..."
        : firstMessage;
      setCurrentChatTitle(title);
      setChatStarted(true);
    }
  }, [messages]);

  // Load chat history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Start a new chat
  const handleNewChat = async () => {
    try {
      const newChat = await APIClient.createChatSession("New Chat");
      setMessages([]);
      setCurrentChatTitle(newChat.title);
      setChatStarted(true);
      setActiveTab("text");
      setError(null);
      setSessionId(newChat.chat_id);
      
      setRecentChats(prevChats => [newChat, ...prevChats]);
    } catch (error) {
      debugError("NewChat", "Failed to create new chat:", error);
      setError("Failed to create new chat");
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Create new chat if needed
      if (!sessionId) {
        const newChat = await APIClient.createChatSession(input.substring(0, 50));
        setSessionId(newChat.chat_id);
        setCurrentChatTitle(newChat.title);
        setChatStarted(true);
        setRecentChats(prevChats => [newChat, ...prevChats]);
      }

      // Prepare user message
      const userMessage: Message = {
        role: "user",
        content: input,
        timestamp: new Date().toISOString(),
      };

      // Clear input immediately
      setInput("");

      // Add user message to UI
      setMessages(prev => [...prev, userMessage]);

      // Send message and get response
      const response = await APIClient.queryDocument(input, undefined, sessionId);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer || response.content || "I couldn't generate a response.",
        timestamp: new Date().toISOString(),
      };

      // Add AI message to UI
      setMessages(prev => [...prev, assistantMessage]);
      
      // Try to save the messages
      try {
        await APIClient.saveChatMessage(sessionId!, {
          content: userMessage.content,
          role: userMessage.role
        });
        await APIClient.saveChatMessage(sessionId!, {
          content: assistantMessage.content,
          role: assistantMessage.role
        });
      } catch (saveError) {
        debugError("MessageSave", "Failed to save messages:", saveError);
      }    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      const errorStatus = error instanceof Error && 'response' in error
        ? (error as any).response?.status
        : undefined;
      const errorDetail = error instanceof Error && 'response' in error
        ? (error as any).response?.data?.detail
        : undefined;
        
      setError(errorDetail || errorMessage);
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error. Please try again.",
        error: {
          message: errorDetail || errorMessage,
          status: errorStatus,
        },
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image analysis
  const handleAnalyzeImage = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create new chat if needed
      if (!sessionId) {
        const newChat = await APIClient.createChatSession(`Analysis of ${file.name}`);
        setSessionId(newChat.chat_id);
        setCurrentChatTitle(newChat.title);
        setChatStarted(true);
        setRecentChats(prevChats => [newChat, ...prevChats]);
      }

      // Prepare user message
      const userMessage: Message = {
        role: "user",
        content: `I've uploaded an image for analysis: ${file.name}`,
        timestamp: new Date().toISOString(),
      };

      // Add user message to UI
      setMessages(prev => [...prev, userMessage]);

      try {
        // Save the user message
        await APIClient.saveChatMessage(sessionId!, userMessage);

        // Send the image for analysis
        const response = await APIClient.queryDocument("", file, sessionId);

        // Create and save assistant message
        const assistantMessage: Message = {
          role: "assistant",
          content: "Here's my analysis of your potato plant:",
          result: response.result,
          timestamp: new Date().toISOString(),
        };

        // Add AI message to UI
        setMessages(prev => [...prev, assistantMessage]);
        await APIClient.saveChatMessage(sessionId!, assistantMessage);

        // Switch to text tab after analysis
        setActiveTab("text");
      } catch (error) {
        debugError("ImageAnalysis", "Failed to analyze image:", error);
        const errorMessage: Message = {
          role: "assistant",
          content: error instanceof Error ? error.message : "Error processing the image",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);

        // Try to save the error message
        try {
          await APIClient.saveChatMessage(sessionId!, errorMessage);
        } catch (saveError) {
          debugError("ImageAnalysis", "Failed to save error message:", saveError);
        }
      }
    } catch (error: any) {
      debugError("ImageAnalysis", "Failed to create chat or analyze image:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "An error occurred";
      setError(errorMessage);
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error. Please try again.",
        error: {
          message: errorMessage,
          status: error?.response?.status,
        },
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Load a chat history
  const handleLoadChat = async (chatId: string) => {
    debugLog('ChatLoad', `Loading chat: ${chatId}`);
    
    try {
      setLoading(true);
      setError(null);

      // Fetch chat history
      const chatHistory = await APIClient.getChatHistory(chatId);
      debugLog('ChatLoad', 'Loaded chat history:', chatHistory);

      if (chatHistory) {
        setMessages(chatHistory.messages || []);
        setCurrentChatTitle(chatHistory.title || "Untitled Chat");
        setChatStarted(true);
        setSessionId(chatId);
      } else {
        throw new Error(`Chat with ID ${chatId} not found`);
      }    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load chat";
      const errorData = error instanceof Error && 'response' in error 
        ? (error as any).response?.data 
        : undefined;
      const errorStatus = error instanceof Error && 'response' in error
        ? (error as any).response?.status
        : undefined;

      debugError('ChatLoad', 'Failed to load chat:', error);
      setError(errorMessage);
      
      setMessages([{
        role: 'system',
        content: 'Failed to load chat. Details:',
        error: {
          message: errorMessage,
          status: errorStatus,
          data: errorData
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
      }    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load chat history";
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

  // Add keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const tabs = ["text", "image", "analytics"];
    const currentIndex = tabs.indexOf(activeTab);

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
        break;
      case "ArrowRight":
        e.preventDefault();
        setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
        break;
      case "Home":
        e.preventDefault();
        setActiveTab(tabs[0]);
        break;
      case "End":
        e.preventDefault();
        setActiveTab(tabs[tabs.length - 1]);
        break;
    }
  };

  return (
    <ErrorBoundary>
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
            {error && (
              <ErrorDisplay 
                error={{ message: error }} 
                onDismiss={() => setError(null)} 
              />
            )}

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
                      <LoadingDots className="text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="input-section">
            <div 
              className="tabs" 
              role="tablist" 
              aria-orientation="horizontal"
              aria-label="Chat input options"
            >
              <TabButton
                id="text-tab"
                isSelected={activeTab === "text"}
                onSelect={() => setActiveTab("text")}
                onKeyDown={handleTabKeyDown}
              >
                <span>Text</span>
              </TabButton>
              <TabButton
                id="image-tab"
                isSelected={activeTab === "image"}
                onSelect={() => setActiveTab("image")}
                onKeyDown={handleTabKeyDown}
              >
                <span aria-hidden="true">📷</span>
                <span>Image</span>
              </TabButton>
              <TabButton
                id="analytics-tab"
                isSelected={activeTab === "analytics"}
                onSelect={() => setActiveTab("analytics")}
                onKeyDown={handleTabKeyDown}
              >
                <span aria-hidden="true">📊</span>
                <span>Analytics</span>
              </TabButton>
            </div>

            <div 
              role="tabpanel" 
              id="text-panel"
              aria-labelledby="text-tab"
              hidden={activeTab !== "text"}
            >
              <form onSubmit={handleSubmit} className="input-form">
                <div className="input-wrapper">
                  <label htmlFor="chat-input" className="sr-only">Type your message</label>
                  <input
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question here..."
                    disabled={loading || activeTab !== "text"}
                    className="chat-input"
                    aria-label="Chat input"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim() || activeTab !== "text"} 
                    className="send-button"
                    aria-label="Send message"
                  >
                    <span aria-hidden="true">➤</span>
                  </button>
                </div>
              </form>
            </div>

            <div 
              role="tabpanel" 
              id="image-panel"
              aria-labelledby="image-tab"
              hidden={activeTab !== "image"}
            >
              <div className="file-upload">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload image file"
                  title="Upload image file"
                />

                <div className="file-upload-content">
                  {file ? (
                    <>
                      <div className="file-name">{file.name}</div>
                      <button 
                        className="analyze-button" 
                        onClick={handleAnalyzeImage} 
                        disabled={loading}
                        aria-label={loading ? "Analyzing image..." : "Analyze image"}
                      >
                        {loading ? (
                          <span className="loading-indicator" role="status">
                            <span className="loading-dot" aria-hidden="true"></span>
                            <span className="loading-dot" aria-hidden="true"></span>
                            <span className="loading-dot" aria-hidden="true"></span>
                            <span className="sr-only">Analyzing image...</span>
                          </span>
                        ) : (
                          "Analyze Image"
                        )}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="upload-button" 
                      onClick={handleUploadClick}
                      aria-label="Choose file to upload"
                    >
                      <span aria-hidden="true">📤</span>
                      <span>Upload Image</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div 
              role="tabpanel" 
              id="analytics-panel"
              aria-labelledby="analytics-tab"
              hidden={activeTab !== "analytics"}
            >
              {/* Analytics content */}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}