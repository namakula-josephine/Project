"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useId } from "react" // Use useId instead of random values

export default function DocumentUploader() {
  const [documentName, setDocumentName] = useState("")
  const [documentContent, setDocumentContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const documentId = useId() // Use React's useId hook for stable IDs

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!documentName || !documentContent) {
      setMessage("Please provide both a name and content for the document")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/rag/index-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: {
            id: `doc-${documentId}-${Date.now()}`, // Combine stable ID with timestamp
            content: documentContent,
            metadata: {
              name: documentName,
              timestamp: new Date().toISOString(),
            },
          },
          chunkSize: 500,
          chunkOverlap: 100,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to index document")
      }

      setMessage("Document indexed successfully!")
      setDocumentName("")
      setDocumentContent("")
    } catch (error) {
      console.error("Error:", error)
      setMessage(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Document to RAG System</CardTitle>
        <CardDescription>Add text documents to your knowledge base for retrieval</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentContent">Document Content</Label>
            <Textarea
              id="documentContent"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste document content here"
              className="min-h-[200px]"
              disabled={isLoading}
            />
          </div>
          {message && (
            <div
              className={`p-3 rounded-md ${message.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Index Document"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

