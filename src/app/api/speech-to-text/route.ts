import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: Request) {
    try {
        if (!ELEVENLABS_API_KEY) {
            console.error('[Speech-to-Text] ElevenLabs API key not configured');
            return NextResponse.json(
                { error: 'ElevenLabs API key not configured' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as Blob;

        if (!audioFile) {
            console.error('[Speech-to-Text] No audio file in request');
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Received audio file

        // Validate audio file size (not empty and not too large)
        if (audioFile.size === 0) {
            console.error('[Speech-to-Text] Audio file is empty');
            return NextResponse.json(
                { error: 'Audio file is empty' },
                { status: 400 }
            );
        }

        if (audioFile.size > 25 * 1024 * 1024) { // 25MB limit
            console.error('[Speech-to-Text] Audio file too large:', audioFile.size);
            return NextResponse.json(
                { error: 'Audio file is too large (max 25MB)' },
                { status: 400 }
            );
        }

        // Create FormData for ElevenLabs API
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append('file', audioFile, 'recording.webm');
        elevenLabsFormData.append('model_id', 'scribe_v1');

        // Sending to ElevenLabs API...

        // Call ElevenLabs Speech-to-Text API
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: elevenLabsFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Speech-to-Text] ElevenLabs API error:', response.status, errorText);

            // Parse error message if possible
            let errorMessage = 'Transcription service error';
            try {
                const errorJson = JSON.parse(errorText);
                // Handle various ElevenLabs error formats
                if (typeof errorJson.detail === 'string') {
                    errorMessage = errorJson.detail;
                } else if (errorJson.detail?.message) {
                    errorMessage = errorJson.detail.message;
                } else if (errorJson.detail?.status) {
                    errorMessage = `${errorJson.detail.status}: ${JSON.stringify(errorJson.detail)}`;
                } else if (typeof errorJson.message === 'string') {
                    errorMessage = errorJson.message;
                } else if (errorJson.error) {
                    errorMessage = typeof errorJson.error === 'string'
                        ? errorJson.error
                        : JSON.stringify(errorJson.error);
                } else {
                    errorMessage = `ElevenLabs error (${response.status}): ${errorText.substring(0, 200)}`;
                }
            } catch {
                errorMessage = errorText || `Transcription failed with status ${response.status}`;
            }

            return NextResponse.json(
                {
                    error: errorMessage,
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const result = await response.json();
        // Transcription successful

        return NextResponse.json({
            text: result.text || '',
            language: result.language_code || 'unknown',
        });

    } catch (error) {
        console.error('[Speech-to-Text] Error:', error);
        return NextResponse.json(
            {
                error: 'Speech-to-text processing failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
