import Groq from "groq-sdk";
import { AIProvider, AIContent } from '../types';

export class GroqProvider implements AIProvider {
    private groq: Groq | null = null;

    private getClient(): Groq {
        if (!this.groq) {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) {
                console.warn("GROQ_API_KEY is not set.");
            }
            this.groq = new Groq({ apiKey: apiKey || 'dummy' });
        }
        return this.groq;
    }

    async generateText(prompt: string, history?: AIContent[], context?: string): Promise<string> {
        const client = this.getClient();
        if (!process.env.GROQ_API_KEY) throw new Error("Groq API key missing");

        const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = history?.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text || ""
        })) || [];

        let finalContent = prompt;
        if (context) {
            finalContent = `${context}\n\nUser Query: ${prompt}`;
        }

        messages.push({ role: 'user', content: finalContent });

        const completion = await client.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "";
    }

    async streamText(prompt: string, history?: AIContent[], context?: string): Promise<ReadableStream<string>> {
        const client = this.getClient();
        if (!process.env.GROQ_API_KEY) throw new Error("Groq API key missing");

        const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = history?.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text || ""
        })) || [];

        let finalContent = prompt;
        if (context) {
            finalContent = `${context}\n\nUser Query: ${prompt}`;
        }

        messages.push({ role: 'user', content: finalContent });

        const stream = await client.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
            stream: true,
        });

        return new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(content);
                    }
                }
                controller.close();
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async generateImage(_prompt: string): Promise<string> {
        throw new Error("Groq does not support image generation directly yet.");
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        // Use the specific key if available, otherwise fall back to the default client
        const imageGenKey = process.env.IMAGE_GEN_GROQ_API_KEY;
        let client = this.getClient();

        if (imageGenKey) {
            // Using specific IMAGE_GEN_GROQ_API_KEY
            client = new Groq({ apiKey: imageGenKey });
        } else if (process.env.GROQ_API_KEY) {
            // Using default GROQ_API_KEY
        }

        if (!process.env.GROQ_API_KEY && !imageGenKey) {
            console.error("[GroqProvider] No API Key found for Groq");
            throw new Error("Groq API key missing");
        }

        try {
            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    }
                ],
                model: "meta-llama/llama-4-scout-17b-16e-instruct", // Updated to the latest Llama 4 Scout Vision model
                temperature: 0.5,
                max_tokens: 1024,
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error: unknown) {
            console.error("[GroqProvider] Groq API Error Detailed:", JSON.stringify(error, null, 2));
            const err = error as { error?: { message?: string } };
            if (err?.error?.message) {
                throw new Error(`Groq API Error: ${err.error.message}`);
            }
            throw err;
        }
    }
}
