import { GeminiProvider } from './providers/gemini';
import { GroqProvider } from './providers/groq';
import { FreepikProvider } from './providers/freepik';
import { AIContent, AIProvider } from './types';

export type AIProviderName = 'gemini' | 'groq' | 'freepik';

class AIService {
    private providers: Record<AIProviderName, AIProvider>;
    private defaultProvider: AIProviderName = 'gemini';

    constructor() {
        this.providers = {
            gemini: new GeminiProvider(),
            groq: new GroqProvider(),
            freepik: new FreepikProvider(),
        };
    }

    getProvider(name?: AIProviderName): AIProvider {
        return this.providers[name || this.defaultProvider];
    }

    async generateText(
        prompt: string,
        options?: {
            provider?: AIProviderName;
            history?: AIContent[];
            context?: string;
            image?: string;
            systemInstruction?: string;
        }
    ): Promise<string> {
        const provider = this.getProvider(options?.provider);
        return provider.generateText(prompt, options?.history, options?.context, options?.image, options?.systemInstruction);
    }

    async streamText(
        prompt: string,
        options?: {
            provider?: AIProviderName;
            history?: AIContent[];
            context?: string;
            image?: string;
            systemInstruction?: string;
        }
    ): Promise<ReadableStream<string>> {
        const provider = this.getProvider(options?.provider);
        return provider.streamText(prompt, options?.history, options?.context, options?.image, options?.systemInstruction);
    }

    async generateImage(prompt: string, providerName: AIProviderName = 'freepik'): Promise<string> {
        return this.getProvider(providerName).generateImage(prompt);
    }

    async analyzeImage(base64Image: string, prompt: string, providerName: AIProviderName = 'groq'): Promise<string> {

        // Default to Groq for image analysis as per previous logic, but fallback to Gemini if needed
        try {
            const result = await this.getProvider(providerName).analyzeImage(base64Image, prompt);

            return result;
        } catch (error) {
            console.warn(`[AIService] Provider ${providerName} failed analysis. Error:`, error);
            if (providerName === 'gemini') {
                // Gemini failed. Attempting fallback to Groq (LLaVA)...
                try {
                    const fallbackResult = await this.getProvider('groq').analyzeImage(base64Image, prompt);
                    // Fallback to Groq successful
                    return fallbackResult;
                } catch (fallbackError) {
                    console.error("[AIService] Fallback to Groq also failed.", fallbackError);
                    throw error; // Throw original Gemini error if both fail
                }
            } else if (providerName === 'groq') {
                // Groq failed. Attempting fallback to Gemini...
                try {
                    const fallbackResult = await this.getProvider('gemini').analyzeImage(base64Image, prompt);
                    // Fallback to Gemini successful
                    return fallbackResult;
                } catch (fallbackError) {
                    console.error("[AIService] Fallback to Gemini also failed.", fallbackError);
                    throw error; // Throw original Groq error if both fail
                }
            }

            throw error;
        }
    }
}

export const aiService = new AIService();
