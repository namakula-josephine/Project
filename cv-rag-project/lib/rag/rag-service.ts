import { openai } from "@ai-sdk/openai"
import { generateText, embed, embedMany } from "ai"
import type { Document, Chunk, SearchResult, RAGResponse } from "./types"
import { SimpleVectorStore } from "./simple-vector-store"

export class RAGService {
  private vectorStore: SimpleVectorStore
  private isInitialized = false

  constructor() {
    this.vectorStore = new SimpleVectorStore()
  }

  /**
   * Initialize the RAG service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize vector store
      await this.vectorStore.initialize()

      // Load documents from the dataset directory
      const documents = await this.loadDocumentsFromDataset()

      // Only index documents if the vector store is empty
      if (this.vectorStore.isEmpty) {
        console.log("Initializing RAG service with sample documents...")

        // Process and index all documents
        for (const document of documents) {
          await this.indexDocument(document)
        }
      }

      this.isInitialized = true
      console.log("RAG service initialized")
    } catch (error) {
      console.error("Failed to initialize RAG service:", error)
      throw error
    }
  }

  /**
   * Load documents from the dataset directory
   */
  private async loadDocumentsFromDataset(): Promise<Document[]> {
    // This is a placeholder - in a real app, you would read from your dataset files
    // For example, reading text files from the /data/potato-diseases directory

    // Simulated documents for demonstration
    return [
      {
        id: "early-blight-doc",
        content: `Early blight is a common fungal disease that affects potato plants. 
        It is caused by the fungus Alternaria solani and typically appears as dark brown to black lesions with concentric rings, 
        giving them a "target-spot" appearance. The disease often starts on the lower, older leaves and progresses upward. 
        Severe infections can lead to significant defoliation and reduced yields.
        
        Treatment options for early blight include:
        1. Fungicide applications with products containing chlorothalonil, mancozeb, or copper-based compounds
        2. Crop rotation with non-solanaceous crops for at least 2 years
        3. Removal and destruction of infected plant debris
        4. Improving air circulation by proper plant spacing
        5. Avoiding overhead irrigation to keep foliage dry`,
        metadata: {
          source: "potato-disease-handbook",
          category: "diseases",
          disease: "early-blight",
        },
      },
      {
        id: "late-blight-doc",
        content: `Late blight is a devastating disease of potato plants caused by the oomycete Phytophthora infestans. 
        It is infamous for causing the Irish Potato Famine in the 1840s. The disease appears as dark, water-soaked lesions 
        on leaves, stems, and tubers. Under humid conditions, white fuzzy growth (sporangia) may be visible on the underside 
        of infected leaves. The disease can spread rapidly and destroy entire fields within days under favorable conditions.
        
        Treatment options for late blight include:
        1. Preventative fungicide applications with products containing mefenoxam, chlorothalonil, or copper-based compounds
        2. Planting resistant varieties when available
        3. Destroying volunteer potato plants and nightshade weeds
        4. Proper hilling of soil around plants to protect tubers
        5. Harvesting tubers during dry weather and ensuring they are dry before storage`,
        metadata: {
          source: "potato-disease-handbook",
          category: "diseases",
          disease: "late-blight",
        },
      },
      {
        id: "healthy-potato-doc",
        content: `Healthy potato plants have vibrant green leaves arranged alternately on stems. The leaves are compound 
        with several leaflets and a terminal leaflet at the end. The plant produces white, pink, or purple flowers depending 
        on the variety. Underground, the plant develops tubers (the potatoes) attached to the stem by stolons.
        
        To maintain healthy potato plants:
        1. Plant certified disease-free seed potatoes
        2. Provide consistent moisture, about 1-2 inches of water per week
        3. Fertilize with a balanced fertilizer, slightly higher in phosphorus and potassium than nitrogen
        4. Hill soil around plants as they grow to protect developing tubers from sunlight
        5. Monitor regularly for signs of pests or diseases
        6. Practice crop rotation, avoiding planting potatoes or other solanaceous crops in the same area for 3-4 years`,
        metadata: {
          source: "potato-growing-guide",
          category: "care",
          condition: "healthy",
        },
      },
    ]
  }

  /**
   * Process and index a document
   */
  async indexDocument(document: Document, chunkSize = 500, chunkOverlap = 100): Promise<void> {
    try {
      // Split document into chunks
      const chunks = this.chunkDocument(document, chunkSize, chunkOverlap)

      // Generate embeddings for chunks
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks)

      // Store chunks in vector database
      await this.vectorStore.addChunks(chunksWithEmbeddings)

      console.log(`Indexed document ${document.id} with ${chunks.length} chunks`)
    } catch (error) {
      console.error(`Error indexing document ${document.id}:`, error)
      throw error
    }
  }

  /**
   * Split a document into chunks
   */
  private chunkDocument(document: Document, chunkSize: number, chunkOverlap: number): Chunk[] {
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

  /**
   * Generate embeddings for chunks
   */
  private async generateEmbeddings(chunks: Chunk[]): Promise<Chunk[]> {
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
   * Query the RAG system
   */
  async query(query: string, limit = 3): Promise<RAGResponse> {
    try {
      // Ensure the RAG service is initialized
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Generate embedding for query
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: query,
      })

      // Search for relevant chunks
      const searchResults = await this.vectorStore.search(embedding, limit)

      // Generate response using retrieved context
      const answer = await this.generateResponse(query, searchResults)

      return {
        answer,
        sources: searchResults.map((result) => result.chunk),
      }
    } catch (error) {
      console.error("Error querying RAG:", error)

      // Provide a fallback response if processing fails
      return {
        answer: "I apologize, but I encountered an issue processing your query. Please try again later.",
        sources: [],
      }
    }
  }

  /**
   * Generate a response using the retrieved context
   */
  private async generateResponse(query: string, searchResults: SearchResult[]): Promise<string> {
    // Extract content from search results
    const context = searchResults.map((result) => result.chunk.content).join("\n\n")

    // Generate response using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Answer the following question about potato plants based on the provided context. If the context doesn't contain relevant information, say so.
      
Context:
${context}

Question: ${query}

Answer:`,
    })

    return text
  }
}

