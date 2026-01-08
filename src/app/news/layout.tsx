import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'News & Stories | Xieriee',
    description: 'Curated high-quality video updates from top news, crime, AI, and podcast channels. Stay informed with Xieriee News.',
    openGraph: {
        title: 'News & Stories | Xieriee',
        description: 'Stay updated with curated high-quality news and stories from around the globe.',
        type: 'website',
        url: 'https://xieriee.ai/news',
        images: [
            {
                url: '/og-news.png',
                width: 1200,
                height: 630,
                alt: 'Xieriee News',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'News & Stories | Xieriee',
        description: 'Stay updated with curated high-quality news and stories from around the globe.',
        images: ['/og-news.png'],
    },
};

export default function NewsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
