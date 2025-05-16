// Helper for pgvector type
export function pgVectorType(name: string, config: { dimensions: number }) {
    return `vector(${config.dimensions})` as any
  }
  
  