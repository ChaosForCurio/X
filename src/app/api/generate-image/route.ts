import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { isRateLimited } from '@/lib/db-actions';
import { db } from '@/db';
import { userImages } from '@/db/schema';
import { freepikEngine } from '@/lib/freepik/engine';

export const maxDuration = 180; // 3 minutes - enough for 2min polling + overhead

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

        const { prompt, image } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        let imageUrl: string | undefined;
        // eslint-disable-next-line prefer-const
        let provider = 'freepik';

        // 1. Use FreepikEngine
        // 1. Use FreepikEngine
        const result = await freepikEngine.generateImage({
            prompt,
            image,
            // urgent is optional and defaults to true in engine if not specified, 
            // strictly following engine types now
            urgent: true,
        });

        // Use flux if requested (placeholder for logic if needed, currently just logging or passing through)
        // Flux requested but Freepik engine is primary.

        // Extract Image URL
        const generatedItem = result.data?.generated?.[0];

        if (typeof generatedItem === 'string') {
            imageUrl = generatedItem;
        } else {
            // Check if base64 property exists safely or cast if we are sure of the type structure 
            // referencing typical Freepik response structure where it might be base64 or url
            const item = generatedItem as { base64?: string; url?: string };
            imageUrl = item?.base64
                ? `data:image/png;base64,${item.base64}`
                : item?.url;
        }

        if (imageUrl) {
            // 3. Save to Database
            try {
                await db.insert(userImages).values({
                    userId: user.id,
                    imageUrl: imageUrl,
                    publicId: `generated-${Date.now()}`,
                });
            } catch (dbError) {
                console.error('Failed to save generated image to DB:', dbError);
            }

            return NextResponse.json({
                success: true,
                data: {
                    image: {
                        url: imageUrl,
                    },
                    provider, // Include provider info so frontend knows which service was used
                },
            });
        } else {
            console.error('No image URL in final response');
            return NextResponse.json({ error: 'No image URL returned from any provider' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

