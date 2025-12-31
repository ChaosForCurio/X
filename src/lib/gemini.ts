import { GoogleGenAI } from "@google/genai";
import { setGlobalDispatcher, Agent } from 'undici';

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

let ai: GoogleGenAI | null = null;

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// Helper for retry logic with exponential backoff
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = (error as { status?: number })?.status;
    if (retries > 0 && (errorMessage?.includes('429') || errorStatus === 429 || errorStatus === 503 || errorMessage?.includes('404'))) {
      console.warn(`Gemini API rate limited/unavailable. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Define a compatible Content type since we are removing @google/generative-ai
export interface Content {
  role: string;
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

export interface GeminiImageResponse {
  generatedImages?: Array<{
    image: {
      toString: (encoding: string) => string;
    } | string;
  }>;
  images?: string[];
  data?: {
    images: string[];
  };
}

export interface GeminiContentResponse {
  text?: string;
}

export interface GeminiConfig {
  model: string;
  contents: Content[];
  systemInstruction?: string;
}

import { DEFAULT_SYSTEM_INSTRUCTION } from './prompts';

export async function generateImageWithGemini(prompt: string): Promise<string> {
  const aiClient = getAI();


  try {
    const response = await aiClient.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1', // Default to square
      }
    }) as unknown as GeminiImageResponse;

    // Handle various potential response structures
    let imageContent: string | undefined;
    const generatedImage = response.generatedImages?.[0]?.image;

    if (typeof generatedImage === 'string') {
      imageContent = generatedImage;
    } else if (generatedImage && typeof generatedImage === 'object') {
      // If it's the expected object with toString, use it
      if ('toString' in generatedImage && typeof generatedImage.toString === 'function') {
        try {
          imageContent = (generatedImage as Buffer).toString('base64');
        } catch {
          // If toString('base64') fails, try to see if it has a url property
          imageContent = (generatedImage as { url?: string; image?: string }).url || (generatedImage as { url?: string; image?: string }).image;
        }
      } else {
        imageContent = (generatedImage as { url?: string; image?: string }).url || (generatedImage as { url?: string; image?: string }).image;
      }
    }

    // Fallbacks
    const image = imageContent
      || response.images?.[0]
      || response.data?.images?.[0];

    if (!image || typeof image !== 'string') {
      // Try to log the response to see what we got if it fails
      console.error('Gemini Image Gen Response:', JSON.stringify(response, null, 2));
      throw new Error('No image returned from Gemini or image is not a string');
    }

    // If it's already a data URL or a hosted URL (http/https), return it.
    if (image.startsWith('data:image') || image.startsWith('http')) {
      return image;
    }
    return `data:image/png;base64,${image}`;

  } catch (error: unknown) {
    console.error('Gemini Image Generation Error:', error);
    throw error;
  }
}

export async function getGeminiResponse(prompt: string, image?: string, context?: string, history?: Content[], customSystemInstruction?: string) {
  const aiClient = getAI();

  // Internal function to attempt generation with a specific model
  const attemptGeneration = async (modelName: string) => {


    let contents: Content[] = [];

    // Handle history if provided
    if (history && history.length > 0) {
      contents = [...history];
    }

    const finalPrompt = context ? `${context}\n\nUser Prompt: ${prompt}` : prompt;

    const userContent: Content = {
      role: 'user',
      parts: []
    };

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      userContent.parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    userContent.parts.push({ text: finalPrompt });
    contents.push(userContent);

    const config: GeminiConfig = {
      model: modelName,
      contents: contents,
    };

    if (customSystemInstruction) {
      config.systemInstruction = customSystemInstruction;
    } else {
      // Default system instruction
      config.systemInstruction = DEFAULT_SYSTEM_INSTRUCTION;
    }

    // Calling Gemini API

    const result = await retryOperation(async () => {
      return await aiClient.models.generateContent(config as unknown as GeminiConfig) as GeminiContentResponse;
    });


    return result.text || "";
  };

  try {
    // Try with the new primary model
    return await attemptGeneration("gemini-1.5-flash");
  } catch (error: unknown) {
    // Check if it's a rate limit or overload error that persisted through retries
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = (error as { status?: number })?.status;

    if (errorMessage?.includes('429') || errorStatus === 429 || errorStatus === 503 || errorMessage?.includes('404')) {
      console.warn("Primary model overloaded or not found. Falling back to gemini-1.5-pro...");
      try {
        // Fallback to the pro model
        return await attemptGeneration("gemini-1.5-pro");
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError);
        throw fallbackError; // Throw the fallback error if both fail
      }
    }

    console.error("Error fetching Gemini response:", error);
    const err = error as Error;
    if (err.message?.includes("API key not valid")) {
      throw new Error("Invalid Gemini API Key. Please check your .env.local file.");
    }
    throw error;
  }
}