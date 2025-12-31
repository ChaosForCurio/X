import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: string, folder: string) {
    // Check credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('[Cloudinary] Missing credentials. Check .env.local');
        return {
            status: 'error',
            message: 'Missing Cloudinary credentials in .env.local',
        };
    }

    // Log loaded credentials (masked)
    // Config loaded

    try {
        // Validate folder is provided and not empty
        if (!folder || folder.trim() === '') {
            throw new Error('Folder path is required. Images cannot go to root /home folder.');
        }

        // Uploading to folder

        // Upload to Cloudinary
        // file can be a local path, a remote URL, or a base64 data URI

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                // Upload attempt

                const result = await cloudinary.uploader.upload(file, {
                    folder: folder,
                    resource_type: 'auto',
                    fetch_format: 'auto',
                    quality: 'auto',
                    timeout: 120000,      // 2 minutes timeout
                    use_filename: true,
                    unique_filename: true,
                });

                return {
                    status: 'success',
                    cloudinary_url: result.secure_url,
                };
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[Cloudinary] Attempt ${attempts} failed:`, errorMessage);
                if (attempts === maxAttempts) {
                    throw error; // Throw on last attempt
                }
                // Wait 1s before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Should not reach here due to throw above, but for TS safety:
        return { status: 'error', message: 'Upload failed after max retries' };

    } catch (error: unknown) {
        console.error('[Cloudinary] Upload Error Details:', JSON.stringify(error, null, 2));
        // Handle different error structures
        interface CloudinaryError {
            message?: string;
            error?: {
                message?: string;
            };
        }
        const err = error as CloudinaryError;
        const message = err.message || err.error?.message || 'Cloudinary upload failed';
        return {
            status: 'error',
            message: message,
        };
    }
}

export async function uploadVideoToCloudinary(file: string | Buffer, folder: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('[Cloudinary] Missing credentials.');
        return { status: 'error', message: 'Missing Cloudinary credentials' };
    }

    try {
        // Uploading video

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(file as string, {
                folder: folder,
                resource_type: 'video', // Explicitly set for video
                fetch_format: 'auto',
                quality: 'auto',
                timeout: 300000, // 5 minutes timeout for videos
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const secureUrl = (result as any).secure_url;

        return {
            status: 'success',
            cloudinary_url: secureUrl,
        };

    } catch (error: unknown) {
        console.error('[Cloudinary] Video Upload Error:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Video upload failed',
        };
    }
}
