import ImageAnalyzer from "@/components/vision/image-analyzer"

export default function VisionRAGPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Computer Vision + RAG Integration</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analyze images with your computer vision model and get relevant information from your knowledge base
        </p>
      </div>

      <div className="flex justify-center">
        <ImageAnalyzer />
      </div>
    </div>
  )
}

