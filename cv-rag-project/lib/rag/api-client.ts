import type { Document, RAGResponse } from './types';

export class RAGApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.apiKey = process.env.API_KEY || '';
  }

  /**
   * Query the RAG API
   */
  async query(query: string, limit = 3): Promise<RAGResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          limit,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to query RAG API');
      }

      return await response.json();
    } catch (error) {
      console.error('Error querying RAG API:', error);
      
      // Provide a fallback response if the API call fails
      return {
        answer: 'I apologize, but I encountered an issue connecting to the knowledge base. Please try again later.',
        sources: [],
      };
    }
  }

  /**
   * Index a document via the API
   */
  async indexDocument(document: Document, chunkSize = 500, chunkOverlap = 100): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/index-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          document,
          chunkSize,
          chunkOverlap,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index document');
      }
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  }

  /**
   * Analyze an image via the API
   */
  async analyzeImage(imageFile: File, query?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (query) {
        formData.append('query', query);
      }

      const response = await fetch(`${this.baseUrl}/api/vision/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}