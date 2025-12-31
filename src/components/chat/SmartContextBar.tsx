'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Code2, PenTool, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface SmartContextBarProps {
    isCodeCanvasOpen: boolean;
    isPostStudioOpen: boolean;
    isWebSearchActive: boolean;
}

export default function SmartContextBar({
    isCodeCanvasOpen,
    isPostStudioOpen,
    isWebSearchActive,
}: SmartContextBarProps) {
    let mode = '';
    let icon = null;
    let color = 'text-white/60';
    const bgColor = 'bg-white/5';
    const borderColor = 'border-white/10';

    if (isCodeCanvasOpen) {
        mode = 'Coding Workbench';
        icon = Code2;
        color = 'text-white';
    } else if (isPostStudioOpen) {
        mode = 'Social Studio';
        icon = PenTool;
        color = 'text-white';
    } else if (isWebSearchActive) {
        mode = 'Web Navigator';
        icon = Globe;
        color = 'text-white';
    } else {
        // General Intelligence mode - Show nothing as per request
        return null;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={mode}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 32 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full flex items-center justify-center relative bg-[#050505] border-b border-white/5 overflow-hidden"
            >
                <div className="flex items-center gap-2 relative z-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={cn("p-1 rounded-full", bgColor, borderColor, "border")}
                    >
                        {icon && <IconWrapper icon={icon} className={cn("w-3 h-3", color)} />}
                    </motion.div>
                    <span className={cn("text-[11px] font-medium tracking-wide uppercase", color)}>
                        {mode}
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Helper to render icon component dynamically
function IconWrapper({ icon: Icon, className }: { icon: any, className: string }) {
    return <Icon className={className} />;
}
