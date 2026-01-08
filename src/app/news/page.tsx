'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchChannelVideos, Video } from '@/lib/youtube';
import { useSmoothScroll, smoothScrollTo } from '@/hooks/useSmoothScroll';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Calendar, User, ArrowLeft, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import NewsSkeleton from '@/components/ui/NewsSkeleton';

// Channel Configurations
const SECTIONS = [
    {
        title: 'Latest News',
        channels: [
            { name: 'Neon Man', id: 'UClgtRVHIGoF_LjfJTLPdiAg' }, // Neon Man ID
            { name: 'NeuzBoy', id: '@NeuzBoyy' }, // NeuzBoy Handle
        ],
    },
    {
        title: 'Crime',
        channels: [
            { name: 'Sr Pay', id: 'UCr-BYW60bAtDcNtz6AoiHZQ' }, // Sr Pay ID
            { name: 'Wronged', id: '@WrongedX' }, // Wronged Handle
        ],
    },
    {
        title: 'AI News',
        channels: [
            { name: 'Vaibhav Sisinty', id: 'UC-4iY7-F-z3N1sA3m_A97Gg' }, // Vaibhav Sisinty ID
            { name: 'CodeWithHarry', id: 'UCeVMnSShP_Iviwkknt83cww' }, // CodeWithHarry ID
        ],
    },
    {
        title: 'Podcast',
        channels: [
            { name: 'Nikhil Kamath', id: '@nikhil.kamath' }, // Nikhil Kamath Handle
        ],
    },
];

export default function NewsPage() {
    const router = useRouter();
    const [sectionVideos, setSectionVideos] = useState<{ [key: string]: Video[] }>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const mainPlayerRef = React.useRef<HTMLDivElement>(null);
    // Scroll button visibility state (mirrors chat panel behavior)
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [visibleCounts, setVisibleCounts] = useState<{ [key: string]: number }>({});

    // Listen to global main-content scroll
    useEffect(() => {
        const container = document.getElementById('main-content');
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 200;
            setShowScrollButton(!isAtBottom);
        };

        container.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const loadAllVideos = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            // Initial load is already true, no need to set it again to avoid effect warning
            // setLoading(true); 
        }

        const newSectionVideos: { [key: string]: Video[] } = {};
        let firstVideoFound: Video | null = null;

        // Helper to shuffle array
        const shuffleArray = (array: Video[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        for (const section of SECTIONS) {
            let videos: Video[] = [];
            for (const channel of section.channels) {
                // Fetch more videos (16) to allow for 'Load More' and randomization
                const fetchCount = 16;
                const channelVideos = await fetchChannelVideos(channel.name, fetchCount);
                videos = [...videos, ...channelVideos];
            }

            // Shuffle and store ALL videos, we will slice in the UI
            const shuffledVideos = shuffleArray(videos);
            newSectionVideos[section.title] = shuffledVideos;

            if (!firstVideoFound && shuffledVideos.length > 0) {
                firstVideoFound = shuffledVideos[0];
            }
        }

        setSectionVideos(newSectionVideos);

        // Initialize visible counts if not set
        const initialCounts: { [key: string]: number } = {};
        SECTIONS.forEach(s => {
            initialCounts[s.title] = 4;
        });
        setVisibleCounts(initialCounts);

        // Only set selected video if it's the initial load or if we want to reset it on refresh
        if (firstVideoFound && !isRefresh) {
            setSelectedVideo(firstVideoFound);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadAllVideos();
    }, [loadAllVideos]);

    const handleRefresh = () => {
        loadAllVideos(true);
    };

    const handleLoadMore = (sectionTitle: string) => {
        setVisibleCounts(prev => ({
            ...prev,
            [sectionTitle]: (prev[sectionTitle] || 4) + 4
        }));
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const container = document.getElementById('main-content');
        if (element && container) {
            smoothScrollTo(container, element, { duration: 1, offset: -80 });
        }
    };

    const handleVideoSelect = (video: Video) => {
        setSelectedVideo(video);
        const container = document.getElementById('main-content');
        if (container && mainPlayerRef.current) {
            smoothScrollTo(container, mainPlayerRef.current, { duration: 0.8, offset: -100 });
        }
    };

    return (
        <div className="flex flex-col bg-black text-white min-h-screen">
            {/* Header */}
            <div className="p-6 shrink-0 relative sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group z-10"
                            title="Back to Chat"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tight">
                                News & Stories
                            </h1>
                            <p className="text-gray-400 mt-1 font-medium text-sm">Curated high-quality updates from top channels.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className={`p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group z-10 flex items-center gap-2 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh Trends"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium text-gray-400 group-hover:text-white hidden md:block">
                            {refreshing ? 'Refreshing...' : 'Refresh Trends'}
                        </span>
                    </button>
                </div>

                <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-2 px-2 mask-fade-right">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.title}
                            onClick={() => scrollToSection(`section-${section.title}`)}
                            className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 text-sm font-medium whitespace-nowrap transition-all hover:scale-105 active:scale-95 text-gray-300 hover:text-white"
                        >
                            {section.title}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            const container = document.getElementById('main-content');
                            if (container) smoothScrollTo(container, 'top', { duration: 1.2 });
                        }}
                        className="px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-sm font-medium text-purple-300 whitespace-nowrap transition-all"
                    >
                        Back to Top
                    </button>
                </div>

                {/* Scroll-to-bottom button – appears when not at bottom */}
                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            onClick={() => {
                                const container = document.getElementById('main-content');
                                if (container) {
                                    smoothScrollTo(container, 'max', { duration: 1.2 });
                                }
                            }}
                            className="fixed bottom-24 sm:bottom-28 md:bottom-32 right-4 sm:right-6 md:right-8 p-2.5 sm:p-3 bg-white/10 backdrop-blur border border-white/10 text-white rounded-full shadow-lg z-50 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                            aria-label="Scroll to bottom"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>


            {/* Content Area */}
            <div className="flex-1">
                {loading ? (
                    <NewsSkeleton />
                ) : (
                    <div className="p-6 space-y-12 pb-20">
                        {/* Main Theater Player */}
                        <div ref={mainPlayerRef} className="w-full max-w-7xl mx-auto">
                            {selectedVideo ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 ring-1 ring-white/10 bg-black group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-50 pointer-events-none" />
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                                            title={selectedVideo.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="relative z-10"
                                        />
                                    </div>
                                    <div className="space-y-4 px-2">
                                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                            {selectedVideo.title}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-300">
                                                <User size={14} />
                                                <span className="font-semibold">{selectedVideo.channelTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar size={14} />
                                                <span>{new Date(selectedVideo.publishedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-gray-300 leading-relaxed text-sm max-w-4xl backdrop-blur-sm">
                                            {selectedVideo.description}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-gray-500 gap-4">
                                    <Play size={48} className="opacity-20" />
                                    <p>Select a video to start watching</p>
                                </div>
                            )}
                        </div>

                        {/* Video Lists */}
                        {SECTIONS.map((section, idx) => (
                            <div key={section.title} id={`section-${section.title}`} className="relative scroll-mt-32">
                                {/* Section Header */}
                                <div className="flex items-center gap-4 mb-6">

                                    <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                                    <h2 className="text-2xl font-bold text-white tracking-wide">
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {sectionVideos[section.title]?.slice(0, visibleCounts[section.title] || 4).map((video, index) => (
                                        <div
                                            key={`${video.id}-${index}`}
                                            className={`group relative bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 ${selectedVideo?.id === video.id
                                                ? 'border-purple-500/50 ring-1 ring-purple-500/50 bg-white/10'
                                                : 'border-white/5 hover:border-white/20'
                                                }`}
                                            onClick={() => handleVideoSelect(video)}
                                        >
                                            {/* Thumbnail Container */}
                                            <div className="relative aspect-video overflow-hidden">
                                                <Image
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                />
                                                {/* Overlay Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                                {/* Play Button Overlay */}
                                                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${selectedVideo?.id === video.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                    }`}>
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg transform group-hover:scale-110 transition-transform">
                                                        <Play size={20} className="text-white fill-white ml-1" />
                                                    </div>
                                                </div>

                                                {/* Duration Badge (Mock) */}
                                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-medium text-white border border-white/10">
                                                    Video
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4 relative">
                                                <h3 className={`font-semibold text-sm line-clamp-2 mb-3 transition-colors ${selectedVideo?.id === video.id ? 'text-purple-300' : 'text-gray-100 group-hover:text-purple-300'
                                                    }`}>
                                                    {video.title}
                                                </h3>

                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                    <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                                                        <User size={12} />
                                                        <span className="truncate max-w-[100px]">{video.channelTitle}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} />
                                                        <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {sectionVideos[section.title] && sectionVideos[section.title].length > (visibleCounts[section.title] || 4) && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={() => handleLoadMore(section.title)}
                                            className="px-8 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-semibold text-gray-300 hover:text-white flex items-center gap-2 group"
                                        >
                                            Load More {section.title}
                                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
