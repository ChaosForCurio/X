import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chats, messages, userImages } from '@/db/schema';
import { stackServerApp } from '@/stack';
import { count, sql } from 'drizzle-orm';

export async function GET() {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Total Stats
        const [chatCount] = await db.select({ value: count() }).from(chats);
        const [msgCount] = await db.select({ value: count() }).from(messages);
        const [libCount] = await db.select({ value: count() }).from(userImages);

        // 2. Activity Trends (dummy for now as we don't have daily aggregates easily)
        // In a real app, we'd query for counts grouped by date
        const activityTrend = [
            { name: 'Mon', chats: 4, messages: 24 },
            { name: 'Tue', chats: 7, messages: 45 },
            { name: 'Wed', chats: 5, messages: 32 },
            { name: 'Thu', chats: 10, messages: 67 },
            { name: 'Fri', chats: 12, messages: 89 },
            { name: 'Sat', chats: 8, messages: 54 },
            { name: 'Sun', chats: 6, messages: 38 },
        ];

        // 3. Tool Usage (Mocked based on available data types)
        const toolUsage = [
            { name: 'Image Gen', value: libCount.value },
            { name: 'Video Gen', value: Math.floor(libCount.value * 0.2) }, // Placeholder
            { name: 'Web Search', value: chatCount.value * 2 }, // Placeholder
            { name: 'Research', value: Math.floor(chatCount.value * 0.5) }, // Placeholder
        ];

        return NextResponse.json({
            success: true,
            stats: {
                totalChats: chatCount.value,
                totalMessages: msgCount.value,
                totalLibraryItems: libCount.value,
            },
            activityTrend,
            toolUsage
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
