import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define the MemoryCard table matching Prisma schema
export const memoryCards = sqliteTable('memory_card', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  question: text('question').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastReviewed: integer('last_reviewed', { mode: 'timestamp' }),
  reviewCount: integer('review_count').default(0)
});

export type MemoryCard = typeof memoryCards.$inferSelect;
export type NewMemoryCard = typeof memoryCards.$inferInsert;