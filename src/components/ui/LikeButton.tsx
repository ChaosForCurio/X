import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
    isLiked: boolean;
    likeCount: number;
    onLike: (e: React.MouseEvent) => void;
    size?: number;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
    isLiked,
    likeCount,
    onLike,
    size = 18
}) => {
    return (
        <button
            onClick={onLike}
            className="group/like flex items-center gap-1.5 relative focus:outline-none"
        >
            <div className="relative flex items-center justify-center">
                <motion.div
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Heart
                        size={size}
                        className={`transition-colors duration-300 ${isLiked
                                ? 'fill-red-500 text-red-500'
                                : 'text-white/60 group-hover/like:text-red-400'
                            }`}
                    />
                </motion.div>

                <AnimatePresence>
                    {isLiked && (
                        <>
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full border border-red-500"
                            />
                            <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 1.2, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 bg-red-500/20 rounded-full"
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>

            <motion.span
                key={likeCount}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`text-[10px] font-medium transition-colors ${isLiked ? 'text-red-400' : 'text-white/60 group-hover/like:text-red-300'
                    }`}
            >
                {likeCount}
            </motion.span>
        </button>
    );
};
