"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Chat } from "@/types/chat"
import { APIClient } from "@/lib/api-client"

interface SidebarProps {
  currentChatTitle: string
  chatStarted: boolean
  onNewChat: () => void
  onLoadChat: (chatId: string) => void
}

export default function Sidebar({ currentChatTitle, chatStarted, onNewChat, onLoadChat }: SidebarProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true)
        // Generate a session ID if it doesn't exist
        const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
        localStorage.setItem('sessionId', sessionId)

        const response = await APIClient.getChatHistory(sessionId)
        
        if (response.messages && Array.isArray(response.messages)) {
          // Transform the messages into chat format
          const chats = response.messages.map((chat: any, index: number) => ({
            id: chat.id || `chat-${index}`,
            title: chat.title || `Chat ${index + 1}`,
            description: chat.messages?.[0]?.message || 'No messages',
            messages: chat.messages || []
          }));
          setRecentChats(chats)
        } else {
          setRecentChats([])
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err)
        setError('Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }

    fetchChatHistory()
  }, [])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🥔</div>
        <h1>Potato Assistant</h1>
      </div>

      <div className="sidebar-section">
        <h2>Recent Chats</h2>
        {loading ? (
          <div className="chat-item loading">Loading chats...</div>
        ) : error ? (
          <div className="chat-item error">{error}</div>
        ) : recentChats.length === 0 ? (
          <div className="chat-item empty">No recent chats</div>
        ) : (
          recentChats.map((chat) => (
            <div key={chat.id} className="chat-item" onClick={() => onLoadChat(chat.id)}>
              <div className="chat-icon">💬</div>
              <div className="chat-item-content">
                <div className="chat-item-title">{chat.title}</div>
                <div className="chat-item-description">{chat.description}</div>
              </div>
            </div>
          ))
        )}

        {chatStarted && (
          <div className="chat-item active-chat">
            <div className="chat-icon">🟢</div>
            <div className="chat-item-content">
              <div className="chat-item-title">{currentChatTitle}</div>
              <div className="chat-item-description">Current conversation</div>
            </div>
          </div>
        )}
      </div>

      <button className="new-chat-button" onClick={onNewChat}>
        <span>+</span>
        <span>New Chat</span>
      </button>
      <button className="logout-button" onClick={handleLogout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  )
}
