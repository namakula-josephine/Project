export interface VisionAnalysisResult {
    labels: string[]
    objects: {
      name: string
      confidence: number
      boundingBox?: {
        x: number
        y: number
        width: number
        height: number
      }
    }[]
    description: string
  }
  
  export interface VisionQueryResult {
    analysisResult: VisionAnalysisResult
    ragResponse: {
      answer: string
      sources: any[]
    }
  }
  
  