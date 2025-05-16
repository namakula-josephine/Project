import { VisionService } from '../vision/vision-service';
import { FaissVectorStore } from '../rag/faiss-vector-store';
import { OpenAI } from 'openai';

export class MultiModelPipeline {
  private visionService = new VisionService();
  private faissStore = new FaissVectorStore();
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async initialize(): Promise<void> {
    await this.visionService.initialize();
    await this.faissStore.initialize();
  }

  async processImage(imageBuffer: Buffer): Promise<any> {
    const { predictedClass, confidence } = await this.visionService.predict(imageBuffer);

    const query = `${predictedClass} treatment potato plant`;
    const documents = await this.faissStore.search(await this.embedText(query));

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for potato plant diseases.' },
        { role: 'user', content: `Based on these documents: ${JSON.stringify(documents)}, provide treatment for ${predictedClass}.` },
      ],
    });

    return {
      predictedClass,
      confidence,
      documents,
      treatment: response.choices[0].message.content,
    };
  }

  private async embedText(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({ model: 'text-embedding-ada-002', input: text });
    return response.data[0].embedding;
  }
}