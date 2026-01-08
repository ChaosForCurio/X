'use client';

import React from 'react';
import { Play, Clock, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoPlayer } from '@/context/VideoPlayerContext';

export interface Video {
    id: string;
    title: string;
    link: string;
    thumbnail: string;
    channel: string;
    duration: string;
    date: string;
    imageUrl?: string;
    image?: string;
}

interface VideoFeedProps {
    videosJson: string;
    title?: string;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ videosJson, title: propTitle }) => {
    let videos: Video[] = [];
    let title = propTitle || "Related Videos";

    try {
        const parsed = JSON.parse(videosJson);

        if (Array.isArray(parsed)) {
            videos = parsed;
        } else if (parsed.videos) {
            videos = parsed.videos;
            if (parsed.title) title = parsed.title;
        }
    } catch (e) {
        console.error("Failed to parse videos JSON:", e);
        return null;
    }

    if (videos.length === 0) return null;

    return (
        <div className="my-6 w-full overflow-hidden bg-white/5 rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{title}</h3>
                </div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Live Integration</div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x px-2 scroll-smooth">
                {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
};

export const VideoCard: React.FC<{ video: Video }> = ({ video }) => {
    const { playVideo } = useVideoPlayer();

    return (
        <motion.div
            className="flex-shrink-0 w-[240px] snap-start group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div
                className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-white/10 to-transparent hover:border-red-500/40 transition-all duration-500 shadow-2xl group-hover:shadow-red-500/10 group-hover:-translate-y-1 cursor-pointer"
                onClick={() => playVideo(video.id)}
            >
                <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={video.thumbnail || video.imageUrl || video.image || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            // Fallback to high-quality thumbnail if the provided one fails
                            const target = e.target as HTMLImageElement;
                            if (video.id && target.src.includes('maxresdefault.jpg')) {
                                target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                            } else {
                                console.warn("Thumbnail failed to load");
                            }
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <motion.div
                            className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"
                        >
                            <Play size={24} className="text-white fill-white ml-1" />
                        </motion.div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {video.duration && (
                            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5 shadow-lg">
                                <Clock size={10} className="text-red-400" />
                                {video.duration}
                            </div>
                        )}
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {video.channel}
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                            {video.title}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                    <Calendar size={10} />
                    {video.date || 'Recent'}
                </div>
                <a
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink size={12} />
                </a>
            </div>
        </motion.div>
    );
};
