
import { NextResponse } from 'next/server';
import { performVideoSearch } from '@/lib/serper';

export async function POST(req: Request) {
    try {
        const { query, num } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // We call the library function. 
        // IMPORTANT: Since we are in an API route (Server Environment), 
        // performVideoSearch will execute its server-side logic using process.env.SERPER_API_KEY.
        const videos = await performVideoSearch(query, num || 6);

        return NextResponse.json(videos);
    } catch (error) {
        console.error('Error in video search API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
