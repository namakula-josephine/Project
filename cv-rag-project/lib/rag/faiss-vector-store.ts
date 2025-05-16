import { IndexFlatL2 } from 'faiss-node';
import fs from 'fs';
import path from 'path';
import type { SearchResult } from './types';

export interface Chunk {
  id: string;
  content: string;
  documentId: string;
  metadata: Record<string, any>;
  embedding?: number[];
  faissId?: number;
}

export class FaissVectorStore {
  private index: IndexFlatL2 | null = null;
  private chunks: Chunk[] = [];
  private dimension: number;
  private indexPath: string;
  private chunksPath: string;

  constructor(dimension: number = 1536) {
    this.dimension = dimension;
    this.indexPath = path.join(process.cwd(), 'data', 'faiss', 'index.faiss');
    this.chunksPath = path.join(process.cwd(), 'data', 'faiss', 'chunks.json');

    const dir = path.join(process.cwd(), 'data', 'faiss');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    try {
      if (fs.existsSync(this.indexPath) && fs.existsSync(this.chunksPath)) {
        this.index = IndexFlatL2.read(this.indexPath);
        this.chunks = JSON.parse(fs.readFileSync(this.chunksPath, 'utf-8'));
        console.log(`Loaded FAISS index with ${this.index.ntotal()} vectors`);
      } else {
        this.index = new IndexFlatL2(this.dimension);
        console.log('Created new FAISS index');
      }
    } catch (error) {
      console.error('Error initializing FAISS vector store:', error);
      this.index = new IndexFlatL2(this.dimension);
      this.chunks = [];
      console.log('Created new FAISS index after error');
    }
  }

  async addChunks(chunks: Chunk[]): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    if (chunks.some((chunk) => !chunk.embedding)) {
      throw new Error('All chunks must have embeddings');
    }

    const totalLength = chunks.length * this.dimension;
    const vectors = new Float32Array(totalLength);

    chunks.forEach((chunk, chunkIndex) => {
      const embedding = chunk.embedding!;
      const offset = chunkIndex * this.dimension;
      for (let i = 0; i < this.dimension; i++) {
        vectors[offset + i] = embedding[i];
      }
    });

    const currentTotal = this.index!.ntotal();
    this.index!.add(Array.from(vectors));

    const chunksToStore = chunks.map((chunk, index) => ({
      ...chunk,
      faissId: currentTotal + index,
      embedding: undefined,
    }));

    this.chunks.push(...chunksToStore);
    await this.saveIndex();
  }

  async search(queryEmbedding: number[], limit = 5): Promise<SearchResult[]> {
    if (!this.index) {
      await this.initialize();
    }

    if (this.index!.ntotal() === 0) {
      return [];
    }

    const queryVector = new Float32Array(queryEmbedding);
    const { distances, labels } = this.index!.search(Array.from(queryVector), limit);

    const results: SearchResult[] = [];
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const chunk = this.chunks.find((c) => c.faissId === label);

      if (chunk) {
        results.push({
          chunk: {
            id: chunk.id,
            content: chunk.content,
            documentId: chunk.documentId,
            metadata: chunk.metadata,
          },
          score: 1 - distances[i],
        });
      }
    }

    return results;
  }

  async getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
    if (!this.index) {
      await this.initialize();
    }

    return this.chunks
      .filter((chunk) => chunk.documentId === documentId)
      .map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.documentId,
        metadata: chunk.metadata,
      }));
  }

  private async saveIndex(): Promise<void> {
    if (!this.index) return;

    try {
      this.index.write(this.indexPath);
      fs.writeFileSync(this.chunksPath, JSON.stringify(this.chunks, null, 2));
      console.log(`Saved FAISS index with ${this.index.ntotal()} vectors`);
    } catch (error) {
      console.error('Error saving FAISS index:', error);
      throw error;
    }
  }
}