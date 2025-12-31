import { NextResponse } from 'next/server';
import { fetchTrendingTopics } from '@/lib/serper';

// Cache trending topics for 30 minutes
let cachedTopics: { data: Awaited<ReturnType<typeof fetchTrendingTopics>>; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

        // Check cache
        const now = Date.now();
        if (!forceRefresh && cachedTopics && (now - cachedTopics.timestamp) < CACHE_DURATION) {
            return NextResponse.json({
                topics: cachedTopics.data,
                cached: true
            });
        }

        // Fetch fresh trending topics
        const topics = await fetchTrendingTopics();

        // Update cache
        cachedTopics = {
            data: topics,
            timestamp: now
        };

        return NextResponse.json({
            topics,
            cached: false
        });
    } catch (error) {
        console.error('Error fetching trending topics:', error);
        return NextResponse.json({
            topics: [],
            error: 'Failed to fetch trending topics'
        }, { status: 500 });
    }
}
