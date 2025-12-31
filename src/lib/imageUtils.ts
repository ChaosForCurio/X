import imageCompression from 'browser-image-compression';

export const compressImage = async (input: string | File, maxWidth = 1600, quality = 0.7): Promise<string> => {
    try {
        let file: File;

        // 1. Handle Input Type
        if (typeof input === 'string') {
            // Convert Base64 to File
            const res = await fetch(input);
            const blob = await res.blob();
            file = new File([blob], "image.jpg", { type: "image/jpeg" });
        } else {
            file = input;
        }

        // 2. Compress using Web Worker
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: maxWidth,
            useWebWorker: true,
            initialQuality: quality,
            fileType: 'image/jpeg'
        };

        const compressedFile = await imageCompression(file, options);

        // 3. Convert back to Base64
        return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
        console.error('Image compression error:', error);
        // Fallback: if input is string, return it; if file, try to read it
        if (typeof input === 'string') return input;
        return await imageCompression.getDataUrlFromFile(input);
    }
};
