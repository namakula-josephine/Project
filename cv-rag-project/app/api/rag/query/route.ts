import { NextRequest, NextResponse } from 'next/server';
import { RAGService } from '@/lib/rag/rag-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use local processing for the RAG service
    const ragService = new RAGService();
    await ragService.initialize();
    const response = await ragService.query(query, limit);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error querying RAG:', error);
    return NextResponse.json({ error: 'Failed to query RAG system' }, { status: 500 });
  }
}