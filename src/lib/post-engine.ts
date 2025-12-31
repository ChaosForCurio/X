import { fetchTrendingTopics, performWebSearch } from './serper';
import { getGeminiResponse } from './gemini';

export interface PostConfig {
    goal: 'trending' | 'scrape' | 'manual';
    sourceValue?: string;
    platforms: string[];
    persona: string;
    tone: string;
    mediaType: 'image' | 'video' | 'none';
    visualStyle?: string;
    isThread: boolean;
}

export interface GeneratedPost {
    platform: string;
    content: string;
    hashtags: string[];
    viralityScore: number;
    analysis: string;
}

export interface PostGenerationResult {
    posts: GeneratedPost[];
    mediaUrl?: string;
    researchData?: any;
}

/**
 * Orchestrates the full post generation flow
 */
export async function generateStudioPost(config: PostConfig): Promise<PostGenerationResult> {


    let context = '';

    // 1. Research / Context Gathering
    if (config.goal === 'trending') {
        const trends = await fetchTrendingTopics();
        context = `Trending Topics: ${JSON.stringify(trends.slice(0, 5))}`;
    } else if (config.goal === 'scrape' && config.sourceValue) {
        // Simple search for the URL to get a snippet/context if scraping is not direct
        const searchResults = await performWebSearch(config.sourceValue);
        context = `Article Context: ${JSON.stringify(searchResults.slice(0, 3))}`;
    } else if (config.goal === 'manual' && config.sourceValue) {
        context = `Topic: ${config.sourceValue}`;
    }

    // 2. Content Generation for each platform
    const posts: GeneratedPost[] = [];

    for (const platform of config.platforms) {
        const prompt = `
            You are a world-class social media strategist acting as a "${config.persona}".
            Your tone is "${config.tone}".
            
            Based on this context: ${context}
            
            Generate a high-engagement post for ${platform.toUpperCase()}.
            ${platform === 'x' && config.isThread ? 'Generate a THREAD of 3-5 connected posts.' : ''}
            ${platform === 'linkedin' ? 'Focus on professional insights and use clear spacing.' : ''}
            ${platform === 'instagram' ? 'Focus on visual storytelling and short, punchy copy.' : ''}

            Return your response in JSON format:
            {
                "content": "The actual post content...",
                "hashtags": ["tag1", "tag2"],
                "viralityScore": 0-100,
                "analysis": "Brief explanation of why this will perform well"
            }
        `;

        const response = await getGeminiResponse(prompt);
        try {
            const parsed = JSON.parse(response);
            posts.push({
                platform,
                content: parsed.content,
                hashtags: parsed.hashtags || [],
                viralityScore: parsed.viralityScore || 80,
                analysis: parsed.analysis || 'Optimized for high engagement.'
            });
        } catch (e) {
            console.error('[PostEngine] Failed to parse AI response:', e);
            posts.push({
                platform,
                content: response,
                hashtags: [],
                viralityScore: 50,
                analysis: 'Failed to generate analysis.'
            });
        }
    }

    return { posts };
}
