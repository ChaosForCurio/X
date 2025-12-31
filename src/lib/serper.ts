export interface WebSearchResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    source?: string;
    date?: string;
    imageUrl?: string;
    type?: 'organic' | 'knowledge_graph';
    attributes?: Record<string, string>;
}

export interface ShoppingResult {
    title: string;
    link: string;
    price: string;
    source: string;
    imageUrl?: string;
    rating?: number;
    reviews?: number;
}

export interface TrendingTopic {
    title: string;
    query: string;
}

export interface VideoSearchResult {
    title: string;
    link: string;
    snippet: string;
    imageUrl: string;
    duration: string;
    source: string;
    channel: string;
    date: string;
}

const getApiKey = () => {
    const key = process.env.SERPER_API_KEY || process.env.NEXT_PUBLIC_SERPER_API_KEY;
    if (!key) {
        console.warn("[Serper] API key missing (tried SERPER_API_KEY and NEXT_PUBLIC_SERPER_API_KEY)");
    }
    return key;
};

/**
 * Performs a web search using Serper.dev
 */
export async function performWebSearch(query: string, num: number = 5): Promise<WebSearchResult[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[Serper] Search failed: ${response.status}`, error);
            return [];
        }

        const data = await response.json();


        const results: WebSearchResult[] = (data.organic || []).map((result: any, index: number) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            position: index + 1,
            source: result.source,
            date: result.date,
            imageUrl: result.imageUrl || result.thumbnailUrl || (result.richSnippet?.cse_image?.length > 0 ? result.richSnippet.cse_image[0].src : undefined),
            type: 'organic'
        }));

        const topImage = data.images?.[0]?.imageUrl;

        // Extract Knowledge Graph if available
        if (data.knowledgeGraph) {

            const kg = data.knowledgeGraph;

            // Unshift to top
            results.unshift({
                title: kg.title,
                link: kg.website || kg.descriptionLink || `https://www.google.com/search?q=${encodeURIComponent(kg.title)}`,
                snippet: kg.description,
                position: 0,
                source: 'Knowledge Graph',
                imageUrl: kg.imageUrl || topImage, // Backfill image if missing in KG
                type: 'knowledge_graph',
                attributes: kg.attributes
            });
        } else if (results.length > 0 && topImage) {
            // No KG, but we have organic results and an image. 
            // Promote top result to "Featured Entity/Story" style if it doesn't have an image, or just explicitly to give it the hero treatment.
            // Let's only do this if the top result doesn't already have an assigned type (it's organic).

            // To be safe and avoid making "Best Laptops" look like a person, we just ensure it has an image.
            // BUT the user specifically wants "Sundar Pichai" to look like an entity card.
            // If I change type to 'knowledge_graph', it gets the hero layout.
            // Let's do it for the top result if we have a top-level image.


            results[0].type = 'knowledge_graph';
            if (!results[0].imageUrl) {
                results[0].imageUrl = topImage;
            }
        }

        return results;
    } catch (error) {
        console.error("[Serper] Web search error:", error);
        return [];
    }
}

/**
 * Performs a shopping search using Serper.dev
 */
export async function performShoppingSearch(query: string, num: number = 10): Promise<ShoppingResult[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const response = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num }),
        });

        if (!response.ok) {
            console.error(`[Serper] Shopping search failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return (data.shopping || []).map((item: { title: string; link: string; price: string; source: string; imageUrl?: string; rating?: number; reviews?: number }) => ({
            title: item.title,
            link: item.link,
            price: item.price,
            source: item.source,
            imageUrl: item.imageUrl,
            rating: item.rating,
            reviews: item.reviews
        }));
    } catch (error) {
        console.error("[Serper] Shopping search error:", error);
        return [];
    }
}

/**
 * Fetches trending topics
 */
export async function fetchTrendingTopics(): Promise<TrendingTopic[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    const trendingQueries = ["trending news today", "what's viral on social media", "breaking news"];
    const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: randomQuery, num: 10 }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const topics: TrendingTopic[] = [];

        // Extract from People Also Ask
        if (data.peopleAlsoAsk) {
            data.peopleAlsoAsk.slice(0, 4).forEach((item: { question: string }) => {
                if (item.question) topics.push({ title: item.question, query: item.question });
            });
        }

        // Extract from Related Searches
        if (data.relatedSearches) {
            data.relatedSearches.slice(0, 4).forEach((item: { query: string }) => {
                if (item.query) topics.push({ title: item.query, query: item.query });
            });
        }

        return topics.filter((t, i, s) => s.findIndex(x => x.title === t.title) === i).slice(0, 8);
    } catch (error) {
        console.error("[Serper] Trending topics error:", error);
        return [];
    }
}

/**
 * Performs a video search using Serper.dev
 */
export async function performVideoSearch(query: string, num: number = 6): Promise<VideoSearchResult[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const response = await fetch('https://google.serper.dev/videos', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        // Debug: Log first video result
        if (data.videos && data.videos.length > 0) {

        }

        return (data.videos || []).map((v: any) => {
            const ytId = extractYouTubeId(v.link);
            return {
                title: v.title,
                link: v.link,
                snippet: v.snippet || '',
                imageUrl: v.imageUrl || v.thumbnailUrl || (ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : ''),
                duration: v.duration || '',
                source: v.source || 'YouTube',
                channel: v.channel || v.source || '',
                date: v.date || ''
            };
        });
    } catch (error) {
        console.error("[Serper] Video search error:", error);
        return [];
    }
}

/**
 * Extracts YouTube ID from a link
 */
export function extractYouTubeId(link: string): string | null {
    if (!link) return null;
    const match = link.match(/[?&]v=([^&]+)/) || link.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
}
