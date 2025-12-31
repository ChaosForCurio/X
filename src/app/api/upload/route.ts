import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { stackServerApp } from '@/stack';
import { isRateLimited } from '@/lib/db-actions';
import { db } from '@/db';
import { userImages } from '@/db/schema';

// Security: limit acceptable file types and sizes for uploads
const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif', // optional, keep if your UI needs GIFs
]);

// 10 MB max for user uploads (tune as needed)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const maxDuration = 300; // 5 minutes timeout for uploads

export async function POST(request: Request) {
  try {
    // Request received

    // 0. Auth & Rate Limit Check
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isLimited = await isRateLimited(user.id);
    if (isLimited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 1. Verify Environment Variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Upload API Error: Missing Cloudinary credentials');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Cloudinary credentials' },
        { status: 500 }
      );
    }

    // Configure Cloudinary explicitly for this request
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // 2. Parse Form Data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('Upload API Error: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2a. Validate file size
    if (file.size <= 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `File too large. Max ${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB` }, { status: 413 });
    }

    // 2b. Validate MIME type (reject SVG to prevent XSS/vector issues)
    const mimeType = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      console.warn('Upload API: Disallowed MIME type', mimeType);
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    // Processing file

    // 3. Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to Cloudinary
    // 4. Upload to Cloudinary

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'community-feed',
          // Security: restrict to image resource type
          resource_type: 'image',
          timeout: 600000, // 10 minutes connection timeout
        },
        (error, result) => {
          if (error) {
            console.error('Upload API: Cloudinary error:', error);
            reject(error);
          } else {
            if (result) {
              // Upload success
              resolve(result);
            } else {
              reject(new Error("Cloudinary upload failed: No result returned"));
            }
          }
        }
      );

      // Handle stream errors specifically
      uploadStream.on('error', (err) => {
        console.error('Upload API: Stream error:', err);
        reject(err);
      });

      try {
        uploadStream.end(buffer);
      } catch (streamError) {
        console.error('Upload API: Stream write error:', streamError);
        reject(streamError);
      }
    });

    // 5. Save to Database
    await db.insert(userImages).values({
      userId: user.id,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (error: unknown) {
    console.error('Upload API: Fatal Error:', error);

    // specific check for Cloudinary errors which might be objects
    let errorDetails = 'Unknown server error';
    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (typeof error === 'object') {
      try {
        errorDetails = JSON.stringify(error);
      } catch {
        errorDetails = 'Circular or unstringifiable error object';
      }
    } else {
      errorDetails = String(error);
    }

    const errorResponse = {
      error: 'Upload failed',
      details: errorDetails,
      code: 500
    };



    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}
