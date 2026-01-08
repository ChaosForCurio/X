'use client';

import React, { createContext, useContext, useState } from 'react';

interface VideoState {
    videoId: string | null;
    isPlaying: boolean;
    isMinimized: boolean;
    position: { x: number; y: number } | null; // Null means default position
}

interface VideoPlayerContextType {
    videoState: VideoState;
    playVideo: (videoId: string) => void;
    closeVideo: () => void;
    minimizeVideo: () => void;
    maximizeVideo: () => void;
    setVideoPosition: (pos: { x: number; y: number }) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
    const [videoState, setVideoState] = useState<VideoState>({
        videoId: null,
        isPlaying: false,
        isMinimized: false,
        position: null,
    });

    // Determine initial position based on window size (bottom right corner)
    // We'll let the component handle the actual pixel logic, but state can hold overrides

    const playVideo = (videoId: string) => {
        setVideoState(prev => ({
            ...prev,
            videoId,
            isPlaying: true,
            isMinimized: false, // Auto-maximize on new video
        }));
    };

    const closeVideo = () => {
        setVideoState(prev => ({
            ...prev,
            videoId: null,
            isPlaying: false,
            isMinimized: false,
            position: null, // Reset position on close
        }));
    };

    const minimizeVideo = () => {
        setVideoState(prev => ({
            ...prev,
            isMinimized: true,
        }));
    };

    const maximizeVideo = () => {
        setVideoState(prev => ({
            ...prev,
            isMinimized: false,
        }));
    };

    const setVideoPosition = (pos: { x: number; y: number }) => {
        setVideoState(prev => ({
            ...prev,
            position: pos,
        }));
    };

    return (
        <VideoPlayerContext.Provider
            value={{
                videoState,
                playVideo,
                closeVideo,
                minimizeVideo,
                maximizeVideo,
                setVideoPosition,
            }}
        >
            {children}
        </VideoPlayerContext.Provider>
    );
}

export const useVideoPlayer = () => {
    const context = useContext(VideoPlayerContext);
    if (!context) {
        throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
    }
    return context;
};
