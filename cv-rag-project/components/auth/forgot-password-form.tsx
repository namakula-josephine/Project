"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // In a real app, you would make an API call to send a password reset email
      // For this demo, we'll simulate a successful request
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An error occurred while sending the reset link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🥔</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">We'll send you a link to reset your password</p>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <p>{error}</p>
            </div>
          </div>
        )}

        {success ? (
          <div
            className="success-message"
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p>Password reset link sent! Check your email.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{" "}
          <Link href="/login" className="auth-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

