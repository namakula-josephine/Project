import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string
      /** The user's username */
      username: string
      /** The user's access token */
      accessToken: string
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    accessToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string
    accessToken: string
  }
}