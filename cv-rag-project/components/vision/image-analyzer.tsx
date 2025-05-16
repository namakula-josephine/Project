"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import type { VisionAnalysisResult } from "@/lib/vision/types"

export default function ImageAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userQuery, setUserQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null)
  const [ragResponse, setRagResponse] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedImage) {
      setError("Please select an image")
      return
    }

    setIsLoading(true)
    setError("")
    setAnalysisResult(null)
    setRagResponse(null)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)
      if (userQuery) {
        formData.append("query", userQuery)
      }

      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze image")
      }

      const data = await response.json()
      setAnalysisResult(data.analysisResult)
      setRagResponse(data.ragResponse.answer)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Computer Vision + RAG Analysis</CardTitle>
          <CardDescription>
            Upload an image to analyze with your computer vision model and query your knowledge base
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
                <Input
                  ref={fileInputRef}
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {selectedImage && <span className="text-sm text-gray-500">{selectedImage.name}</span>}
              </div>

              {imagePreview && (
                <div className="mt-4 relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">Optional Query</Label>
              <Input
                id="query"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask a specific question about the image (optional)"
                disabled={isLoading}
              />
            </div>

            {error && <div className="p-3 rounded-md bg-red-50 text-red-800">{error}</div>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !selectedImage} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Analyze Image
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {(analysisResult || ragResponse) && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {analysisResult && (
              <div>
                <h3 className="text-lg font-medium mb-2">Computer Vision Analysis</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Description:</span> {analysisResult.description}
                  </div>
                  <div>
                    <span className="font-medium">Labels:</span> {analysisResult.labels.join(", ")}
                  </div>
                  <div>
                    <span className="font-medium">Objects:</span>
                    <ul className="list-disc pl-5 mt-1">
                      {analysisResult.objects.map((obj, index) => (
                        <li key={index}>
                          {obj.name} (Confidence: {(obj.confidence * 100).toFixed(1)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {ragResponse && (
              <div>
                <h3 className="text-lg font-medium mb-2">Knowledge Base Response</h3>
                <div className="p-4 rounded-md bg-gray-50">
                  <p className="whitespace-pre-line">{ragResponse}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

