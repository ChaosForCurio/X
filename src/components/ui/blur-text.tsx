'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlurTextProps {
    text: string;
    className?: string;
    variant?: {
        hidden: { filter: string; opacity: number; y: number };
        visible: { filter: string; opacity: number; y: number };
    };
    duration?: number;
}

export const BlurText = ({
    text,
    className,
    variant,
    duration = 0.8,
}: BlurTextProps) => {
    const defaultVariants = {
        hidden: { filter: 'blur(10px)', opacity: 0, y: 5 },
        visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
    };
    const combinedVariants = variant || defaultVariants;
    const words = text.split(' ');

    return (
        <span className={cn("inline-block", className)}>
            {words.map((word, idx) => (
                <motion.span
                    key={idx}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration, delay: idx * 0.02 }}
                    variants={combinedVariants}
                    className="inline-block"
                >
                    {word}
                    {idx < words.length - 1 ? '\u00A0' : ''}
                </motion.span>
            ))}
        </span>
    );
};
