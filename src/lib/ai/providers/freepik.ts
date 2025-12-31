import { AIProvider, AIContent } from '../types';

export class FreepikProvider implements AIProvider {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.FREEPIK_API_KEY;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async generateText(_prompt: string, _history?: AIContent[], _context?: string, _image?: string, _systemInstruction?: string): Promise<string> {
        throw new Error("Freepik provider does not support text generation.");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async analyzeImage(_base64Image: string, _prompt: string): Promise<string> {
        throw new Error("Freepik provider does not support image analysis.");
    }

    async generateImage(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error("Freepik API key is not configured.");
        }



        try {
            const response = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-freepik-api-key": this.apiKey
                },
                body: JSON.stringify({
                    prompt: prompt,
                    num_images: 1,
                    image: {
                        size: "square" // or "portrait", "landscape"
                    },
                    // styling: {
                    //     style: "photo"
                    // }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[FreepikProvider] API Error:", response.status, errorText);
                throw new Error(`Freepik API failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Expected response format: { data: [ { base64: "...", url: "..." } ] }
            // Adjust based on actual API response structure. 
            // Often it returns base64 or a URL. 
            // If it returns a URL, we might want to return it directly or fetch and convert to base64 if consistency is needed.
            // Let's assume it returns an object with a base64 string or url.

            const imageObj = data.data?.[0];
            const imageBase64 = imageObj?.base64;

            if (imageBase64) {
                return `data:image/png;base64,${imageBase64}`;
            }

            if (imageObj?.url) {
                return imageObj.url;
            }

            throw new Error("No image data received from Freepik.");

        } catch (error) {
            console.error("[FreepikProvider] Error generating image:", error);
            throw error;
        }
    }
}
