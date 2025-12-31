'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Toggle3DProps {
    type: 'menu' | 'panel';
    side?: 'left' | 'right';
    isOpen?: boolean;
    onClick: () => void;
}

const MenuIcon = ({ hovered }: { hovered: boolean }) => (
    <motion.div
        className="flex flex-col justify-between h-5 w-6"
        animate={{ rotate: hovered ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
        <motion.div
            className={`h-0.5 w-full rounded-full ${hovered ? 'bg-purple-500' : 'bg-white'}`}
            animate={{ y: hovered ? 2 : 0, rotate: hovered ? 45 : 0 }}
        />
        <motion.div
            className={`h-0.5 w-full rounded-full ${hovered ? 'bg-purple-500' : 'bg-white'}`}
            animate={{ opacity: hovered ? 0 : 1 }}
        />
        <motion.div
            className={`h-0.5 w-full rounded-full ${hovered ? 'bg-purple-500' : 'bg-white'}`}
            animate={{ y: hovered ? -2 : 0, rotate: hovered ? -45 : 0 }}
        />
    </motion.div>
);

const PanelIcon = ({ hovered, isRight }: { hovered: boolean; isRight: boolean }) => (
    <div className="relative w-6 h-5 flex items-center justify-center">
        {/* Main Window */}
        <motion.div
            className="absolute inset-0 border-2 border-white/80 rounded-sm"
            animate={{
                borderColor: hovered ? '#3b82f6' : 'rgba(255,255,255,0.8)',
                scale: hovered ? 1.05 : 1
            }}
        />
        {/* Sidebar Panel */}
        <motion.div
            className={`absolute top-0 bottom-0 w-2 bg-white/50 ${isRight ? 'right-0' : 'left-0'}`}
            animate={{
                backgroundColor: hovered ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                x: hovered ? (isRight ? 2 : -2) : 0
            }}
        />
    </div>
);

const CloseIcon = ({ hovered }: { hovered: boolean }) => (
    <motion.div
        className="relative w-6 h-6"
        initial={{ rotate: 0 }}
        animate={{ rotate: hovered ? 90 : 0 }}
    >
        <motion.div
            className={`absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 rounded-full ${hovered ? 'bg-red-500' : 'bg-white'}`}
            style={{ rotate: 45 }}
        />
        <motion.div
            className={`absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 rounded-full ${hovered ? 'bg-red-500' : 'bg-white'}`}
            style={{ rotate: -45 }}
        />
    </motion.div>
);

export default function Toggle3D({ type, side = 'right', isOpen = false, onClick }: Toggle3DProps) {
    const [hovered, setHovered] = useState(false);
    const isRight = side === 'right';

    return (
        <div
            className="w-10 h-10 flex items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            {isOpen ? (
                <CloseIcon hovered={hovered} />
            ) : (
                type === 'menu' ? <MenuIcon hovered={hovered} /> : <PanelIcon hovered={hovered} isRight={isRight} />
            )}
        </div>
    );
}
