import axios from 'axios';

const BASE_URL = 'https://fusion-project.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  validateStatus: (status) => status < 500,
});

// Safe localStorage access
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const removeLocalStorageItem = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

api.interceptors.request.use((config) => {
  const authToken = getLocalStorageItem('potato_assistant_token');
  
  if (authToken) {
    config.headers['Authorization'] = `Basic ${authToken}`;
  }
  
  return config;
});

export class APIClient {
  private static token: string | null = null;

  private static isClient() {
    return typeof window !== 'undefined';
  }

  static setToken(token: string) {
    this.token = token;
    setLocalStorageItem('potato_assistant_token', token);
  }

  static clearToken() {
    this.token = null;
    removeLocalStorageItem('potato_assistant_token');
  }
  
  static getToken() {
    if (!this.token) {
      this.token = getLocalStorageItem('potato_assistant_token');
    }
    return this.token;
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Basic ${token}` } : {};
  }

  static register = async (username: string, email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('email', email);
    params.append('password', password);
    
    const response = await api.post('/api/register', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const token = btoa(`${username}:${password}`);
    this.setToken(token);
    
    return response.data;
  };

  static login = async (credentials: { username: string; password: string }) => {
    const token = btoa(`${credentials.username}:${credentials.password}`);
    
    try {
      const response = await api.post('/api/login', null, {
        headers: {
          'Authorization': `Basic ${token}`
        }
      });
      
      this.setToken(token);
      return response.data;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  static async logout() {
    this.clearToken();
    return { success: true, message: 'Successfully logged out' };
  }

  static async getCurrentUser() {
    const response = await api.get('/api/me');
    return response.data;
  }

  static async getChatHistory(chatId: string) {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  }

  static async queryDocument(question: string, image?: File, chatId?: string) {
    const formData = new FormData();
    if (question) formData.append('question', question);
    if (image) formData.append('image', image);
    if (chatId) formData.append('chat_id', chatId);

    const response = await api.post('/api/query', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }  static async saveChatMessage(chatId: string, message: { 
    content: string; 
    role: string; 
    result?: {
      predicted_class?: string;
      confidence?: string;
      explanation?: string;
      treatment_plans?: string;
    };
  }) {
    if (message.role === 'user') {
      // For user messages, use queryDocument to get AI response
      return this.queryDocument(message.content, undefined, chatId);
    } else {
      // For assistant messages, save with full data including any result fields
      const response = await api.post(`/api/chats/${chatId}/messages`, {
        content: message.content,
        role: message.role,
        result: message.result
      });
      return response.data;
    }
  }

  static async createChatSession(title: string) {
    const response = await api.post('/api/chats/', { title });
    return response.data;
  }

  static async getChatSessions() {
    const response = await api.get('/api/chats/');
    return response.data;
  }

  static async updateChatSession(chatId: string, title: string) {
    const response = await api.put(`/api/chats/${chatId}`, { title });
    return response.data;
  }

  static async deleteChatSession(chatId: string) {
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  }
}