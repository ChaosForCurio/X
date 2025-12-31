import { db } from '@/db';
import { memories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface Memory {
    id: number;
    userId: string;
    key: string;
    value: string;
    reason?: string | null;
    createdAt: Date;
}

export async function getMemories(userId: string): Promise<Memory[]> {
    try {
        const userMemories = await db.select().from(memories).where(eq(memories.userId, userId));
        return userMemories;
    } catch (error) {
        console.error('Error fetching memories:', error);
        return [];
    }
}

export async function saveMemory(userId: string | null, key: string, value: string, reason?: string) {
    if (!userId) {
        return;
    }

    try {
        // Check if memory with same key exists
        const existing = await db.select().from(memories).where(
            and(eq(memories.userId, userId), eq(memories.key, key))
        );

        if (existing.length > 0) {
            // Update existing memory
            await db.update(memories)
                .set({ value, reason, createdAt: new Date() })
                .where(eq(memories.id, existing[0].id));
        } else {
            // Insert new memory
            await db.insert(memories).values({
                userId,
                key,
                value,
                reason,
            });
        }
    } catch (error) {
        console.error('[Memory] Error saving:', error);
    }
}

export async function forgetMemory(userId: string | null, key: string) {
    if (!userId) {
        return;
    }

    try {
        await db.delete(memories).where(
            and(eq(memories.userId, userId), eq(memories.key, key))
        );

    } catch (error) {
        console.error('[Memory] Error forgetting:', error);
    }
}

export function formatMemoriesForContext(memories: Memory[]): string {
    if (memories.length === 0) return "";

    const formatted = memories.map(m => `- ${m.key}: ${m.value}`).join('\n');
    return `\n[LONG-TERM MEMORY & CONTEXT]\n${formatted}\n`;
}
