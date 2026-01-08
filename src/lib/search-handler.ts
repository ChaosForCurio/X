import { performWebSearch, performVideoSearch } from '@/lib/serper';
import { saveMessage } from '@/lib/db-actions';
import {
    formatSearchResultsForAI,
    formatVideoResultsForUser,
    getSearchSystemInstructions
} from '@/lib/search-formatter';
import { aiService } from '@/lib/ai';
import { cleanAIResponse } from '@/lib/json-cleaner';
import { AIContent } from '@/lib/ai/types';

interface SearchHandlerResult {
    response: string;
    hasResults: boolean;
}

export async function handleWebSearch(
    query: string,
    userId: string | null,
    chatId: string,
    clientHistory: AIContent[]
): Promise<SearchHandlerResult> {
    try {


        // 1. Parallel Fetching of Data
        const [results, xResults, fetchedVideoResults] = await Promise.all([
            performWebSearch(query),
            performWebSearch(`${query} site:x.com OR site:twitter.com`),
            performVideoSearch(query, 6)
        ]);

        // 2. Check if we found anything meaningful
        if (results.length === 0 && xResults.length === 0) {
            const noResultsMessage = `I searched for "${query}" but couldn't find any relevant real-time information. I'll answer based on my general knowledge.`;
            // Only save to DB if it's a distinct fallback message; 
            // otherwise, the caller might want to handle the "no results" case differently.
            // For now, consistent with original logic:
            await saveMessage(userId, chatId, 'ai', noResultsMessage);
            return { response: noResultsMessage, hasResults: false };
        }

        // 3. Format Context for AI
        const searchContext = formatSearchResultsForAI(results);
        const xContext = xResults.length > 0
            ? `\n\nSOCIAL MEDIA CONTEXT (X/Twitter):\n${xResults.map(r => `- ${r.snippet}`).join('\n')}`
            : "";

        // 4. Construct System Prompt
        const followUpPrompt = getSearchSystemInstructions(query, searchContext + xContext);

        // 5. Generate AI Synthesis
        let aiResponse;
        try {
            aiResponse = await aiService.generateText(followUpPrompt, {
                provider: 'gemini',
                history: clientHistory
            });
        } catch (geminiError) {
            console.error("[SearchHandler] Gemini Failed, falling back to Groq:", geminiError);
            aiResponse = await aiService.generateText(followUpPrompt, {
                provider: 'groq',
                history: clientHistory
            });
        }

        // 6. Clean and Format Response
        const { cleanText: finalAnswer } = cleanAIResponse(aiResponse);
        const videoFeed = formatVideoResultsForUser(fetchedVideoResults);
        const finalAnswerWithVideo = finalAnswer + videoFeed;

        // 7. Persist to Database
        await saveMessage(userId, chatId, 'ai', finalAnswerWithVideo);

        return { response: finalAnswerWithVideo, hasResults: true };

    } catch (error) {
        console.error("[SearchHandler] Fatal Error:", error);
        throw error; // Re-throw to be handled by the route's error handler
    }
}

export async function streamWebSearch(
    query: string,
    userId: string | null,
    chatId: string,
    clientHistory: AIContent[],
    onFinalAnswer?: (answer: string) => Promise<void>
): Promise<ReadableStream<string>> {
    const [results, xResults, fetchedVideoResults] = await Promise.all([
        performWebSearch(query),
        performWebSearch(`${query} site:x.com OR site:twitter.com`),
        performVideoSearch(query, 6)
    ]);

    if (results.length === 0 && xResults.length === 0) {
        const noResultsMessage = `I searched for "${query}" but couldn't find any relevant real-time information.`;
        return new ReadableStream({
            start(controller) {
                controller.enqueue(noResultsMessage);
                controller.close();
            }
        });
    }

    const searchContext = formatSearchResultsForAI(results);
    const xContext = xResults.length > 0
        ? `\n\nSOCIAL MEDIA CONTEXT (X/Twitter):\n${xResults.map(r => `- ${r.snippet}`).join('\n')}`
        : "";

    const followUpPrompt = getSearchSystemInstructions(query, searchContext + xContext);
    const videoFeed = formatVideoResultsForUser(fetchedVideoResults);

    const aiStream = await aiService.streamText(followUpPrompt, {
        provider: 'gemini',
        history: clientHistory
    });

    let fullAnswer = "";

    return new ReadableStream({
        async start(controller) {
            const reader = aiStream.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        fullAnswer += value;
                        controller.enqueue(value);
                    }
                }

                // Append the video feed at the end of the stream
                if (videoFeed) {
                    controller.enqueue(videoFeed);
                    fullAnswer += videoFeed;
                }

                // Persist the full response
                if (onFinalAnswer) {
                    await onFinalAnswer(fullAnswer);
                } else {
                    await saveMessage(userId, chatId, 'ai', fullAnswer);
                }

            } catch (e) {
                controller.error(e);
            } finally {
                reader.releaseLock();
                controller.close();
            }
        }
    });
}
