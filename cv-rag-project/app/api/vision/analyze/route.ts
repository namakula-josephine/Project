import { NextRequest, NextResponse } from 'next/server';
import { VisionService } from '@/lib/vision/vision-service';
import { RAGService } from '@/lib/rag/rag-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const question = formData.get('question') as string | null;
    const sessionId = formData.get('session_id') as string;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (imageFile) {
      const result = await VisionService.analyzeImage(imageFile, sessionId);
      return NextResponse.json(result);
    } else if (question) {
      const ragService = new RAGService();
      await ragService.initialize();
      const response = await ragService.query(question);
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'No valid input provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}