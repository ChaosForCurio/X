import axios from 'axios';
/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load env vars

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const HANDLES = ['@NeuzBoyy', '@WrongedX', '@nikhil.kamath'];

async function fetchChannelId(handle: string) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: handle,
                type: 'channel',
                key: API_KEY,
            },
        });
        if (response.data.items && response.data.items.length > 0) {
            // console.log(`${handle}: ${response.data.items[0].id.channelId}`);
        } else {
            // console.log(`${handle}: Not found`);
        }
    } catch (error: unknown) {
        const err = error as any;
        console.error(`Error fetching ${handle}:`, err.response?.data?.error?.message || err.message);
    }
}

async function main() {
    if (!API_KEY) {
        console.error('No API Key found in .env.local');
        return;
    }
    // console.log('Fetching Channel IDs...');
    for (const handle of HANDLES) {
        await fetchChannelId(handle);
    }
}

main();
