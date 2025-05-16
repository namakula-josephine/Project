import { pgTable, serial, text, varchar, jsonb } from "drizzle-orm/pg-core"
import { pgVectorType } from "./pg-vector-store"

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: varchar("created_at", { length: 255 }).notNull().default(new Date().toISOString()),
})

// Chunks table with vector embeddings
export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: pgVectorType("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: varchar("created_at", { length: 255 }).notNull().default(new Date().toISOString()),
})

// Helper for pgvector type
// export function pgVectorType(name: string, config: { dimensions: number }) {
//   return `vector(${config.dimensions})` as any;
// }

