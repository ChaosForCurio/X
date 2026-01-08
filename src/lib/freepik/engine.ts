import { IMAGE_MODELS, VIDEO_MODELS } from './config';
import { aiService } from '../ai';

import { ModelConfig, GenerationOptions, ModelType, FreepikApiResponse } from './types';
import { cache } from './cache';
import { rateLimiter } from './rate-limiter';

export class FreepikEngine {
    private apiKey: string;
    private bytezApiKey: string;

    constructor() {
        this.apiKey = process.env.FREEPIK_API_KEY || '';
        this.bytezApiKey = process.env.BYTEZ_API_KEY || '';
        if (!this.apiKey) {
            console.error('FREEPIK_API_KEY is missing!');
        }
        if (!this.bytezApiKey) {
            console.warn('BYTEZ_API_KEY is missing! Fallback will not work.');
        }
    }

    async generateImage(options: GenerationOptions): Promise<FreepikApiResponse> {
        try {
            return await this.handleGeneration('image', options);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Freepik image generation failed:', errorMessage);

            // 1. Try Bytez Fallback (Google Imagen 4)
            if (this.bytezApiKey) {
                // Attempting fallback to Bytez
                try {
                    return await this.generateWithBytez(options.prompt);
                } catch (bytezError: unknown) {
                    const bytezErrorMessage = bytezError instanceof Error ? bytezError.message : String(bytezError);
                    console.error('Bytez fallback failed:', bytezErrorMessage);
                    // Continue to next fallback
                }
            }



            // 2. Try Gemini Fallback (Imagen 3)
            // 2. Try Gemini Fallback (Imagen 3)
            try {
                const geminiImage = await aiService.generateImage(options.prompt, 'gemini');
                return {
                    data: {
                        generated: [{ url: geminiImage }]
                    }
                };
            } catch (geminiError: unknown) {
                const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
                console.error('Gemini fallback failed:', geminiErrorMessage);
            }

            throw error;
        }
    }

    async generateVideo(options: GenerationOptions): Promise<FreepikApiResponse> {
        // Special handling for Google Veo (Text-to-Video)

        let targetModelId = options.model;

        // If no model specified, pick the best one
        if (!targetModelId) {
            const videoModels = this.getPrioritizedModels('video');
            if (videoModels.length > 0) {
                targetModelId = videoModels[0].id;
            }
        }



        if (targetModelId === 'google-veo') {
            // Using Google Veo for Text-to-Video...
            return this.handleGeneration('video', options);
        }

        // Default behavior (Image-to-Video) for other models (e.g., kling)
        // 1. Generate Image First (Step 1)
        // 1. Generate Image First (Step 1)
        const imageResult: FreepikApiResponse = await this.generateImage({
            prompt: options.prompt,
            aspectRatio: '16:9', // Default for video
            urgent: true,
            model: 'mystic'
        });

        // Extract image URL correctly (handle both string and object formats)
        let imageUrl = '';
        if (imageResult.data?.generated && Array.isArray(imageResult.data.generated) && imageResult.data.generated.length > 0) {
            const item = imageResult.data.generated[0];
            imageUrl = typeof item === 'string' ? item : item.url;
        }

        if (!imageUrl) {
            console.error('[FreepikEngine] Image generation response:', JSON.stringify(imageResult, null, 2));
            throw new Error('Failed to generate base image for video');
        }
        // Base image generated

        // 2. Generate Video from Image (Step 2)
        // 2. Generate Video from Image (Step 2)
        return this.handleGeneration('video', {
            ...options,
            image: imageUrl, // Pass generated image as input
        });
    }

    private async generateWithBytez(prompt: string) {
        const modelId = 'google/imagen-4.0-fast-generate-001';
        const endpoint = `https://api.bytez.com/model/${modelId}`;



        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.bytezApiKey}`
                },
                body: JSON.stringify({ text: prompt })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Bytez API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();


            // Map Bytez response to Freepik format for compatibility
            let imageUrl = '';
            if (data.output && typeof data.output === 'string') {
                imageUrl = data.output;
            } else if (data.output && Array.isArray(data.output)) {
                imageUrl = data.output[0];
            } else if (data.generated_images && data.generated_images.length > 0) {
                imageUrl = data.generated_images[0];
            }

            if (!imageUrl) {
                // If we can't find a URL, just return the raw data and let the caller handle or fail
                console.warn('Could not extract image URL from Bytez response, returning raw data');
                return { data: { generated: [data] } };
            }

            return {
                data: {
                    generated: [{ url: imageUrl }]
                }
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Bytez generation failed:', errorMessage);
            throw new Error(`Bytez fallback failed: ${errorMessage}`);
        }
    }

    private async handleGeneration(type: ModelType, options: GenerationOptions): Promise<FreepikApiResponse> {
        // 1. Check Cache
        const cacheKey = cache.generateKey(type, options as unknown as Record<string, unknown>);
        const cached = cache.get(cacheKey);
        if (cached) {
            // Returning cached
            return cached;
        }

        const modelsRaw = this.getPrioritizedModels(type);
        let models = modelsRaw;

        // If a specific model is requested, filter to use only that model (or prioritize it?)
        // If we filter, we lose fallback. 
        // But for Veo, fallback to Kling is impossible without image.
        // So for now, strict filtering if model is provided is safer.
        if (options.model) {
            models = modelsRaw.filter(m => m.id === options.model);
            if (models.length === 0) {
                // Fallback: if specific model not found, maybe just warn and use all?
                console.warn(`[FreepikEngine] Requested model ${options.model} not found, using defaults.`);
                models = modelsRaw;
            }
        } else if (type === 'video' && !options.image) {
            // Heuristic: If video requested but no image, filter for text-to-video models only (Veo)
            // ensuring we don't try img2vid models which will crash
            models = modelsRaw.filter(m => m.id === 'google-veo');
        }

        let lastError = null;

        for (const model of models) {
            // 3. Check Rate Limits & Quota
            if (!rateLimiter.canMakeRequest(model.apiId, type === 'image' ? 5 : 2)) {
                console.warn(`[FreepikEngine] Skipping ${model.name} (Rate Limit/Quota)`);
                continue;
            }



            try {
                // 4. Execute API Call
                const result = await this.callApi(model, options);

                // 5. Cache Result
                cache.set(cacheKey, result, type === 'image' ? 24 * 3600 : 48 * 3600);

                return result;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[FreepikEngine] Error with ${model.name}:`, errorMessage);
                lastError = error instanceof Error ? error : new Error(errorMessage);
                // Continue to next model
            }
        }

        throw lastError || new Error(`All ${type} models failed or are exhausted.`);
    }

    private getPrioritizedModels(type: ModelType): ModelConfig[] {
        const allModels = type === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
        const now = new Date();
        const currentHour = now.getHours();

        // Sort by:
        // 1. Time slot match (for images)
        // 2. Priority (lower is better)
        // 3. Quota remaining (simulated via rate limiter for now)

        return allModels.sort((a, b) => {
            // Time slot check (only for images usually)
            const aMatch = a.timeSlot ? (currentHour >= a.timeSlot.start && currentHour < a.timeSlot.end) : false;
            const bMatch = b.timeSlot ? (currentHour >= b.timeSlot.start && currentHour < b.timeSlot.end) : false;

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;

            // Priority check
            const aPriority = a.priority ?? 99;
            const bPriority = b.priority ?? 99;
            return aPriority - bPriority;
        });
    }

    private async callApi(model: ModelConfig, options: GenerationOptions): Promise<FreepikApiResponse> {
        let endpoint = '';
        const body: Record<string, unknown> = { prompt: options.prompt };

        if (model.type === 'image') {
            endpoint = 'https://api.freepik.com/v1/ai/mystic';
            if (options.aspectRatio) {
                // Map common aspect ratios to Mystic's required format
                const ratioMap: Record<string, string> = {
                    '1:1': 'square_1_1',
                    '4:3': 'classic_4_3',
                    '3:4': 'traditional_3_4',
                    '16:9': 'widescreen_16_9',
                    '9:16': 'social_story_9_16',
                    '3:2': 'standard_3_2',
                    '2:3': 'portrait_2_3',
                    '5:4': 'social_5_4',
                    '4:5': 'social_post_4_5'
                };
                body.aspect_ratio = ratioMap[options.aspectRatio] || 'square_1_1';
            }
        } else {
            // Video Generation
            if (model.id === 'google-veo') {
                // Text-to-Video
                endpoint = `https://api.freepik.com/v1/ai/text-to-video`;
                // Body only needs prompt for text-to-video
            } else {
                // Image-to-Video
                // Use specific endpoint for the model, e.g., kling-v2
                endpoint = `https://api.freepik.com/v1/ai/image-to-video/${model.apiId}`;

                if (!options.image) {
                    // For non-Veo models, image is required
                    if (model.id !== 'google-veo') { // Safety check
                        throw new Error('Image URL is required for image-to-video generation');
                    }
                }
                if (options.image) {
                    body.image = options.image;
                }
            }
        }



        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-freepik-api-key': this.apiKey,
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Parse Rate Limits
        const limit = parseInt(response.headers.get('x-ratelimit-limit') || '0');
        const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
        const reset = parseInt(response.headers.get('x-ratelimit-reset') || '0');

        rateLimiter.update(model.apiId, limit, remaining, reset);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[FreepikEngine] API Error ${response.status}: ${errorText}`);
            let errorMessage = `API Error ${response.status}: ${errorText}`;

            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                }
                if (errorMessage.includes('limit of the free trial usage')) {
                    errorMessage = 'Daily free trial limit reached. Please upgrade your plan or try again tomorrow.';
                }
            } catch {
                // Failed to parse JSON, use raw text
            }

            throw new Error(errorMessage);
        }

        const data: FreepikApiResponse = await response.json();
        // Initial Response

        if (data.data?.task_id) {
            return this.pollTask(data.data.task_id, model.type, model.apiId);
        }

        return data;
    }

    private async pollTask(taskId: string, type: ModelType, modelId?: string) {
        // Reduced timeout to ~2 minutes (60 attempts * 2s) for better user experience
        const maxAttempts = type === 'image' ? 60 : 90; // Images: 2 min, Videos: 3 min
        const maxCreatedAttempts = 15; // Max 30 seconds in CREATED state before considering it stuck
        let createdCount = 0;
        let endpointUrl = '';

        if (type === 'image') {
            endpointUrl = `https://api.freepik.com/v1/ai/mystic/${taskId}`;
        } else {
            // Video polling
            if (modelId === 'google-veo') {
                endpointUrl = `https://api.freepik.com/v1/ai/text-to-video/tasks/${taskId}`;
            } else {
                endpointUrl = `https://api.freepik.com/v1/ai/image-to-video/tasks/${taskId}`;
            }
        }



        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 2000));

            try {
                const res = await fetch(endpointUrl, {
                    headers: { 'x-freepik-api-key': this.apiKey },
                    signal: AbortSignal.timeout(10000) // 10s timeout per request
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`[FreepikEngine] Polling Error ${res.status}: ${errorText}`);

                    // If 404 and it's early in polling, the task might not be ready yet
                    if (res.status === 404 && i < 5) {
                        console.warn(`[FreepikEngine] Task not found yet, retrying... (attempt ${i + 1})`);
                        continue;
                    }

                    // Parse error message from response
                    let errorMessage = `API returned ${res.status}`;
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch {
                        // Ignore JSON parse errors
                    }

                    throw new Error(`${errorMessage} (Status: ${res.status})`);
                }

                const data: FreepikApiResponse = await res.json();
                const status = data.data?.status;

                // Log progress every 5 attempts or when status changes
                if (i % 5 === 0 || status !== 'CREATED') {
                }

                if (status === 'COMPLETED') {
                    // Generation completed
                    return data;
                }

                if (status === 'FAILED') {
                    const errorMsg = data.data?.error || data.data?.message || 'Unknown error occurred';
                    console.error(`[FreepikEngine] ❌ Task failed: ${errorMsg}`);
                    throw new Error(`Generation failed: ${errorMsg}`);
                }

                // Track how long we've been in CREATED state
                if (status === 'CREATED') {
                    createdCount++;
                    if (createdCount >= maxCreatedAttempts) {
                        console.error(`[FreepikEngine] ⚠️ Task stuck in CREATED state for ${createdCount * 2}s`);
                        throw new Error('Task stuck in queue. The service may be overloaded. Please try again in a few moments.');
                    }
                } else {
                    // Reset counter if status changes from CREATED
                    createdCount = 0;
                }

                // Track PROCESSING state
                if (status === 'PROCESSING') {

                    if (i % 5 === 0) {

                    }
                } else if (status && status !== 'CREATED') {

                }

            } catch (error) {
                // Handle network errors
                if (error instanceof Error) {
                    if (error.name === 'AbortError' || error.message.includes('timeout')) {
                        console.error(`[FreepikEngine] Request timeout during polling (attempt ${i + 1})`);
                        if (i < 3) {
                            // Retrying after timeout...
                            continue;
                        }
                    }
                    if (error.message.includes('fetch') || error.message.includes('network')) {
                        console.error(`[FreepikEngine] Network error during polling:`, error.message);
                        if (i < 3) {
                            // Retrying after network error...
                            continue;
                        }
                    }
                }
                throw error;
            }
        }

        const totalMinutes = Math.round((maxAttempts * 2) / 60);
        console.error(`[FreepikEngine] ⏱️ Polling timed out after ${totalMinutes} minutes`);
        throw new Error(`Generation timed out after ${totalMinutes} minutes. Please try with a simpler prompt or try again later.`);
    }
}

export const freepikEngine = new FreepikEngine();
