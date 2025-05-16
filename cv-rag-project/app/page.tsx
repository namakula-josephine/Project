import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if logged in, otherwise to login page
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }

  // This will never be rendered
  return null
}

