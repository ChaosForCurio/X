import { GoogleGenAI } from "@google/genai";
import { setGlobalDispatcher, Agent } from 'undici';
import { AIProvider, AIContent } from '../types';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../../prompts';

// Fix for UND_ERR_CONNECT_TIMEOUT (force IPv4)
setGlobalDispatcher(new Agent({
    connect: {
        timeout: 60000,
        lookup: (hostname, options, callback) => {
            options.family = 4;
            import('dns').then(dns => dns.lookup(hostname, options, callback));
        }
    }
}));

export class GeminiProvider implements AIProvider {
    private ai: GoogleGenAI | null = null;

    private getClient(): GoogleGenAI {
        if (!this.ai) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("[GeminiProvider] GEMINI_API_KEY is missing!");
                throw new Error("GEMINI_API_KEY is not set in environment variables.");
            }
            // Client initialized
            this.ai = new GoogleGenAI({ apiKey });
        }
        return this.ai;
    }

    async generateText(prompt: string, history?: AIContent[], context?: string, image?: string, systemInstruction?: string): Promise<string> {
        const aiClient = this.getClient();
        const modelName = "gemini-1.5-flash"; // More stable model

        const attemptGeneration = async (model: string) => {
            let contents: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] = [];
            if (history && history.length > 0) {
                contents = history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: h.parts.map(p => ({
                        text: p.text,
                        inlineData: p.inlineData
                    }))
                }));
            }

            const finalPrompt = context ? `${context}\n\nUser Prompt: ${prompt}` : prompt;
            const userContent = { role: 'user', parts: [] as { text?: string; inlineData?: { mimeType: string; data: string } }[] };

            if (image) {
                // Validate image format (should be data:image/...;base64,...)
                if (!image.includes('base64,') || !image.startsWith('data:')) {
                    throw new Error('Invalid image format. Expected data URL with base64 encoding.');
                }

                const base64Data = image.split(',')[1];
                const mimeTypeMatch = image.match(/^data:(image\/[^;]+);base64,/);
                const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

                if (!base64Data) {
                    throw new Error('Failed to extract base64 data from image.');
                }

                // Processing image
                userContent.parts.push({ inlineData: { mimeType, data: base64Data } });
            }

            userContent.parts.push({ text: finalPrompt });
            contents.push(userContent);

            const config = {
                model,
                contents,
                systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            };

            const result = await aiClient.models.generateContent(config);
            return result.text || "";
        };

        try {
            return await attemptGeneration(modelName);
        } catch (error: unknown) {
            const err = error as { message?: string; status?: number };
            if (err.message?.includes('429') || err.status === 429 || err.status === 503) {
                console.warn("Gemini rate limited, falling back to pro");
                return await attemptGeneration("gemini-1.5-pro");
            }
            throw error;
        }
    }

    async streamText(prompt: string, history?: AIContent[], context?: string, image?: string, systemInstruction?: string): Promise<ReadableStream<string>> {
        const aiClient = this.getClient();
        const modelName = "gemini-1.5-flash";

        const attemptStreaming = async (model: string) => {
            let contents: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] = [];
            if (history && history.length > 0) {
                contents = history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: h.parts.map(p => ({
                        text: p.text,
                        inlineData: p.inlineData
                    }))
                }));
            }

            const finalPrompt = context ? `${context}\n\nUser Prompt: ${prompt}` : prompt;
            const userContent = { role: 'user', parts: [] as { text?: string; inlineData?: { mimeType: string; data: string } }[] };

            if (image) {
                const base64Data = image.split(',')[1];
                const mimeTypeMatch = image.match(/^data:(image\/[^;]+);base64,/);
                const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
                userContent.parts.push({ inlineData: { mimeType, data: base64Data } });
            }

            userContent.parts.push({ text: finalPrompt });
            contents.push(userContent);

            const config = {
                model,
                contents,
                systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            };

            const streamingResult = await aiClient.models.generateContentStream(config);

            return new ReadableStream({
                async start(controller) {
                    for await (const chunk of streamingResult) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(text);
                        }
                    }
                    controller.close();
                }
            });
        };

        try {
            return await attemptStreaming(modelName);
        } catch (error: unknown) {
            const err = error as { message?: string; status?: number };
            if (err.message?.includes('429') || err.status === 429 || err.status === 503) {
                return await attemptStreaming("gemini-1.5-pro");
            }
            throw error;
        }
    }

    async generateImage(prompt: string): Promise<string> {
        const aiClient = this.getClient();
        try {
            const response = await aiClient.models.generateImages({
                model: 'imagen-3.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1, aspectRatio: '1:1' }
            }) as unknown as {
                generatedImages?: { image: string | Buffer }[];
                images?: string[];
                data?: { images: string[] };
            };

            let image = response.generatedImages?.[0]?.image
                || response.images?.[0]
                || response.data?.images?.[0];

            if (Buffer.isBuffer(image)) {
                image = image.toString('base64');
            }

            if (!image) throw new Error('No image returned from Gemini');

            return typeof image === 'string' && image.startsWith('data:image') ? image : `data:image/png;base64,${image}`;
        } catch (error) {
            console.error('Gemini Image Generation Error:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        try {
            return await this.generateText(prompt, [], undefined, base64Image);
        } catch (error) {
            console.error("Gemini analyzeImage error:", error);
            if (error instanceof Error) {
                console.error("Gemini Error Message:", error.message);
                // Log additional details if available
                const errDetails = (error as { details?: unknown }).details || (error as { response?: { data?: unknown } }).response?.data;
                if (errDetails) console.error("Gemini Error Details:", JSON.stringify(errDetails, null, 2));
            }
            throw error;
        }
    }
}
