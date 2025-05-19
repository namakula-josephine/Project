import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Potato Assistant",
  description: "AI-powered potato plant disease detection and treatment assistant",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="__className_d65c78" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

