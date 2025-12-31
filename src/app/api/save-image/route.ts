import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { isRateLimited } from '@/lib/db-actions';
import { db } from '@/db';
import { userImages } from '@/db/schema';

export async function POST(request: Request) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isLimited = await isRateLimited(user.id);
        if (isLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await request.json();
        const { imageUrl, publicId } = body;

        if (!imageUrl || !publicId) {
            return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
        }

        await db.insert(userImages).values({
            userId: user.id,
            imageUrl: imageUrl,
            publicId: publicId,
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Save Image Error:', error);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }
}
