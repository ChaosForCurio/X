'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Code, Image as ImageIcon, Search, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface PredictiveOption {
    id: string;
    label: string;
    icon: any;
    action: () => void;
    // Removed gradient property as we are going monochrome
}

interface PredictiveActionsProps {
    lastMessageType: 'code' | 'text' | 'image' | 'error' | undefined;
    onAction: (actionId: string) => void;
    className?: string;
}

export default function PredictiveActions({
    lastMessageType,
    onAction,
    className
}: PredictiveActionsProps) {

    // Logic to determine suggestions based on context
    const getSuggestions = (): PredictiveOption[] => {
        if (lastMessageType === 'code') {
            return [
                { id: 'open_canvas', label: 'Open in Canvas', icon: Code, action: () => onAction('open_canvas') },
                { id: 'explain_code', label: 'Explain Code', icon: Search, action: () => onAction('explain_code') }
            ];
        }
        // Default generic suggestions
        return [
            { id: 'search_web', label: 'Search Web', icon: Search, action: () => onAction('search_web') },
            { id: 'generate_image', label: 'Generate Image', icon: ImageIcon, action: () => onAction('generate_image') },
            { id: 'create_post', label: 'Draft Post', icon: PenSquare, action: () => onAction('create_post') }
        ];
    };

    const suggestions = getSuggestions();

    return (
        <div className={cn("flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1", className)}>
            {suggestions.map((suggestion, index) => (
                <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={suggestion.action}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap group",
                        "bg-[#111] hover:bg-[#222] hover:border-white/10"
                    )}
                >
                    <suggestion.icon size={13} className="text-white/60 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors pr-1">
                        {suggestion.label}
                    </span>
                    <ArrowRight size={10} className="text-white/40 -ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
            ))}
        </div>
    );
}
