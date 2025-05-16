import { db } from '../db'
import { chunks, documents } from "./schema"
import { eq, sql } from 'drizzle-orm'
import type { Chunk, SearchResult } from "./types"

export class PgVectorStore {
  /**
   * Add a document and its chunks to the database
   */
  async addDocument(
    document: { id: string; content: string; metadata: Record<string, any> },
    chunksToAdd: Chunk[],
  ): Promise<void> {
    // Insert document
    const [insertedDoc] = await db
      .insert(documents)
      .values({
        externalId: document.id,
        content: document.content,
        metadata: document.metadata,
      })
      .returning()

    // Insert chunks with embeddings
    for (const chunk of chunksToAdd) {
      if (!chunk.embedding) {
        throw new Error("Chunk must have embedding")
      }

      await db.insert(chunks).values({
        documentId: insertedDoc.id,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      })
    }
  }

  /**
   * Search for similar chunks using vector similarity
   */
  async search(queryEmbedding: number[], limit = 5): Promise<SearchResult[]> {
    // Convert embedding to PostgreSQL vector format
    const embeddingString = `[${queryEmbedding.join(",")}]`

    // Query using cosine similarity
    const results = await db.execute(sql`
      SELECT 
        c.id, 
        c.content, 
        c.metadata,
        d.external_id as document_id,
        1 - (c.embedding <=> ${embeddingString}::vector) as similarity
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `)

    return (results.rows || results).map((row: any) => ({
      chunk: {
        id: row.id.toString(),
        content: row.content,
        documentId: row.document_id,
        metadata: row.metadata,
      },
      score: row.similarity,
    }))
  }

  /**
   * Get all chunks for a document
   */
  async getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
    const doc = await db.select().from(documents).where(eq(documents.externalId, documentId)).limit(1)

    if (doc.length === 0) {
      return []
    }

    const result = await db.select().from(chunks).where(eq(chunks.documentId, doc[0].id))

    return result.map((row) => ({
      id: row.id.toString(),
      content: row.content,
      documentId: documentId,
      metadata: row.metadata as Record<string, any>,
    }))
  }
}

