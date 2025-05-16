"use client"

// This is a simplified version - you might want to install the full toast component from shadcn/ui
import { useState } from "react"

export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; title: string; description?: string }[]>([])

  const toast = ({ title, description }: { title: string; description?: string }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  return { toast, toasts }
}

