import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { textPrompts } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { EXTENDED_PROMPTS } from '@/lib/extendedPrompts';

// Use extended prompts library (200 prompts)
const CODING_PROMPT_TEMPLATES = EXTENDED_PROMPTS.map(p => ({
    promptId: p.promptId,
    title: p.title,
    prompt: p.prompt,
    category: p.category,
    tags: p.tags,
    source: p.source || 'Best Practices'
}));

// GET - Fetch prompts with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const category = searchParams.get('category');
        const offset = (page - 1) * limit;

        // Check if database needs seeding (empty or has old data with less than 200 prompts)
        const existingCount = await db.select({ count: sql<number>`count(*)` }).from(textPrompts);
        const currentCount = Number(existingCount[0].count);

        // Seed if empty or if we have fewer prompts than the extended library
        if (currentCount < CODING_PROMPT_TEMPLATES.length) {
            // Reseeding prompts

            // Clear old prompts if any exist
            if (currentCount > 0) {
                await db.delete(textPrompts);
            }

            // Seed the database with all templates
            for (const template of CODING_PROMPT_TEMPLATES) {
                await db.insert(textPrompts).values({
                    promptId: template.promptId,
                    title: template.title,
                    prompt: template.prompt,
                    category: template.category,
                    tags: JSON.stringify(template.tags),
                });
            }
            // Seeded prompts successfully
        }

        // Build query
        let query = db.select().from(textPrompts);

        if (category) {
            query = query.where(eq(textPrompts.category, category)) as typeof query;
        }

        const prompts = await query
            .orderBy(desc(textPrompts.usageCount))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const totalResult = await db.select({ count: sql<number>`count(*)` }).from(textPrompts);
        const total = totalResult[0].count;

        return NextResponse.json({
            prompts: prompts.map(p => ({
                id: p.promptId,
                title: p.title,
                prompt: p.prompt,
                category: p.category,
                tags: JSON.parse(p.tags),
                usageCount: p.usageCount,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: offset + prompts.length < total,
            }
        });
    } catch (error) {
        console.error('Error fetching text prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}

// POST - Increment usage count when a prompt is used
export async function POST(request: NextRequest) {
    try {
        const { promptId } = await request.json();

        if (!promptId) {
            return NextResponse.json({ error: 'promptId is required' }, { status: 400 });
        }

        await db.update(textPrompts)
            .set({ usageCount: sql`${textPrompts.usageCount} + 1` })
            .where(eq(textPrompts.promptId, promptId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating prompt usage:', error);
        return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 });
    }
}
