import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { APIClient } from "@/lib/api-client";
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      username: string;
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    accessToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          // Create Basic Auth token
          const token = btoa(`${credentials.username}:${credentials.password}`);

          // Try to login
          const response = await APIClient.login({
            username: credentials.username,
            password: credentials.password,
          });

          if (response) {
            // Store the Basic Auth token
            APIClient.setToken(token);

            return {
              id: credentials.username,
              name: credentials.username,
              username: credentials.username,
              accessToken: token,
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken;
        session.user.username = token.username;

        // Set the token in APIClient when session is created/updated
        APIClient.setToken(token.accessToken);
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};