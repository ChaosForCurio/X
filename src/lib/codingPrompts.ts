/**
 * Coding Prompts Library
 * Fetches coding prompt templates from database with pagination
 */

export interface CodingPrompt {
    id: string;
    title: string;
    prompt: string;
    category: string;
    tags: string[];
    usageCount?: number;
}

export interface PaginatedPromptsResponse {
    prompts: CodingPrompt[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

/**
 * Fetches coding prompts from database API with pagination
 * @param page Page number (1-indexed)
 * @param limit Number of prompts per page
 * @param category Optional category filter
 */
export async function fetchCodingPrompts(
    page: number = 1,
    limit: number = 10,
    category?: string
): Promise<PaginatedPromptsResponse> {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (category) {
            params.append('category', category);
        }

        const response = await fetch(`/api/text-prompts?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch prompts');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching coding prompts:', error);
        return {
            prompts: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasMore: false,
            }
        };
    }
}

/**
 * Track when a prompt is used
 */
export async function trackPromptUsage(promptId: string): Promise<void> {
    try {
        await fetch('/api/text-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptId }),
        });
    } catch (error) {
        console.error('Error tracking prompt usage:', error);
    }
}

/**
 * Get prompts summary for AI context
 * Returns a compact representation of available prompts for system instructions
 */
export async function getPromptsForAIContext(): Promise<string> {
    try {
        const response = await fetch('/api/text-prompts?limit=50');
        if (!response.ok) return '';

        const data: PaginatedPromptsResponse = await response.json();

        // Create a compact summary for AI context
        const categories = new Map<string, string[]>();

        for (const prompt of data.prompts) {
            const existing = categories.get(prompt.category) || [];
            existing.push(`"${prompt.title}" (${prompt.id})`);
            categories.set(prompt.category, existing);
        }

        let contextString = 'Available Coding Prompt Templates:\n';
        for (const [category, titles] of categories) {
            contextString += `- ${category}: ${titles.join(', ')}\n`;
        }

        return contextString;
    } catch (error) {
        console.error('Error getting prompts for AI context:', error);
        return '';
    }
}

/**
 * Get all available categories from prompts
 */
export function getPromptCategories(): string[] {
    return [
        'Implementation',
        'Debugging',
        'Refactoring',
        'Testing',
        'Documentation',
        'Algorithms',
        'Database',
        'Security',
        'Architecture',
    ];
}
