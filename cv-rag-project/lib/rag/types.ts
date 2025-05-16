export interface Document {
  id: string
  content: string
  metadata: Record<string, any>
}

export interface Chunk {
  id: string
  content: string
  embedding?: number[]
  documentId: string
  metadata: Record<string, any>
  faissId?: number
}

export interface SearchResult {
  chunk: Chunk
  score: number
}

export interface RAGResponse {
  answer: string
  sources: Chunk[]
}