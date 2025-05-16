import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create a Drizzle ORM instance
export const db = drizzle(pool)

// Initialize pgvector extension
export async function initPgVector() {
  try {
    // Create the pgvector extension if it doesn't exist
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector")
    console.log("pgvector extension initialized")
  } catch (error) {
    console.error("Failed to initialize pgvector extension:", error)
    throw error
  }
}

