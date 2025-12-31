import { WebSearchResult, ShoppingResult, VideoSearchResult, extractYouTubeId } from './serper';

/**
 * Provides system instructions for the AI on how to format search responses.
 */
export function getSearchSystemInstructions(query: string, context: string): string {
    return `
You are a world-class AI research assistant and professional technical writer. Your goal is to synthesize the following search results into a definitive, executive-style response.

### CORE OBJECTIVES:
1. **Critical Discovery**: Identify the most authoritative and up-to-date information. Prioritize official documentation, reputable news organizations, and primary technical sources over secondary summaries.
2. **Intelligent Synthesis**: Do NOT just list snippets. Analyze the "best" information from all sources to weave a seamless narrative. If sources conflict, note the discrepancy but lean towards the more reputable source.
3. **Cross-Referencing**: Use multiple sources to verify facts. A claim is "verified" if mentioned by >1 reputable source.
4. **Professional Logic**: Structure your response for high-speed readability (Executive Summary -> Deep Dive -> Expert Insights).

### CITATION RULES:
- Use inline citations like [1], [2] at the end of sentences that use that source.
- Multiple citations like [1][3] are encouraged if information is cross-referenced.
- Citation numbers MUST match the list in "Verified Sources".

### STRUCTURE:
# ${query}

## Executive Summary
[Concise 2-3 sentence strategic overview of the primary answer/status.]

## Key Insights & Analysis
[In-depth narrative breakdown. Use subheadings if needed. This is the "meat" of the response where you synthesize the BEST information found.]

## Expert Perspectives
- [Key point 1 with citation [1]]
- [Key point 2 with citation [2]]
...

## Verified Sources
[I will provide the sources below. You MUST format them exactly as I provide them at the end of your response, ensuring they are numbered [1], [2], etc.]

## Live Market & X (Twitter) Context
[If applicable, integrate real-time sentiment or breaking news from the social media data provided.]

### DATA CONTEXT:
${context}
`;
}

/**
 * Formats web search results into premium Markdown for the USER
 */
export function formatSearchResultsForUser(query: string, results: WebSearchResult[]): string {
    if (results.length === 0) {
        return `### 🔍 Search: ${query}\n\nNo relevant results were found for this query.`;
    }

    let markdown = `# 🌐 Web Search: ${query}\n\n`;

    // Separate Knowledge Graph from Organic Results
    const knowledgeGraph = results.find(r => r.type === 'knowledge_graph');
    const organicResults = results.filter(r => r.type !== 'knowledge_graph'); // Keep all organic

    // --- RENDER ENTITY CARD FOR PEOPLE/PLACES ---
    // 2. Knowledge Graph Entity Card (if available) - Now using custom Component
    const entityResult = results.find(r => r.type === 'knowledge_graph');
    if (entityResult) {
        const entityData = {
            title: entityResult.title,
            subtitle: entityResult.snippet,
            imageUrl: entityResult.imageUrl,
            attributes: entityResult.attributes || {},
            link: entityResult.link
        };
        markdown += `[ENTITY_CARD]${JSON.stringify(entityData)}[/ENTITY_CARD]\n\n`;
    }
    // -------------------------------------------

    // Top Organic Result (if it wasn't the KG)
    if (organicResults.length > 0) {
        const topResult = organicResults[0];
        markdown += `### 💡 Top Insight\n> [!IMPORTANT]\n> **[${topResult.title}](${topResult.link})**\n> ${topResult.snippet}\n\n`;
    }

    markdown += `### 🔦 Key Results\n\n`;

    const webResults = organicResults.filter(r => !extractYouTubeId(r.link));
    const videoResultsFromWeb = organicResults
        .map(r => {
            const ytId = extractYouTubeId(r.link);
            if (!ytId) return null;
            return {
                id: ytId,
                title: r.title,
                link: r.link,
                thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
                channel: r.source || new URL(r.link).hostname.replace('www.', ''),
                duration: '',
                date: r.date || ''
            };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

    webResults.forEach((result, index) => {
        const date = result.date ? ` • ${result.date}` : '';
        const sourceName = result.source || new URL(result.link).hostname.replace('www.', '');
        const ytId = extractYouTubeId(result.link);

        markdown += `#### ${index + 1}. [${result.title}](${result.link})\n`;

        if (ytId) {
            // Premium Video Card Style for YouTube links in regular search - Always use high res
            markdown += `![${result.title}](https://img.youtube.com/vi/${ytId}/maxresdefault.jpg)\n\n`;
        } else if (result.imageUrl) {
            // Show thumbnail for organic results if available
            markdown += `![${result.title}](${result.imageUrl})\n\n`;
        }

        markdown += `> [!NOTE]\n`;
        markdown += `> **Source:** [${sourceName}](${result.link})${date}\n`;
        markdown += `> ${result.snippet}\n\n`;
    });

    if (videoResultsFromWeb.length > 0) {
        const feedData = {
            title: "Video News Coverage",
            videos: videoResultsFromWeb
        };
        markdown += `[YOUTUBE_FEED] ${JSON.stringify(feedData)} [/YOUTUBE_FEED]\n\n`;
    }

    markdown += `\n---\n> [!TIP]\n> Search conducted via **Serper.dev**. All links are verified external sources.\n`;

    return markdown;
}

/**
 * Formats web search results into a dense context block for the AI
 */
/**
 * Formats web search results into a dense context block for the AI
 */
export function formatSearchResultsForAI(results: WebSearchResult[]): string {
    if (results.length === 0) return "No web search results found.";

    let context = "SEARCH RESULTS CONTEXT (USE THESE FOR CITATIONS [1], [2], etc.):\n\n";

    // Prepend Knowledge Graph Data if available
    const kg = results.find(r => r.type === 'knowledge_graph');
    if (kg) {
        context += `[KNOWLEDGE_GRAPH_ENTITY]\n`;
        context += `Name: ${kg.title}\n`;
        context += `Description: ${kg.snippet}\n`;
        if (kg.attributes) {
            context += `Attributes: ${JSON.stringify(kg.attributes)}\n`;
        }
        context += `Image Available: ${!!kg.imageUrl}\n`;
        context += `\n`;
    }

    results.forEach((result, index) => {
        // Skip knowledge graph in the numbered list to avoid duplication if it's treated as a result
        if (result.type === 'knowledge_graph') return;

        context += `SOURCE [${index + 1}]:\n`;
        context += `Title: ${result.title}\n`;
        context += `URL: ${result.link}\n`;
        context += `Snippet: ${result.snippet}\n`;
        if (result.date) context += `Date: ${result.date}\n`;
        context += `\n`;
    });
    return context;
}

/**
 * Formats shopping results for the USER
 */
export function formatShoppingResultsForUser(query: string, results: ShoppingResult[]): string {
    if (results.length === 0) return "### 🛒 Shopping: No products found.";

    let markdown = `# 🛒 Shopping Results: ${query}\n\n`;

    results.forEach((item, index) => {
        markdown += `### ${index + 1}. ${item.title}\n\n`;

        if (item.imageUrl) {
            markdown += `![${item.title.substring(0, 30)}](${item.imageUrl})\n\n`;
        }

        markdown += `💰 **Price:** ${item.price}\n`;
        markdown += `🏪 **Seller:** ${item.source}\n`;
        if (item.rating) {
            const stars = "⭐".repeat(Math.round(item.rating));
            markdown += `🌟 **Rating:** ${stars} (${item.reviews || 0} reviews)\n`;
        }
        markdown += `🔗 **Buy Now:** [View Product](${item.link})\n\n`;
        markdown += `---\n\n`;
    });

    return markdown;
}

/**
 * Formats video results for the user into a custom [YOUTUBE_FEED] tag
 */
export function formatVideoResultsForUser(results: VideoSearchResult[]): string {
    if (results.length === 0) return "";

    const videos = results.map(v => {
        const ytId = extractYouTubeId(v.link);
        return {
            id: ytId,
            title: v.title,
            link: v.link,
            thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : v.imageUrl,
            channel: v.channel,
            duration: v.duration,
            date: v.date
        };
    }).filter(v => v.id);

    if (videos.length === 0) return "";

    return `\n\n[YOUTUBE_FEED] ${JSON.stringify(videos)} [/YOUTUBE_FEED]\n\n`;
}
