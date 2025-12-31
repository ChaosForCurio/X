import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { stackServerApp } from '@/stack';

export async function POST() {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'community-feed';

        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: folder,
        }, apiSecret);

        return NextResponse.json({
            signature,
            timestamp,
            cloudName,
            apiKey,
            folder
        });
    } catch (error) {
        console.error('Sign Cloudinary Error:', error);
        return NextResponse.json({ error: 'Failed to sign request' }, { status: 500 });
    }
}
