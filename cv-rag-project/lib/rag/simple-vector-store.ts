import type { Chunk, SearchResult } from "./types"
import { cosineSimilarity } from "ai"
import fs from "fs"
import path from "path"

export class SimpleVectorStore {
  private chunks: Chunk[] = []
  private storePath: string

  constructor() {
    this.storePath = path.join(process.cwd(), "data", "vector-store", "chunks.json")

    // Create directory if it doesn't exist
    const dir = path.join(process.cwd(), "data", "vector-store")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    try {
      if (fs.existsSync(this.storePath)) {
        // Load existing chunks
        const data = fs.readFileSync(this.storePath, "utf-8")
        this.chunks = JSON.parse(data)
        console.log(`Loaded vector store with ${this.chunks.length} chunks`)
      } else {
        console.log("Created new vector store")
      }
    } catch (error) {
      console.error("Error initializing vector store:", error)
      this.chunks = []
      console.log("Created new vector store after error")
    }
  }

  /**
   * Add chunks to the vector store
   */
  async addChunks(chunks: Chunk[]): Promise<void> {
    // Ensure all chunks have embeddings
    if (chunks.some((chunk) => !chunk.embedding)) {
      throw new Error("All chunks must have embeddings")
    }

    // Add chunks to store
    this.chunks.push(...chunks)

    // Save to disk
    await this.saveStore()

    console.log(`Added ${chunks.length} chunks to vector store`)
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
   * Save the store to disk
   */
  private async saveStore(): Promise<void> {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.chunks, null, 2))
      console.log(`Saved vector store with ${this.chunks.length} chunks`)
    } catch (error) {
      console.error("Error saving vector store:", error)
      throw error
    }
  }

  // Add this getter to the SimpleVectorStore class
  get isEmpty(): boolean {
    return this.chunks.length === 0
  }
}

