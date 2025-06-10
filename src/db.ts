
import { memoryCards } from './drizzle/schema.js';
import { eq, and, or, lte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import 'dotenv/config';

import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';

const db =drizzle( env.DB );


export const dbFunction = {
    createMemoryCard,
    getMemoryCards,
    getAllMemoryCards,
    batchUpdateMemoryCards,
    deleteMemoryCard
}

async function createMemoryCard(data: {
    content: string,
    question: string,
}) {
    try {
        const now = Math.floor(Date.now() / 1000);
        const memoryCard = await db.insert(memoryCards).values({
            content: data.content,
            question: data.question,
            lastReviewed: sql`${now}`,
            reviewCount: 0
        }).returning();
        
        return {
            state: true,
            message: "Memory card created successfully",
            data: memoryCard[0]
        };
    } catch (error) {
        return {
            state: false,
            message: "Error creating memory card, Info: " + error,
            data: null
        };
    }
}

async function getAllMemoryCards() {
    try {
        const allCards = await db.select().from(memoryCards);
        return {
            state: true,
            message: "All memory cards fetched successfully",
            data: allCards
        };
    } catch (error) {
        return {
            state: false,
            message: "Error fetching all memory cards, Info: " + error,
            data: null
        };
    }
}

async function deleteMemoryCard(id: string) {
    try {
        const deletedCard = await db.delete(memoryCards)
            .where(eq(memoryCards.id, id))
            .returning();
            
        return {
            state: true,
            message: "Memory card deleted successfully",
            data: deletedCard[0]
        };
    } catch (error) {
        return {
            state: false,
            message: "Error deleting memory card, Info: " + error,
            data: null
        };
    }
}

async function batchUpdateMemoryCards(ids: number[]) {
    try {
        const now = Math.floor(Date.now() / 1000);
        const updatedCards = await db.update(memoryCards)
            .set({
                reviewCount: sql`${memoryCards.reviewCount} + 1`,
                lastReviewed: sql`${now}`
            })
            .where(
                sql`${memoryCards.id} IN ${ids}`
            )
            .returning();
            
        return {
            state: true,
            message: "Memory cards updated successfully",
            data: updatedCards
        };
    } catch (error) {
        return {
            state: false,
            message: "Error updating memory cards, Info: " + error,
            data: null
        };
    }
}

async function getMemoryCards() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const totalPendingCards = await db
            .select({ count: sql<number>`count(*)` })
            .from(memoryCards)
            .where(
                or(
                    lte(
                        sql`COALESCE(${memoryCards.lastReviewed}, ${memoryCards.createdAt}) + ((1 << ${memoryCards.reviewCount}) * 86400)`,
                        sql`${now}`
                    ),
                    sql`${memoryCards.lastReviewed} IS NULL`
                )
            )
            .then(res => res[0]?.count || 0);
            
        const cardsToReview = await db.select()
            .from(memoryCards)
            .where(
                or(
                    lte(
                        sql`COALESCE(${memoryCards.lastReviewed}, ${memoryCards.createdAt}) + ((1 << ${memoryCards.reviewCount}) * 86400)`,
                        sql`${now}`
                    ),
                    sql`${memoryCards.lastReviewed} IS NULL`
                )
            )
            .limit(3);
            
        return {
            state: true,
            message: "Memory cards fetched successfully",
            data: {
                cards: cardsToReview,
                totalPending: totalPendingCards
            }
        };
    } catch (error) {
        return {
            state: false,
            message: "Error fetching memory cards, Info: " + error,
            data: null
        };
    }
}