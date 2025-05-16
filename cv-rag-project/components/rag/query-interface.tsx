"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"

interface Source {
  id: string
  content: string
  documentId: string
  metadata: Record<string, any>
}

interface QueryResponse {
  answer: string
  sources: Source[]
}

export default function QueryInterface() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      setError("Please enter a query")
      return
    }

    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 3,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to query RAG system")
      }

      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Query Your Knowledge Base</CardTitle>
          <CardDescription>Ask questions about your indexed documents</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask a question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {error && <div className="mt-4 p-3 rounded-md bg-red-50 text-red-800">{error}</div>}
          </CardContent>
        </form>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{response.answer}</p>
            </div>

            {response.sources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Sources</h3>
                <div className="space-y-4">
                  {response.sources.map((source) => (
                    <div key={source.id} className="p-3 rounded-md bg-gray-50">
                      <div className="text-sm text-gray-500 mb-1">{source.metadata.name || source.documentId}</div>
                      <div className="text-sm">
                        {source.content.length > 300 ? `${source.content.substring(0, 300)}...` : source.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

