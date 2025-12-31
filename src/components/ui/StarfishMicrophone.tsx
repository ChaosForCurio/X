'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface StarfishMicrophoneProps {
    isRecording: boolean;
    onClick: () => void;
    disabled?: boolean;
    audioLevel?: number; // 0 to 100
}

export default function StarfishMicrophone({ isRecording, onClick, disabled, audioLevel = 0 }: StarfishMicrophoneProps) {
    // Map audio level to scale (min 1, max ~1.5)
    // Smoothing: if audioLevel is low but recording, keep a tiny "alive" breath
    const dynamicScale = useMemo(() => {
        if (!isRecording) return 1;
        // Base pulse (1.05) + Audio impact
        return 1.05 + (audioLevel / 200);
    }, [isRecording, audioLevel]);

    return (
        <div className="relative group">
            <motion.button
                onClick={onClick}
                disabled={disabled}
                animate={{ scale: dynamicScale }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10 w-14 h-14 flex items-center justify-center focus:outline-none"
            >
                {/* Starfish SVG Shape */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className={`w-full h-full drop-shadow-lg transition-colors duration-200 ${isRecording ? 'text-red-400' : 'text-orange-300 group-hover:text-orange-400'}`}
                    animate={isRecording ? { rotate: 360 } : { rotate: 0 }}
                    transition={isRecording ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                >
                    {/* Soft, rounded starfish shape */}
                    <path
                        d="M50 5 L63 35 L95 38 L73 60 L80 92 L50 78 L20 92 L27 60 L5 38 L37 35 Z"
                        fill="currentColor"
                        className="filter drop-shadow-md"
                        strokeLinejoin="round"
                        strokeWidth="8"
                        stroke="currentColor"
                    />
                </motion.svg>

                {/* Microphone Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                    <Mic size={20} className={`drop-shadow-md`} />
                </div>
            </motion.button>

            {/* Ripple Pulse Effect when Recording - Synced with Audio */}
            {isRecording && (
                <>
                    {/* Inner high-energy ring */}
                    <motion.div
                        animate={{
                            opacity: [0.6, 0],
                            scale: [1, 1.5 + (audioLevel / 100)]
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-500/40 rounded-full blur-md -z-10"
                    />

                    {/* Outer ambient ring */}
                    <motion.div
                        animate={{
                            opacity: [0.3, 0],
                            scale: [1.2, 2.2 + (audioLevel / 80)]
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: 0.1
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-orange-400/20 rounded-full blur-xl -z-20"
                    />
                </>
            )}
        </div>
    );
}
