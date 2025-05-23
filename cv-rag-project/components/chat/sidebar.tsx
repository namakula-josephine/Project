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
            chat_id: chat.chat_id || `chat-${index}`,
            title: chat.title || `Chat ${index + 1}`,
            created_at: chat.created_at || new Date().toISOString(),
            message_count: typeof chat.message_count === 'number' ? chat.message_count : 0,
            last_message: chat.last_message
          }))
          setRecentChats(chats)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }

    fetchChatHistory()
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callback()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sessionId')
    router.push('/login')
  }

  return (
    <aside className="sidebar" role="complementary" aria-label="Chat history">
      <div className="sidebar-header" role="banner">
        <div className="sidebar-logo" role="img" aria-label="Potato Assistant Logo">🥔</div>
        <h1>Potato Assistant</h1>
      </div>

      <div className="sidebar-section" role="navigation" aria-label="Recent chats">
        <h2 id="recent-chats-title">Recent Chats</h2>
        <div role="region" aria-labelledby="recent-chats-title">
          {loading ? (
            <div className="chat-item loading" role="status" aria-busy="true">
              <span>Loading chats...</span>
            </div>
          ) : error ? (
            <div className="chat-item error" role="alert" aria-live="polite">
              {error}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="chat-item empty" role="status">No recent chats</div>
          ) : (
            recentChats.map((chat) => (
              <button
                key={chat.chat_id}
                className="chat-item"
                onClick={() => onLoadChat(chat.chat_id)}
                onKeyPress={(e) => handleKeyPress(e, () => onLoadChat(chat.chat_id))}
                aria-label={`Load chat: ${chat.title}`}
              >
                <div className="chat-icon" aria-hidden="true">💬</div>
                <div className="chat-item-content">
                  <div className="chat-item-title">{chat.title}</div>
                  {chat.last_message && (
                    <div className="chat-item-description">{chat.last_message}</div>
                  )}
                </div>
              </button>
            ))
          )}

          {chatStarted && (
            <div className="chat-item active-chat" role="status" aria-label="Current active chat">
              <div className="chat-icon" aria-hidden="true">🟢</div>
              <div className="chat-item-content">
                <div className="chat-item-title">{currentChatTitle}</div>
                <div className="chat-item-description">Current conversation</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        className="new-chat-button" 
        onClick={onNewChat}
        onKeyPress={(e) => handleKeyPress(e, onNewChat)}
        aria-label="Start new chat"
      >
        <span aria-hidden="true">+</span>
        <span>New Chat</span>
      </button>
      <button 
        className="logout-button" 
        onClick={handleLogout}
        onKeyPress={(e) => handleKeyPress(e, handleLogout)}
        aria-label="Log out"
      >
        <span aria-hidden="true">🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  )
}
