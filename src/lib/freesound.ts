
export interface FreesoundSound {
    id: number;
    name: string;
    username: string;
    duration: number;
    created: string;
    tags: string[];
    previews: {
        'preview-hq-mp3': string;
        'preview-hq-ogg': string;
        'preview-lq-mp3': string;
        'preview-lq-ogg': string;
    };
    images: {
        'spectral_m': string;
        'spectral_l': string;
        'waveform_m': string;
        'waveform_l': string;
    };
    license: string;
    download: string;
}

interface FreesoundSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: FreesoundSound[];
}

const API_KEY = process.env.NEXT_PUBLIC_FREESOUND_API_KEY;
const BASE_URL = 'https://freesound.org/apiv2';

// Sound categories for variety
const SOUND_QUERIES = [
    'beats', 'ambient', 'electronic', 'synth', 'drums', 'bass', 'piano',
    'guitar', 'cinematic', 'lofi', 'chillhop', 'jazz', 'loop', 'fx', 'vocal'
];

export async function searchSounds(query: string = 'ambient', page: number = 1, pageSize: number = 100): Promise<FreesoundSound[]> {
    try {
        const fields = 'id,name,username,duration,created,tags,previews,images,license,download';
        const url = `${BASE_URL}/search/text/?query=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&fields=${fields}&token=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Freesound API error: ${response.statusText}`);
        }

        const data: FreesoundSearchResponse = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching sounds:', error);
        return [];
    }
}

// Fetch sounds from multiple categories for variety
export async function fetchDiverseSounds(count: number = 100): Promise<FreesoundSound[]> {
    const allSounds: FreesoundSound[] = [];
    const soundsPerCategory = Math.ceil(count / SOUND_QUERIES.length);

    for (const query of SOUND_QUERIES) {
        if (allSounds.length >= count) break;

        const sounds = await searchSounds(query, 1, soundsPerCategory);
        allSounds.push(...sounds);
    }

    // Shuffle and limit to requested count
    return allSounds.slice(0, count).sort(() => Math.random() - 0.5);
}
