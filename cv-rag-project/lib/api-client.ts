import axios, { AxiosError } from 'axios';
import type { Chat, Message } from '@/types/chat';

const API_BASE_URL = 'http://localhost:8000';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
}

export class APIClient {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  static clearToken() {
    this.token = null;
    delete axios.defaults.headers.common['Authorization'];
  }

  static getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  static async register(data: RegisterData) {
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('password', data.password);
      formData.append('email', data.email);

      const response = await axios.post(`${API_BASE_URL}/register`, formData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Registration failed');
      }
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async login(credentials: LoginCredentials) {
    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await axios.post(`${API_BASE_URL}/login`, formData);
      
      // Store the session ID as the token
      if (response.data.session_id) {
        this.setToken(response.data.session_id);
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      if (!this.token) {
        return;
      }

      const formData = new FormData();
      formData.append('session_id', this.token);

      await axios.post(`${API_BASE_URL}/logout`, formData);
      this.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token even if logout fails
      this.clearToken();
      throw error;
    }
  }

  static async getChatHistory(sessionId: string) {
    try {
      console.log('[APIClient] Getting chat history with token:', this.token);
      const response = await axios.get(`${API_BASE_URL}/chat-history`, {
        params: { session_id: sessionId },
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        console.error('Authentication token expired or invalid');
        throw new Error('Please log in again');
      }
      console.error('Error fetching chat history:', error);
      return { messages: [] };
    }
  }

  static async queryDocument(data: FormData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/query`, data, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('Please log in to use this feature');
        }
        throw new Error(error.response?.data?.detail || 'Error querying document');
      }
      console.error('Error querying document:', error);
      throw error;
    }
  }

  static async saveChatMessage(sessionId: string, message: Message) {
    try {
      // Convert message to FormData as backend expects Form data
      const formData = new FormData();
      formData.append('message', message.content);

      const response = await axios.post(
        `${API_BASE_URL}/${sessionId}/messages`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            // Content-Type will be set automatically for FormData
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('Please log in again to continue chatting');
        }
        if (error.response?.status === 404) {
          throw new Error('Chat session not found');
        }
        throw new Error(error.response?.data?.detail || 'Failed to save message');
      }
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  static async createChatSession(title: string, sessionId: string) {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('session_id', sessionId);

      const response = await axios.post(
        `${API_BASE_URL}/chat-sessions`,
        formData,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw new Error('Please log in to create a chat session');
      }
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  static async getChatSessions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat-sessions`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw new Error('Please log in to view chat sessions');
      }
      console.error('Error fetching chat sessions:', error);
      return { sessions: [] };
    }
  }

  static async clearChatHistory(sessionId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/chat-history`, {
        params: { session_id: sessionId },
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return { success: false };
    }
  }
}