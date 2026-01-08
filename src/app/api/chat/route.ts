import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { AIContent } from '@/lib/ai/types';
import { stackServerApp } from '@/stack';
import { saveMemory, forgetMemory } from '@/lib/memory';
import { saveMessage, getChatHistory, getSummary, isRateLimited, ensureChat } from '@/lib/db-actions';
import { performShoppingSearch } from '@/lib/serper';
import { formatShoppingResultsForUser } from '@/lib/search-formatter';
import { cleanAIResponse } from '@/lib/json-cleaner';
import { detectIntent } from '@/lib/intentDetector';
import { handleWebSearch } from '@/lib/search-handler';

export async function POST(request: Request) {
    let rawResponse = "";
    let userId: string | null = null;
    let currentChatId = 'default-chat';
    let clientHistory: AIContent[] = [];
    let finalPrompt = "";
    let image: string | undefined;

    try {
        let user;
        try {
            user = await stackServerApp.getUser();
        } catch (authError) {
            console.error("Stack Auth Error:", authError);
            user = null;
        }
        userId = user?.id || null;

        const body = await request.json();
        const { prompt, messages, chatId, imageContext } = body;
        image = body.image;

        currentChatId = chatId || 'default-chat';

        clientHistory = messages ? messages.slice(-50).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })) : [];

        if (!prompt && !image) {
            return NextResponse.json({ error: 'Prompt or image is required' }, { status: 400 });
        }

        finalPrompt = prompt;

        // Inject Image Context if available
        if (imageContext) {
            finalPrompt = `[SYSTEM INSTRUCTION: IMAGE MODIFICATION MODE]
The user wants to modify the previously generated image.
Use the following context to understand the baseline.
You MUST generate a NEW "generate_image" JSON action that merges the user's new request with the previous prompt.
DO NOT lose details from the previous prompt unless the user explicitly asks to change them.

[CONTEXT: Last Generated Image]
Previous Prompt: "${imageContext.last_prompt}"
Previous Params: ${JSON.stringify(imageContext.last_params)}
Previous Image URL: ${imageContext.last_image_url}

[USER REQUEST]
${prompt}

[YOUR GOAL]
Produce a JSON response with:
1. "backend": { "action": "generate_image", "prompt": "...", "params": ... }
2. "memory_update": { "last_prompt": "...", ... }
3. "explanation": "..."

CRITICAL: DO NOT OUTPUT PLAIN TEXT. ONLY OUTPUT THE JSON OBJECT.
If you output plain text, the system will fail.
DO NOT say you cannot generate images. You CAN. Just output the JSON.
`;
        }

        // 1. Rate Limit
        if (await isRateLimited(userId)) {
            return NextResponse.json({ response: "You are sending messages too quickly. Please wait a moment." });
        }

        // Ensure chat exists
        await ensureChat(currentChatId, userId, 'New Conversation');

        // 2. Save User Message
        let dbContent = prompt || (image ? "[Image Uploaded]" : "");
        if (image) {
            if (image.startsWith('data:application/pdf')) {
                dbContent = `[PDF Attachment] \n${prompt || ""} `;
            } else {
                dbContent = `[Image Uploaded] \n${prompt || ""} `;
            }
        }
        await saveMessage(userId, currentChatId, 'user', dbContent);

        // Manual Web Search Logic - Check for @web prefix
        if (prompt && /@web/i.test(prompt)) {
            const searchQuery = prompt.replace(/@web/i, '').trim() || prompt.trim();
            if (searchQuery) {
                const { response } = await handleWebSearch(searchQuery, userId, currentChatId, clientHistory);
                return NextResponse.json({ response });
            }
        }

        // 3. Retrieve Context
        let context = "";
        const detectedIntent = detectIntent(prompt || "");

        if (detectedIntent.type === 'Shopping') {
            let shoppingData = "";
            try {
                if (['ProductRecommendation', 'CategorySearch', 'BestDeals', 'OnlineStoreIntent'].includes(detectedIntent.subType || '')) {
                    const results = await performShoppingSearch(prompt);
                    shoppingData = formatShoppingResultsForUser(prompt, results);
                }
            } catch (e) {
                console.error("Shopping Search Failed:", e);
            }

            context += `
            [SYSTEM ACTIVATION: GOOGLE ADK PERSONALIZED SHOPPING AGENT]
The user's input matches a specific shopping intent: "${detectedIntent.description}" (${detectedIntent.subType}).

YOU ARE NOW THE "GOOGLE ADK SHOPPING AGENT".
Your goal is to provide highly personalized, data - driven, and helpful shopping assistance.

Guidelines for this Persona:
                1. ** Be Proactive:** Don't just answer the question; guide the user to the best choice.
            2. ** Ask Clarifying Questions:** If the request is vague(e.g., "best phone"), ask about budget, user preferences, etc.
3. ** Use Live Data:** Incorporate the following live product information if available:
${shoppingData || "No live data available for this specific query yet."}
            4. ** Premium Formatting:** Use bolding, bullet points, and clean structures for product comparisons.
5. ** User Intent Trigger **: ${detectedIntent.subType}
            6. ** User Intent Context **: ${detectedIntent.description}
            `;
        } else if (detectedIntent.type === 'Technical') {
            context += `
            [SYSTEM ACTIVATION: ELITE TECHNICAL ARCHITECT & SENIOR DEVELOPER]
The user's query is technical in nature: "${detectedIntent.description}"

YOU ARE NOW THE "ELITE TECHNICAL ARCHITECT".
Your goal is to provide deep technical insights, accurate code, and architectural guidance.

                Guidelines:
            1. ** Precision First:** Ensure all code snippets are valid, modern, and follow best practices.
2. ** Explain the "Why":** Don't just give a solution; explain the underlying logic.
            3. ** Edge Cases:** Mention potential pitfalls or performance considerations.
4. ** Code Canvas:** If you provide substantial code, use the standard triple - backtick markdown format.
`;
        } else if (detectedIntent.type === 'Creative') {
            context += `
            [SYSTEM ACTIVATION: VISIONARY CREATIVE DIRECTOR]
The user's query is creative or design-focused: "${detectedIntent.description}"

YOU ARE NOW THE "VISIONARY CREATIVE DIRECTOR".
Your goal is to inspire, ideate, and provide aesthetically superior creative direction.

                Guidelines:
            1. ** Vivid Descriptions:** Use evocative language to describe visual or narrative elements.
2. ** Style Awareness:** Reference specific design styles(e.g., Minimalism, Bauhaus, Cyberpunk) when relevant.
3. ** Iterative Thinking:** Offer multiple variations or directions the user could take.
4. ** Visual Potential:** If the user asks for a design, also provide a detailed "image_prompt" in your final JSON output if you choose to trigger image generation.
`;
        } else if (detectedIntent.type === 'Research') {
            context += `
            [SYSTEM ACTIVATION: DEEP RESEARCH ANALYST]
The user is seeking detailed information or analysis: "${detectedIntent.description}"

YOU ARE NOW THE "DEEP RESEARCH ANALYST".
Your goal is to provide comprehensive, fact - based, and well - structured research.

                Guidelines:
            1. ** Factual Depth:** Go beyond surface - level answers.Provide history, context, and current trends.
2. ** Multidimensional:** Address the topic from different angles(economic, social, technical, etc.).
3. ** Source Orientation:** If search results are provided, cite them clearly.
4. ** Premium Structure:** Use H1, H2, and H3 headers for long - form analysis.
`;
        }

        // Video Generation Logic
        if (prompt && prompt.trim().toLowerCase().startsWith('@video')) {
            const videoPrompt = prompt.replace(/@video/i, '').trim();
            if (videoPrompt) {
                context += `SYSTEM INSTRUCTION: The user wants to generate a video with the prompt: "${videoPrompt}".\n`;
                context += `You MUST return a JSON response with the action "generate_video" and the prompt "${videoPrompt}".\n`;
                context += `Do not output plain text.Output ONLY the JSON object.\n`;
                context += `Example: { "action": "generate_video", "freepik_prompt": "${videoPrompt}" } \n`;
                finalPrompt = `Generate a video for: ${videoPrompt} `;
            } else {
                context += "SYSTEM NOTE: The user typed @video but provided no prompt. Ask them what video they want to generate.\n\n";
            }
        }

        const [summary] = await Promise.all([
            getSummary(currentChatId),
            getChatHistory(userId, currentChatId, 10)
        ]);

        if (summary) {
            context += `PREVIOUS CONVERSATION SUMMARY: \n${summary} \n\n`;
        }

        context += `
            [SYSTEM INSTRUCTION: SMART TOOLS]
Trigger actions ONLY when the user's request explicitly matches the capability.
                - ** Image Generation **: If the user wants to see, draw, or generate an image, output: { "action": "generate_image", "freepik_prompt": "detailed prompt" }
- ** Web Search **: If the user needs fresh info, news, or external data, output: { "action": "web_search", "search_query": "search query" }
- ** Video Generation **: If the user types @video, output: { "action": "generate_video", "freepik_prompt": "prompt" }

** CRITICAL RULES **:
            1. Output ONLY the JSON object when triggering an action.
2. NO conversational filler(e.g., "I will now search...").
3. NO text outside the JSON.
4. If you have already been provided search results in the context, do NOT trigger another search.Answer the question directly using the provided data.
            5. Provide a list of '### Suggestions' at the end of your final text response.Format each suggestion exactly as: "- [SUGGESTION] Suggestion Text"
`;

        // 4. Get AI Response
        try {
            rawResponse = await aiService.generateText(finalPrompt, {
                provider: 'groq',
                history: clientHistory,
                context
            });
        } catch (error) {
            console.error("Groq Power failure, falling back to Gemini:", error);
            rawResponse = await aiService.generateText(finalPrompt, {
                provider: 'gemini',
                history: clientHistory,
                context,
                image
            });
        }

        // 5. Unified Response Parsing & Action Extraction
        const { cleanText: finalResponse, extractedJson } = cleanAIResponse(rawResponse);

        interface AgentAction {
            action?: string;
            search_query?: string;
            backend?: {
                action: string;
                prompt: string;
            };
            memory_update?: unknown;
            explanation?: string;
            freepik_prompt?: string;
            promptId?: string;
            title?: string;
            reason?: string;
            auto_memory?: {
                store?: { key: string; value: string }[];
                forget?: string[];
                reason?: string;
            };
        }

        const parsedAction = extractedJson as AgentAction | null;

        // Handle Actions if extracted
        if (parsedAction) {
            if (parsedAction.action === 'web_search' && parsedAction.search_query) {
                try {
                    const { response } = await handleWebSearch(parsedAction.search_query, userId, currentChatId, clientHistory);
                    return NextResponse.json({ response });
                } catch (e) {
                    console.error("Auto search handler failed", e);
                }
            }

            if (parsedAction.backend && parsedAction.backend.action === 'generate_image') {
                const explanation = parsedAction.explanation || finalResponse || "Generating image...";
                await saveMessage(userId, currentChatId, 'ai', explanation);
                return NextResponse.json({
                    response: explanation,
                    backend: parsedAction.backend,
                    memory_update: parsedAction.memory_update,
                    explanation: parsedAction.explanation
                });
            }

            if (parsedAction.action === 'generate_image' && parsedAction.freepik_prompt) {
                const explanation = finalResponse || `Generating image for: "${parsedAction.freepik_prompt}"...`;
                await saveMessage(userId, currentChatId, 'ai', explanation);
                return NextResponse.json({
                    response: explanation,
                    action: 'generate_image',
                    freepik_prompt: parsedAction.freepik_prompt
                });
            }

            if (parsedAction.action === 'generate_video' && parsedAction.freepik_prompt) {
                const explanation = finalResponse || `Generating video for: "${parsedAction.freepik_prompt}"...`;
                await saveMessage(userId, currentChatId, 'ai', explanation);
                return NextResponse.json({
                    response: explanation,
                    action: 'generate_video',
                    freepik_prompt: parsedAction.freepik_prompt
                });
            }

            if (parsedAction.action === 'suggest_prompt' && parsedAction.promptId) {
                const explanation = finalResponse || `Recommended Template: ** ${parsedAction.title || parsedAction.promptId}** `;
                await saveMessage(userId, currentChatId, 'ai', explanation);
                return NextResponse.json({
                    response: explanation,
                    action: 'suggest_prompt',
                    promptId: parsedAction.promptId,
                    promptTitle: parsedAction.title,
                    reason: parsedAction.reason
                });
            }

            if (parsedAction.auto_memory && userId) {
                try {
                    const { store, forget, reason } = parsedAction.auto_memory;
                    if (store && Array.isArray(store)) {
                        for (const item of store) await saveMemory(userId, item.key, item.value, reason);
                    }
                    if (forget && Array.isArray(forget)) {
                        for (const key of forget) await forgetMemory(userId, key);
                    }
                } catch (e) {
                    console.error("[Chat API] Memory processing error:", e);
                }
            }
        }

        // 6. Save AI Response (Normal Text)
        await saveMessage(userId, currentChatId, 'ai', finalResponse);
        return NextResponse.json({ response: finalResponse });

    } catch (error) {
        console.error('[Chat API] Fatal Error:', error);
        const isProd = process.env.NODE_ENV === 'production';
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({
            error: 'Internal Server Error',
            response: `I encountered an issue: ${message}. Please try again later.`,
            debug: isProd ? undefined : (error instanceof Error ? error.stack : String(error))
        }, { status: 500 });
    }
}
