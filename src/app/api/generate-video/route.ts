import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { isRateLimited } from '@/lib/db-actions';
import { freepikEngine } from '@/lib/freepik/engine';

export const maxDuration = 300; // 5 minutes - video generation takes longer

export async function POST(request: Request) {

    try {
        // 0. Auth & Rate Limit Check
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isLimited = await isRateLimited(user.id);
        if (isLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const { prompt, model, options } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Using Freepik for video generation
        const result = await freepikEngine.generateVideo({
            prompt,
            model: model || 'google-veo', // Default to Veo for text-to-video
            ...options
        });

        // Extract Video URL
        // Result structure from freepikEngine.pollTask: { data: { generated: [{ url: "..." }] } }
        const generatedItem = result.data?.generated?.[0];
        const videoUrl = typeof generatedItem === 'string'
            ? generatedItem
            : (generatedItem as { url: string })?.url;

        if (videoUrl) {
            return NextResponse.json({
                success: true,
                data: {
                    video: {
                        url: videoUrl,
                    },
                    provider: 'freepik',
                },
            });
        } else {
            console.error('No video URL in final response');
            return NextResponse.json({ error: 'No video URL returned from provider' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Video generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
