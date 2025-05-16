import DocumentUploader from "@/components/rag/document-uploader"
import QueryInterface from "@/components/rag/query-interface"

export default function RAGDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">RAG System Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload documents to your knowledge base and query them using natural language
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex justify-center">
          <DocumentUploader />
        </div>
        <div className="flex justify-center">
          <QueryInterface />
        </div>
      </div>
    </div>
  )
}

