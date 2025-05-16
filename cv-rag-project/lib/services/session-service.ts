import { v4 as uuidv4 } from "uuid"
import type { Chat } from "@/types/chat"

// Session Service for managing user sessions and chat history
export const sessionService = {
  storageKey: "potato_assistant_session",
  chatsKey: "potato_assistant_recent_chats",

  // Get the current session ID or create a new one
  getSessionId() {
    if (typeof window === "undefined") {
      return uuidv4() // For server-side rendering
    }

    const storedSession = localStorage.getItem(this.storageKey)

    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession)
        return sessionData.id
      } catch (e) {
        console.error("Error parsing session data:", e)
      }
    }

    // Create a new session if none exists
    return this.createNewSession()
  },

  // Create a new session
  createNewSession() {
    if (typeof window === "undefined") {
      return uuidv4() // For server-side rendering
    }

    const sessionId = uuidv4()

    const sessionData = {
      id: sessionId,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(this.storageKey, JSON.stringify(sessionData))
    return sessionId
  },

  // Store recent chats in local storage
  saveRecentChats(chats: Chat[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.chatsKey, JSON.stringify(chats))
  },

  // Get recent chats from local storage
  getRecentChats(): Chat[] {
    if (typeof window === "undefined") {
      return [] // For server-side rendering
    }

    const storedChats = localStorage.getItem(this.chatsKey)

    if (storedChats) {
      try {
        return JSON.parse(storedChats)
      } catch (e) {
        console.error("Error parsing recent chats:", e)
        return []
      }
    }

    return []
  },
}

