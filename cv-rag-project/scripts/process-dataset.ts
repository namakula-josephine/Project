import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import { FaissVectorStore } from '../lib/rag/faiss-vector-store';

async function processDataset() {
  const datasetPath = path.join(process.cwd(), 'data', 'myrag.txt');
  const faissStore = new FaissVectorStore();

  // Initialize FAISS vector store
  await faissStore.initialize();

  // Read the dataset
  const data = fs.readFileSync(datasetPath, 'utf-8');
  const documents = data.split('\n').filter((line) => line.trim() !== '');

  // Initialize OpenAI API
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const chunks = [];
  const embeddings = [];

  for (const [index, content] of documents.entries()) {
    // Generate embedding for the document
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    const embedding = response.data[0].embedding;

    // Create a chunk object
    chunks.push({
      id: `doc-${index}`,
      content,
      documentId: `doc-${index}`,
      metadata: { source: 'myrag.txt' },
      embedding,
    });

    embeddings.push(embedding);
  }

  // Add chunks to the FAISS vector store
  await faissStore.addChunks(chunks);

  console.log('Dataset processed and added to FAISS vector store.');
}

processDataset().catch((error) => {
  console.error('Error processing dataset:', error);
});

