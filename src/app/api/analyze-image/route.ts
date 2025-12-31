import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image, prompt } = body;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const promptText = prompt || `Analyze this image in high detail. 
Provide a sophisticated and structured description that covers:
1. Main Subject: What is the primary focus?
2. Setting & Composition: Where is it, and how is it framed?
3. Lighting & Colors: Describe the mood, color palette, and light quality.
4. Style: Is it photorealistic, artistic, cinematic, etc.?

The final output should be a concise paragraph (max 40 words) that can serve as a high-quality prompt for generating a similar image.`;

        // Use Groq as primary for image analysis
        // AIService handles fallback to Gemini automatically if Groq fails
        const responseText = await aiService.analyzeImage(image, promptText, 'groq');
        return NextResponse.json({ response: responseText.trim() });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Image analysis error:', error);

        return NextResponse.json({
            error: 'Failed to analyze image',
            details: errorMessage,
            hint: 'Check if the image format is valid (data:image/...;base64,...)'
        }, { status: 500 });
    }
}
