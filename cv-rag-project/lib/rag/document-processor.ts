import type { Document, Chunk } from "./types"

export class DocumentProcessor {
  /**
   * Split a document into chunks for embedding
   */
  static chunkDocument(document: Document, chunkSize = 500, chunkOverlap = 100): Chunk[] {
    const content = document.content
    const chunks: Chunk[] = []

    // Simple chunking by character count
    // In a production system, you might want to chunk by sentences or paragraphs
    for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
      const chunkContent = content.slice(i, i + chunkSize)

      // Skip empty chunks
      if (!chunkContent.trim()) continue

      chunks.push({
        id: `${document.id}-chunk-${i}`,
        content: chunkContent,
        documentId: document.id,
        metadata: {
          ...document.metadata,
          start: i,
          end: Math.min(i + chunkSize, content.length),
        },
      })
    }

    return chunks
  }
}

