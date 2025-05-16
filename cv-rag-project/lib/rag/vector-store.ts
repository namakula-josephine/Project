import type { Chunk, SearchResult } from "./types"
import { cosineSimilarity } from "ai"

/**
 * In-memory vector store for development
 * In production, you would use a proper vector database like Pinecone, Supabase, or Neon with pgvector
 */
export class VectorStore {
  private chunks: Chunk[] = []

  /**
   * Add chunks to the vector store
   */
  async addChunks(chunks: Chunk[]): Promise<void> {
    // Ensure all chunks have embeddings
    if (chunks.some((chunk) => !chunk.embedding)) {
      throw new Error("All chunks must have embeddings")
    }

    this.chunks.push(...chunks)
  }

  /**
   * Search for similar chunks using cosine similarity
   */
  async search(queryEmbedding: number[], limit = 5): Promise<SearchResult[]> {
    // Calculate similarity scores
    const results = this.chunks
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return results
  }

  /**
   * Get all chunks for a document
   */
  async getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
    return this.chunks.filter((chunk) => chunk.documentId === documentId)
  }

  /**
   * Clear all chunks
   */
  async clear(): Promise<void> {
    this.chunks = []
  }
}

