'use client';

import React, { useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minus, Maximize2, Move } from 'lucide-react';
import { useVideoPlayer } from '@/context/VideoPlayerContext';

export default function DraggableVideoPlayer() {
    const { videoState, closeVideo, minimizeVideo, maximizeVideo } = useVideoPlayer();
    const { videoId, isPlaying, isMinimized } = videoState;
    const dragControls = useDragControls();
    const constraintsRef = useRef(null);

    // If no video is active, don't render anything
    if (!videoId || !isPlaying) return null;

    return (
        // Constraints container covering the entire viewport
        <div
            ref={constraintsRef}
            className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
        >
            <motion.div
                drag
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0.1}
                // Determine initial constraints based on window size
                dragConstraints={constraintsRef}
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    width: isMinimized ? 320 : 480, // Responsive sizing
                    height: isMinimized ? 180 : 270,
                }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`pointer-events-auto absolute bottom-4 right-4 bg-black/90 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col ${isMinimized ? 'w-80' : 'w-[480px] md:w-[600px]'}`}
                style={{
                    // Default starting position handled by CSS (bottom-4 right-4)
                    // Framer Motion handles the drag offset from there
                }}
            >
                {/* Header / Drag Handle */}
                <div
                    className="h-8 bg-white/5 flex items-center justify-between px-2 cursor-move group"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <div className="flex items-center gap-2 text-white/40 group-hover:text-white/80 transition-colors">
                        <Move size={12} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Video Player</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {isMinimized ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); maximizeVideo(); }}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                                title="Maximize"
                            >
                                <Maximize2 size={12} />
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); minimizeVideo(); }}
                                className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                                title="Minimize"
                            >
                                <Minus size={12} />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); closeVideo(); }}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-white/60 hover:text-red-400"
                            title="Close"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Video Content */}
                <div className="relative flex-1 bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                        className="w-full h-full absolute inset-0"
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />

                    {/* Overlay to catch clicks during drag (optional logic could serve this) */}
                    {/* <div className="absolute inset-0 bg-transparent" /> */}
                </div>
            </motion.div>
        </div>
    );
}
