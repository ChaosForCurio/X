export interface AIContent {
    role: 'user' | 'model' | 'assistant' | 'system';
    parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

export interface AIResponse {
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw?: any;
}

export interface AIProvider {
    generateText(prompt: string, history?: AIContent[], context?: string, image?: string, systemInstruction?: string): Promise<string>;
    streamText(prompt: string, history?: AIContent[], context?: string, image?: string, systemInstruction?: string): Promise<ReadableStream<string>>;
    generateImage(prompt: string): Promise<string>;
    analyzeImage(base64Image: string, prompt: string): Promise<string>;
}
