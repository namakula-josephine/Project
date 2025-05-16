// API Service for handling requests to the backend
export const apiService = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  
    // Method to handle text queries
    async sendTextQuery(question: string, sessionId: string) {
      try {
        const formData = new FormData()
        formData.append("question", question)
        formData.append("session_id", sessionId)
  
        const response = await fetch(`${this.baseUrl}/query`, {
          method: "POST",
          body: formData,
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error: ${response.status} - ${errorText}`)
        }
  
        return await response.json()
      } catch (error) {
        console.error("API Error:", error)
        throw error
      }
    },
  
    // Method to handle image uploads and analysis
    async analyzeImage(imageFile: File, sessionId: string) {
      try {
        const formData = new FormData()
        formData.append("image", imageFile)
        formData.append("session_id", sessionId)
  
        const response = await fetch(`${this.baseUrl}/query`, {
          method: "POST",
          body: formData,
        })
  
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error: ${response.status} - ${errorText}`)
        }
  
        return await response.json()
      } catch (error) {
        console.error("API Error:", error)
        throw error
      }
    },
  }
  
  