
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Trash2, Compass, Music, Video, Type, Image as ImageIcon, Play, Pause, Download } from 'lucide-react';
import Image from 'next/image';
import { useApp, type FeedItem } from '@/context/AppContext';
import Toggle3D from '../ui/Toggle3D';
import { useUser, User } from "@stackframe/stack";
import { AnimatedList } from '../ui/AnimatedList';

import { searchSounds, fetchDiverseSounds, FreesoundSound } from '@/lib/freesound';
import { fetchCodingPrompts, trackPromptUsage, CodingPrompt } from '@/lib/codingPrompts';
import { performVideoSearch, VideoSearchResult as SerperVideo } from '@/lib/serper';
import { LikeButton } from '../ui/LikeButton';
import { useVideoPlayer } from '@/context/VideoPlayerContext';

const FeedItemImage = ({ src, alt, onClick }: { src: string, alt: string, onClick: () => void }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div
                className="aspect-square relative overflow-hidden cursor-pointer bg-white/5 flex flex-col items-center justify-center text-white/20 gap-1"
                onClick={onClick}
            >
                <Sparkles size={20} className="opacity-50" />
                <span className="text-[10px]">Image unavailable</span>
            </div>
        );
    }

    return (
        <div
            className="aspect-square relative overflow-hidden cursor-pointer"
            onClick={onClick}
        >
            <Image
                src={src}
                alt={alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setHasError(true)}
                width={300}
                height={300}
            />
        </div>
    );
};

const FeedItem = ({
    item,
    currentUser,
    onPromptClick,
    onDelete,
    onLike
}: {
    item: FeedItem,
    currentUser: User | null,
    onPromptClick: (prompt: string) => void,
    onDelete: (id: string) => void,
    onLike: (id: string) => void
}) => {
    return (
        <div className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col mb-4 relative">
            {/* Image */}
            <FeedItemImage
                src={item.image}
                alt={item.prompt}
                onClick={() => onPromptClick(item.prompt)}
            />

            {/* Content */}
            <div className="p-3 flex flex-col gap-2.5">
                {/* Prompt - Always Visible */}
                <p
                    className="text-[11px] text-white/80 line-clamp-2 leading-relaxed h-[2.8em] group-hover:text-white transition-colors"
                    title={item.prompt}
                >
                    {item.prompt}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                        {item.avatar ? (
                            <Image
                                src={item.avatar}
                                alt={item.user || 'User'}
                                className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
                                width={20}
                                height={20}
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shrink-0">
                                <span className="text-[9px] text-white/70 font-medium">{item.user?.[0] || '?'}</span>
                            </div>
                        )}
                        <span className="text-[11px] font-medium text-white/50 truncate group-hover:text-white/70 transition-colors">{item.user}</span>

                        {/* Delete Button (Only for owner) */}
                        {currentUser && (currentUser.id === item.userId || currentUser.displayName === item.user) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this post?')) {
                                        onDelete(item.id);
                                    }
                                }}
                                className="ml-1 p-1 text-white/20 hover:text-red-400 transition-colors"
                                title="Delete post"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Like Button */}
                        <LikeButton
                            isLiked={currentUser ? (item.likedBy?.includes(currentUser.id) || false) : false}
                            likeCount={item.likes}
                            onLike={(e) => {
                                e.stopPropagation();
                                onLike(item.id);
                            }}
                            size={16}
                        />

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPromptClick(item.prompt);
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-purple-500 hover:text-white text-white/60 text-[10px] font-semibold rounded-full transition-all duration-300 shrink-0 backdrop-blur-md border border-white/5 hover:border-purple-500/50"
                        >
                            USE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function RightSidebar() {
    const { setInputPrompt, toggleRightSidebar, communityFeed, deleteFeedItem, likeFeedItem } = useApp();
    const { playVideo, videoState } = useVideoPlayer();
    const user = useUser();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'images' | 'audio' | 'video' | 'text'>('images');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Audio Feed State
    const [audioFeed, setAudioFeed] = useState<FreesoundSound[]>([]);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [activeAudioId, setActiveAudioId] = useState<number | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioPage, setAudioPage] = useState(1);
    const [isLoadingMoreAudio, setIsLoadingMoreAudio] = useState(false);
    const [hasMoreAudio, setHasMoreAudio] = useState(true);

    // Text/Coding Prompts Feed State
    const [textFeed, setTextFeed] = useState<CodingPrompt[]>([]);
    const [isLoadingText, setIsLoadingText] = useState(false);
    const [textPage, setTextPage] = useState(1);
    const [isLoadingMoreText, setIsLoadingMoreText] = useState(false);
    const [hasMoreText, setHasMoreText] = useState(true);

    // Video Feed State
    const [videoFeed, setVideoFeed] = useState<SerperVideo[]>([]);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);

    // Infinite scroll refs
    const textScrollRef = useRef<HTMLDivElement>(null);
    const audioScrollRef = useRef<HTMLDivElement>(null);

    // Fetches sounds when audio category is activated
    const handleCategoryChange = (category: 'images' | 'audio' | 'video' | 'text') => {
        setActiveCategory(category);
        setIsExploreOpen(false);

        if (category === 'audio' && audioFeed.length === 0) {
            setIsLoadingAudio(true);
            fetchDiverseSounds(100).then(sounds => {
                setAudioFeed(sounds);
                setIsLoadingAudio(false);
                setHasMoreAudio(sounds.length >= 100);
            });
        }

        if (category === 'text' && textFeed.length === 0) {
            setIsLoadingText(true);
            fetchCodingPrompts(1, 10).then(response => {
                setTextFeed(response.prompts);
                setIsLoadingText(false);
                setHasMoreText(response.pagination.hasMore);
            });
        }

        if (category === 'video' && videoFeed.length === 0) {
            setIsLoadingVideo(true);
            // Dynamic query based on what's trending or common
            performVideoSearch('trending tech AI reviews').then(videos => {
                setVideoFeed(videos);
                setIsLoadingVideo(false);
            });
        }
    };

    // Load more text prompts
    const loadMoreTextPrompts = useCallback(async () => {
        if (isLoadingMoreText || !hasMoreText) return;

        setIsLoadingMoreText(true);
        const nextPage = textPage + 1;

        try {
            const response = await fetchCodingPrompts(nextPage, 10);
            setTextFeed(prev => [...prev, ...response.prompts]);
            setTextPage(nextPage);
            setHasMoreText(response.pagination.hasMore);
        } catch (error) {
            console.error('Error loading more prompts:', error);
        } finally {
            setIsLoadingMoreText(false);
        }
    }, [isLoadingMoreText, hasMoreText, textPage]);

    // Load more audio
    const loadMoreAudio = useCallback(async () => {
        if (isLoadingMoreAudio || !hasMoreAudio) return;

        setIsLoadingMoreAudio(true);
        const nextPage = audioPage + 1;

        try {
            const sounds = await searchSounds('beats', nextPage);
            if (sounds.length > 0) {
                setAudioFeed(prev => [...prev, ...sounds]);
                setAudioPage(nextPage);
                setHasMoreAudio(sounds.length >= 15);
            } else {
                setHasMoreAudio(false);
            }
        } catch (error) {
            console.error('Error loading more audio:', error);
        } finally {
            setIsLoadingMoreAudio(false);
        }
    }, [isLoadingMoreAudio, hasMoreAudio, audioPage]);

    // Infinite scroll observer for text feed
    useEffect(() => {
        if (activeCategory !== 'text' || !textScrollRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreText && !isLoadingMoreText) {
                    loadMoreTextPrompts();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(textScrollRef.current);
        return () => observer.disconnect();
    }, [activeCategory, hasMoreText, isLoadingMoreText, textPage, loadMoreTextPrompts]);

    // Infinite scroll observer for audio feed
    useEffect(() => {
        if (activeCategory !== 'audio' || !audioScrollRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreAudio && !isLoadingMoreAudio) {
                    loadMoreAudio();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(audioScrollRef.current);
        return () => observer.disconnect();
    }, [activeCategory, hasMoreAudio, isLoadingMoreAudio, audioPage, loadMoreAudio]);

    const handleTogglePlay = (sound: FreesoundSound) => {
        if (activeAudioId === sound.id) {
            if (audioRef.current) {
                audioRef.current.pause();
                setActiveAudioId(null);
                setAudioProgress(0);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }

            // Try to find a supported source, prioritizing HQ MP3
            const source = sound.previews['preview-hq-mp3'] ||
                sound.previews['preview-hq-ogg'] ||
                sound.previews['preview-lq-mp3'] ||
                sound.previews['preview-lq-ogg'];

            if (!source) {
                console.error('No supported audio source found for sound:', sound.name);
                return;
            }

            const audio = new Audio(source);
            audioRef.current = audio;

            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    setAudioProgress((audio.currentTime / audio.duration) * 100);
                }
            });

            audio.addEventListener('ended', () => {
                setActiveAudioId(null);
                setAudioProgress(0);
            });

            audio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                console.error('Audio error code:', audio.error?.code);
                console.error('Audio error message:', audio.error?.message);
            });

            audio.play().catch(error => {
                console.error("Audio play failed:", error);
                // Auto-pause if play fails
                setActiveAudioId(null);
            });

            setActiveAudioId(sound.id);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExploreOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



    // Ensure latest images are on top (sort by createdAt descending)
    const sortedFeed = React.useMemo(() => {
        return [...communityFeed].sort((a, b) => {
            // Handle various date formats (Firestore Timestamp, Date object, string, or null)
            const getDate = (item: FeedItem) => {
                if (!item.createdAt) return 0;

                // Check if it's a Firestore Timestamp (has seconds property)
                const createdAt = item.createdAt;
                if (typeof createdAt === 'object' && 'seconds' in createdAt) {
                    return (createdAt as { seconds: number }).seconds * 1000;
                }

                return new Date(createdAt).getTime();
            };
            return getDate(b) - getDate(a);
        });
    }, [communityFeed]);

    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-l border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between z-20">
                <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsExploreOpen(!isExploreOpen)}
                        className={`p-1.5 rounded-full transition-colors ${isExploreOpen ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10 text-white/60'}`}
                        title="Explore"
                    >
                        <Compass size={18} />
                    </button>

                    {/* Filter Dropdown */}
                    {isExploreOpen && (
                        <div className="absolute right-full top-0 mr-2 w-40 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-1 space-y-0.5">
                                <div className="p-1 space-y-0.5">
                                    <button
                                        onClick={() => handleCategoryChange('images')}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === 'images' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <ImageIcon size={14} />
                                        Images
                                    </button>
                                    <button
                                        onClick={() => handleCategoryChange('audio')}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === 'audio' ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Music size={14} />
                                        Audio
                                    </button>
                                    <button
                                        onClick={() => handleCategoryChange('video')}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === 'video' ? 'bg-green-500/20 text-green-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Video size={14} />
                                        Video
                                    </button>
                                    <button
                                        onClick={() => handleCategoryChange('text')}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeCategory === 'text' ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Type size={14} />
                                        Text
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        {activeCategory === 'images' && "Community Feed"}
                        {activeCategory === 'audio' && "Audio Feed"}
                        {activeCategory === 'video' && "Video Feed"}
                        {activeCategory === 'text' && "Text Feed"}
                    </h2>
                </div>
                <div className="hover:bg-white/10 rounded-lg transition-colors">
                    <div className="hidden lg:block">
                        <Toggle3D type="panel" isOpen={true} onClick={toggleRightSidebar} />
                    </div>
                    <button
                        onClick={toggleRightSidebar}
                        className="lg:hidden w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors text-xl"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-2 custom-scrollbar"
            >
                <div className="min-h-full">
                    {/* Images View */}
                    {activeCategory === 'images' && (
                        sortedFeed.length > 0 ? (
                            <AnimatedList>
                                {sortedFeed.map((item) => (
                                    <FeedItem
                                        key={item.id}
                                        item={item}
                                        currentUser={user}
                                        onPromptClick={setInputPrompt}
                                        onDelete={deleteFeedItem}
                                        onLike={likeFeedItem}
                                    />
                                ))}
                            </AnimatedList>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 mt-20">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                                    <Sparkles size={20} className="text-purple-400/50" />
                                </div>
                                <p className="text-sm font-medium text-gray-400">Community Feed</p>
                                <p className="text-xs mt-1">Share your creations with the world</p>
                            </div>
                        )
                    )}

                    {activeCategory === 'audio' && (
                        <div className="space-y-3 pb-20">
                            {isLoadingAudio ? (
                                <div className="flex flex-col items-center justify-center p-8 text-white/40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mb-2"></div>
                                    <span className="text-xs">Loading sounds...</span>
                                </div>
                            ) : audioFeed.length > 0 ? (
                                <>
                                    <AnimatedList>
                                        {audioFeed.map((sound) => (
                                            <div key={sound.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all group">
                                                <div className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleTogglePlay(sound)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${activeAudioId === sound.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                        >
                                                            {activeAudioId === sound.id ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-white truncate" title={sound.name}>{sound.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-white/50 truncate max-w-[80px]">{sound.username}</span>
                                                                <span className="text-[10px] text-white/30">•</span>
                                                                <span className="text-[10px] text-white/50">{Math.round(sound.duration)}s</span>
                                                            </div>
                                                        </div>

                                                        <a
                                                            href={sound.download}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-white/40 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Download from Freesound"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>

                                                    {/* Waveform Visualization */}
                                                    <div className="mt-3 relative h-12 w-full bg-black/20 rounded overflow-hidden group/wave cursor-pointer" onClick={() => handleTogglePlay(sound)}>
                                                        <Image
                                                            src={sound.images.waveform_m}
                                                            alt="waveform"
                                                            fill
                                                            className="opacity-60 object-cover mix-blend-screen group-hover/wave:opacity-80 transition-opacity"
                                                            unoptimized
                                                        />
                                                        {activeAudioId === sound.id && (
                                                            <div
                                                                className="absolute inset-y-0 left-0 bg-purple-500/20 border-r border-purple-500/50 transition-[width] duration-100 ease-linear pointer-events-none"
                                                                style={{ width: `${audioProgress}% ` }}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {sound.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </AnimatedList>

                                    {/* Infinite scroll trigger for audio */}
                                    {hasMoreAudio && (
                                        <div ref={audioScrollRef} className="py-4 flex justify-center">
                                            {isLoadingMoreAudio ? (
                                                <div className="flex items-center gap-2 text-white/40">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400/50"></div>
                                                    <span className="text-xs">Loading more...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-white/20">Scroll for more</span>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-20 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                                        <Music size={32} className="text-blue-400 opacity-80" />
                                    </div>
                                    <h3 className="text-white font-medium mb-1">No sounds found</h3>
                                    <p className="text-white/40 text-xs max-w-[200px]">
                                        Try refreshing or checking back later.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeCategory === 'video' && (
                        <div className="space-y-4 pb-20">
                            {isLoadingVideo ? (
                                <div className="flex flex-col items-center justify-center p-8 text-white/40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400/50 mb-2"></div>
                                    <span className="text-xs">Searching YouTube...</span>
                                </div>
                            ) : videoFeed.length > 0 ? (
                                <AnimatedList>
                                    {videoFeed.map((video, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-green-400/30 transition-all group mb-4">
                                            {/* Thumbnail */}
                                            <div className="aspect-video relative overflow-hidden bg-black/50 group-video cursor-pointer"
                                                onClick={() => {
                                                    // Extract video ID from link
                                                    const url = new URL(video.link);
                                                    const v = url.searchParams.get('v');
                                                    if (v) playVideo(v);
                                                    else window.open(video.link, '_blank');
                                                }}
                                            >
                                                <Image
                                                    src={video.imageUrl}
                                                    alt={video.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] rounded font-medium">
                                                    {video.duration}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                        <Play size={20} fill="currentColor" className="ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-2.5">
                                                <h4 className="text-[11px] font-medium text-white line-clamp-2 leading-tight mb-1 group-hover:text-green-300 transition-colors">
                                                    {video.title}
                                                </h4>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[9px] text-white/50 truncate font-medium">{video.channel}</span>
                                                    </div>
                                                    <span className="text-[9px] text-white/30 shrink-0">{video.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </AnimatedList>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-20">
                                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                                        <Video size={32} className="text-green-400 opacity-80" />
                                    </div>
                                    <h3 className="text-white font-medium mb-1">No videos found</h3>
                                    <p className="text-white/40 text-xs max-w-[200px]">
                                        Try searching for a different topic.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Text View - Coding Prompts */}
                    {activeCategory === 'text' && (
                        <div className="space-y-3 pb-20">
                            {isLoadingText ? (
                                <div className="flex flex-col items-center justify-center p-8 text-white/40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400/50 mb-2"></div>
                                    <span className="text-xs">Loading coding prompts...</span>
                                </div>
                            ) : textFeed.length > 0 ? (
                                <>
                                    <AnimatedList>
                                        {textFeed.map((prompt) => (
                                            <div key={prompt.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-orange-400/30 transition-all group mb-3">
                                                <div className="p-3">
                                                    {/* Title */}
                                                    <h4 className="text-sm font-medium text-white mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors">
                                                        {prompt.title}
                                                    </h4>

                                                    {/* Prompt Text */}
                                                    <p className="text-[11px] text-white/60 leading-relaxed line-clamp-3 mb-3">
                                                        {prompt.prompt}
                                                    </p>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {prompt.tags.map(tag => (
                                                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400/80 border border-orange-500/20">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                                                            {prompt.category}
                                                        </span>

                                                        <button
                                                            onClick={() => {
                                                                setInputPrompt(prompt.prompt);
                                                                trackPromptUsage(prompt.id);
                                                            }}
                                                            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-[10px] font-medium rounded-full transition-colors flex items-center gap-1"
                                                        >
                                                            <Sparkles size={10} />
                                                            USE
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </AnimatedList>

                                    {/* Infinite scroll trigger for text */}
                                    {hasMoreText && (
                                        <div ref={textScrollRef} className="py-4 flex justify-center">
                                            {isLoadingMoreText ? (
                                                <div className="flex items-center gap-2 text-white/40">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400/50"></div>
                                                    <span className="text-xs">Loading more...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-white/20">Scroll for more</span>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 mt-20 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20">
                                        <Type size={32} className="text-orange-400 opacity-80" />
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Coding Prompts</h3>
                                    <p className="text-white/40 text-xs max-w-[200px]">
                                        No prompts found. Try refreshing later.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
