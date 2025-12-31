import axios from 'axios';

const SERPER_API_KEY = process.env.NEXT_PUBLIC_SERPER_API_KEY;
const SERPER_API_URL = 'https://google.serper.dev/videos';

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
    _duration: 'any' | 'long' | 'medium' | 'short' = 'any', // Duration param is kept for signature compatibility but not used by Serper effectively
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    publishedAfter?: string
): Promise<Video[]> => {
    try {
        const response = await axios.get(SERPER_API_URL, {
            params: {
                q: `${channelIdOrHandle} youtube`,
                gl: 'us',
                hl: 'en'
            },
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || !response.data.videos) {
            return getMockVideos(channelIdOrHandle);
        }

        return response.data.videos
            .map((item: { link?: string; title: string; snippet?: string; imageUrl?: string; channel?: string; date: string }) => {
                // Extract video ID from link (e.g. https://www.youtube.com/watch?v=VIDEO_ID)
                const link = item.link || '';
                const idMatch = link.match(/[?&]v=([^&]+)/);
                const id = idMatch ? idMatch[1] : null;

                if (!id) return null;

                return {
                    id: id,
                    title: item.title,
                    description: item.snippet || '',
                    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` || item.imageUrl,
                    channelTitle: item.channel || 'Unknown Channel',
                    publishedAt: parseRelativeDate(item.date),
                };
            })
            .filter((v: Video | null) => v !== null)
            .slice(0, count);

    } catch (error: unknown) {
        console.error('Error fetching videos from Serper:', (error as Error).message);
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
