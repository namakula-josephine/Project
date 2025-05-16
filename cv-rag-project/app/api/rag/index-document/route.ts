import { NextRequest, NextResponse } from 'next/server';
import { RAGService } from '@/lib/rag/rag-service';
import type { Document } from '@/lib/rag/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, chunkSize, chunkOverlap } = body;

    if (!document || !document.id || !document.content) {
      return NextResponse.json({ error: 'Invalid document format' }, { status: 400 });
    }

    // Use local processing for the RAG service
    const ragService = new RAGService();
    await ragService.initialize();
    await ragService.indexDocument(document as Document, chunkSize, chunkOverlap);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error indexing document:', error);
    return NextResponse.json({ error: 'Failed to index document' }, { status: 500 });
  }
}