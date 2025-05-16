import { NextRequest, NextResponse } from 'next/server';
import { MultiModelPipeline } from '@/lib/pipeline/multi-model-pipeline';

const pipeline = new MultiModelPipeline();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const result = await pipeline.processImage(imageBuffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}