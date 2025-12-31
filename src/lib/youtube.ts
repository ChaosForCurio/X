import { performVideoSearch, extractYouTubeId } from './serper';

// Removed direct axios import and env var usage as we now delegate to serper.ts

export interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
}

export const fetchNewsVideos = async (category: string): Promise<Video[]> => {
    return fetchChannelVideos(`${category} news`);
};

export const fetchChannelVideos = async (
    channelIdOrHandle: string,
    count: number = 4,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _duration: 'any' | 'long' | 'medium' | 'short' = 'any',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    publishedAfter?: string
): Promise<Video[]> => {
    try {
        const query = `${channelIdOrHandle} youtube`;
        const results = await performVideoSearch(query, count);

        return results.map(item => {
            const id = extractYouTubeId(item.link);
            if (!id) return null;

            return {
                id: id,
                title: item.title,
                description: item.snippet,
                thumbnail: item.imageUrl,
                channelTitle: item.channel,
                publishedAt: item.date,
            };
        })
            .filter((v): v is Video => v !== null);

    } catch (error: unknown) {
        console.error('Error fetching videos via Serper wrapper:', (error as Error).message);
        return getMockVideos(channelIdOrHandle);
    }
};

// Helper to parse "2 hours ago", "5 mins ago", "1 day ago" to ISO string
const parseRelativeDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();

    const now = new Date();
    const str = dateStr.toLowerCase();

    // Basic parsing logic
    if (str.includes('min')) {
        const mins = parseInt(str) || 0;
        now.setMinutes(now.getMinutes() - mins);
    } else if (str.includes('hour')) {
        const hours = parseInt(str) || 0;
        now.setHours(now.getHours() - hours);
    } else if (str.includes('day')) {
        const days = parseInt(str) || 0;
        now.setDate(now.getDate() - days);
    } else if (str.includes('week')) {
        const weeks = parseInt(str) || 0;
        now.setDate(now.getDate() - (weeks * 7));
    } else if (str.includes('month')) {
        const months = parseInt(str) || 0;
        now.setMonth(now.getMonth() - months);
    }

    return now.toISOString();
};

const getMockVideos = (category: string): Video[] => {
    // Real YouTube Video IDs to ensure playback works even with mock data
    const MOCK_IDS = [
        'LXb3EKWsInQ', // 4K Nature
        'tbnzAVRZ9Xc', // NASA
        'UfN01mRjLfw', // Tech News
        'Live_vj-73v0', // Tokyo Walk
        'HhesaQXLuRY', // Tech Review
        'ysz5S6PUM-U'  // AI Intro
    ];

    return Array(6).fill(null).map((_, i) => ({
        id: MOCK_IDS[i % MOCK_IDS.length],
        title: `Sample ${category} News Video ${i + 1}`,
        description: `This is a placeholder description for a ${category} news video. API might be unavailable.`,
        thumbnail: `https://picsum.photos/seed/${category}${i}/320/180`,
        channelTitle: 'News Channel',
        publishedAt: new Date().toISOString(),
    }));
};
