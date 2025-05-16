import { openai } from "@ai-sdk/openai"
import { embed, embedMany } from "ai"
import type { Chunk } from "./types"

export class EmbeddingService {
  /**
   * Generate embeddings for a batch of chunks
   */
  static async generateEmbeddings(chunks: Chunk[]): Promise<Chunk[]> {
    // Extract content from chunks
    const contents = chunks.map((chunk) => chunk.content)

    // Generate embeddings using OpenAI
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: contents,
    })

    // Attach embeddings to chunks
    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }))
  }

  /**
   * Generate embedding for a single query
   */
  static async generateQueryEmbedding(query: string): Promise<number[]> {
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    })

    return embedding
  }
}

