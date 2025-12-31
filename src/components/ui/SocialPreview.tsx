'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Heart, MessageSquare, Repeat2, Send, Globe, MoreHorizontal,
    ThumbsUp, Share2, AlertCircle, RefreshCw, Twitter, Instagram,
    Linkedin, Check, Edit2, Save, Type, Eye, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialPreviewProps {
    content: string;
    imageUrl?: string;
    onClose: () => void;
    onPublish?: (finalContent: string) => void;
    intent?: string;
}

type Platform = 'linkedin' | 'x' | 'instagram';

const actionVariants = {
    hover: { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    tap: { scale: 0.95 }
};

const platformVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

const interactionHover = {
    scale: 1.1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 10 }
};

const premiumButton = {
    rest: { scale: 1 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98 }
};

export default function SocialPreview({ content, imageUrl, onClose, onPublish, intent }: SocialPreviewProps) {
    const [platform, setPlatform] = useState<Platform>('linkedin');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const [isRefining, setIsRefining] = useState(false);

    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    const handlePublish = () => {
        // 1. Copy to clipboard
        navigator.clipboard.writeText(editedContent || content);
        toast.success("Content copied! Opening platform...", {
            description: "Paste your post to publish."
        });

        // 2. Open Platform URL
        let url = '';
        const text = encodeURIComponent(editedContent || content);

        if (platform === 'linkedin') {
            url = `https://www.linkedin.com/feed/`; // LinkedIn API doesn't support text pre-fill on web
        } else if (platform === 'x') {
            url = `https://twitter.com/compose/tweet?text=${text}`;
        } else if (platform === 'instagram') {
            url = `https://www.instagram.com/`; // Instagram web is limited
        }

        if (url) {
            window.open(url, '_blank');
            if (onClose) onClose();
        }
    };

    const renderPlatformIcon = (p: Platform) => {
        switch (p) {
            case 'linkedin': return <Linkedin size={18} className="text-[#0a66c2]" />;
            case 'x': return <Twitter size={18} className="text-white" />;
            case 'instagram': return <Instagram size={18} className="text-[#e4405f]" />;
        }
    };

    // --- PLATFORM RENDERERS ---

    const LinkedInLayout = () => (
        <motion.div
            key="linkedin"
            variants={platformVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-900"
        >
            <div className="p-4 flex items-start justify-between">
                <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#0a66c2] flex items-center justify-center text-white font-bold text-xl">in</div>
                    <div>
                        <h4 className="font-bold text-sm leading-tight text-gray-900">Xieriee AI Agent</h4>
                        <p className="text-xs text-gray-500">Multimodal Strategic Content Lead</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">Just now • <Globe size={10} /></p>
                    </div>
                </div>
                <MoreHorizontal size={18} className="text-gray-400" />
            </div>

            <div className="px-4 pb-3 text-[13px] leading-relaxed whitespace-pre-wrap">
                {isEditing ? (
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full bg-gray-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-[#0a66c2] min-h-[150px] text-gray-800 text-[13px]"
                    />
                ) : editedContent}
            </div>

            {imageUrl && (
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    <img src={imageUrl} alt="Social" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-3 px-4 border-t border-gray-100 flex justify-around">
                {[
                    { icon: ThumbsUp, label: 'Like' },
                    { icon: MessageSquare, label: 'Comment' },
                    { icon: Repeat2, label: 'Repost' },
                    { icon: Send, label: 'Send' }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.1, color: '#0a66c2' }}
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1 text-gray-500 cursor-pointer p-1 rounded-lg transition-colors"
                    >
                        <item.icon size={18} />
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    const TwitterLayout = () => (
        <motion.div
            key="x"
            variants={platformVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-black rounded-2xl border border-white/10 overflow-hidden text-white"
        >
            <div className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center font-bold border border-white/10">X</div>
                <div className="flex-1">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-sm">Xieriee AI</span>
                        <span className="text-gray-500 text-sm">@xieriee_ai • 1s</span>
                    </div>
                    <div className="mt-2 text-[14px] leading-snug whitespace-pre-wrap">
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-400 min-h-[120px] text-white text-[14px]"
                            />
                        ) : editedContent}
                    </div>
                    {imageUrl && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 relative">
                            <img src={imageUrl} alt="Tweet" className="w-full object-cover max-h-[400px]" />
                        </div>
                    )}
                    <div className="mt-4 flex justify-between text-gray-500 max-w-sm">
                        {[MessageSquare, Repeat2, Heart, Share2].map((Icon, i) => (
                            <motion.div
                                key={i}
                                whileHover={i === 2 ? { scale: 1.2, color: '#f91880' } : { scale: 1.2, color: '#1d9bf0' }}
                                whileTap={{ scale: 0.9 }}
                                className="cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors"
                            >
                                <Icon size={18} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const InstagramLayout = () => (
        <motion.div
            key="instagram"
            variants={platformVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-[450px] mx-auto text-black"
        >
            <div className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] font-bold">X</div>
                </div>
                <span className="font-semibold text-xs text-black">xieriee_studio</span>
                <MoreHorizontal size={16} className="ml-auto text-gray-500" />
            </div>

            {imageUrl ? (
                <div className="aspect-square bg-gray-50">
                    <img src={imageUrl} alt="Insta" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300">
                    <AlertCircle size={48} />
                </div>
            )}

            <div className="p-3">
                <div className="flex gap-4 mb-3">
                    {[Heart, MessageSquare, Send].map((Icon, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="cursor-pointer"
                        >
                            <Icon size={22} className="text-black" />
                        </motion.div>
                    ))}
                    <Instagram size={22} className="ml-auto text-black" />
                </div>
                <div className="text-[13px] leading-tight">
                    <span className="font-bold mr-2 text-black">xieriee_studio</span>
                    {isEditing ? (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-pink-500 min-h-[100px] text-gray-800 text-[13px]"
                        />
                    ) : (
                        <span className="text-gray-800 whitespace-pre-wrap">{editedContent}</span>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 uppercase">1 SECOND AGO</p>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="relative bg-[#0d0d0d]/80 border border-white/10 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[90vh] md:h-[80vh] backdrop-blur-3xl"
            >
                {/* Left Sidebar: Controls & Branding */}
                <div className="w-full md:w-80 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Eye size={22} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Studio Preview</h2>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 hover:bg-white/10 rounded-full text-white/50"><X size={20} /></button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Platform Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Select Destination</label>
                            <div className="grid grid-cols-1 gap-2">
                                {(['linkedin', 'x', 'instagram'] as Platform[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPlatform(p)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${platform === p
                                            ? 'bg-white/10 border-white/20 shadow-xl'
                                            : 'border-transparent hover:bg-white/5 text-white/40 hover:text-white'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl ${platform === p ? 'bg-white/10' : 'bg-transparent'}`}>
                                            {renderPlatformIcon(p)}
                                        </div>
                                        <span className={`text-sm font-semibold capitalize ${platform === p ? 'text-white' : 'text-inherit'}`}>
                                            {p}
                                        </span>
                                        {platform === p && (
                                            <motion.div
                                                layoutId="activePlatform"
                                                className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor Toggle */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Actions</label>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isEditing
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                                    <span className="text-sm font-semibold">{isEditing ? 'Save Changes' : 'Edit Post Text'}</span>
                                </div>
                                {isEditing && <Check size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                        <motion.button
                            variants={premiumButton}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={onClose}
                            className="w-full py-4 px-6 border border-white/10 text-white/60 font-bold rounded-2xl hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefining ? 'animate-spin' : ''}`} />
                            Refine AI Logic
                        </motion.button>
                        <motion.button
                            variants={premiumButton}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handlePublish}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-3 group"
                        >
                            <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Open {platform === 'x' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </motion.button>
                    </div>
                </div>

                {/* Right Area: Interactive Preview Panel */}
                <div className="flex-1 bg-black/20 flex flex-col relative overflow-hidden">
                    {/* Visual Background Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="flex items-center justify-between p-6 z-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Live Visualizer</span>
                        </div>
                        <button onClick={onClose} className="hidden md:flex p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar">
                        <div className="w-full max-w-[500px]">
                            <AnimatePresence mode="wait">
                                {platform === 'linkedin' && <LinkedInLayout />}
                                {platform === 'x' && <TwitterLayout />}
                                {platform === 'instagram' && <InstagramLayout />}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between z-10 px-8">
                        <div className="flex items-center gap-4 text-white/30 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <Type size={12} />
                                <span>{editedContent.length} chars</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <AlertCircle size={12} />
                                <span>{intent || 'General'} Intent</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-[10px] text-white/20 font-mono">XIERIEE CORE 2.0</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </motion.div>
    );
}
