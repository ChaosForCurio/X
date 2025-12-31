'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Repeat2, Send, Globe, MoreHorizontal, ThumbsUp, Share2, AlertCircle, RefreshCw } from 'lucide-react';

interface LinkedInPreviewProps {
    content: string;
    imageUrl?: string;
    onClose: () => void;
    onPublish?: () => void;
    intent?: string;
}

const actionVariants = {
    hover: { scale: 1.05, backgroundColor: 'rgba(0, 0, 0, 0.05)' },
    tap: { scale: 0.95 }
};

const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function LinkedInPreview({ content, imageUrl, onClose, onPublish, intent }: LinkedInPreviewProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#f3f2ef] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20"
            >
                {/* Header - Glassmorphism style */}
                <div className="p-4 px-6 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0a66c2] flex items-center justify-center text-white font-bold text-lg">in</div>
                        <span className="font-bold text-gray-800 text-lg tracking-tight">Post Preview</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 text-gray-500 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        {/* Feed Card Header */}
                        <div className="p-4 flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0a66c2] to-[#00a0dc] p-0.5 shadow-md">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#0a66c2] font-bold text-xl overflow-hidden">
                                            AI
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-gray-900 leading-tight hover:text-[#0a66c2] cursor-pointer decoration-2">Xieriee AI Agent</h4>
                                        <span className="text-xs text-gray-400 font-medium">• 1st</span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-1">Expert Content Architect • Generative AI Strategist</p>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                        Just now • <Globe size={11} className="text-gray-400" />
                                    </p>
                                </div>
                            </div>
                            <button className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        {/* Content Section */}
                        <motion.div variants={contentVariants} className="px-4 pb-4 text-[13.5px] text-[#191919] whitespace-pre-wrap leading-[1.6] font-normal">
                            {content}
                        </motion.div>

                        {/* Image Section (Optional) */}
                        {imageUrl && (
                            <motion.div
                                variants={contentVariants}
                                className="relative mt-2 border-y border-gray-100 bg-gray-50 aspect-video flex items-center justify-center overflow-hidden"
                            >
                                <img
                                    src={imageUrl}
                                    alt="Post Visual"
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-lg text-white text-[10px] font-medium flex items-center gap-1">
                                    <AlertCircle size={12} /> AI Visual Content
                                </div>
                            </motion.div>
                        )}

                        {/* Reactions Bar */}
                        <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-1.5 group cursor-pointer">
                                <div className="flex -space-x-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white z-20">
                                        <ThumbsUp size={10} className="text-white fill-white" />
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white z-10">
                                        <Heart size={10} className="text-white fill-white" />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium hover:text-[#0a66c2] hover:underline">842 • 12 comments</span>
                            </div>
                            {intent && (
                                <div className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[#0a66c2] text-[10px] font-bold uppercase tracking-wider">
                                    {intent} Intent
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-2 py-1 flex justify-around">
                            {[
                                { icon: ThumbsUp, label: 'Like' },
                                { icon: MessageSquare, label: 'Comment' },
                                { icon: Repeat2, label: 'Repost' },
                                { icon: Share2, label: 'Send' }
                            ].map((action, idx) => (
                                <motion.button
                                    key={idx}
                                    variants={actionVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="flex-1 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group"
                                >
                                    <action.icon size={20} className="group-hover:text-[#0a66c2] transition-colors" />
                                    <span className="text-[12px] font-bold group-hover:text-[#0a66c2] transition-colors">{action.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Control Footer */}
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 px-6 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5 animate-spin-slow" />
                        Refine Post
                    </button>
                    <button
                        onClick={onPublish}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[#0a66c2] to-[#004182] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        Live Publish
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Add simple animation styles (can be placed in a global CSS or separate file)
const style = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
`;

