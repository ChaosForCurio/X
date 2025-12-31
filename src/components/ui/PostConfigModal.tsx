'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Check, ChevronRight, ChevronLeft, Layout, User, Image, Video, Globe, Search, Link as LinkIcon, Hash } from 'lucide-react';

export interface PostConfig {
    goal: 'trending' | 'scrape' | 'manual';
    sourceValue?: string;
    platforms: string[];
    persona: string;
    tone: string;
    mediaType: 'image' | 'video' | 'none';
    visualStyle?: string;
    isThread: boolean;
}

interface PostConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: PostConfig) => void;
}

const STEPS = [
    { id: 'goal', title: 'Strategy', icon: Globe },
    { id: 'platform', title: 'Platfom', icon: Hash },
    { id: 'persona', title: 'Persona', icon: User },
    { id: 'media', title: 'Visuals', icon: Image },
];

const GOALS = [
    { id: 'trending', label: 'Research Trends', description: 'Find what\'s viral right now using Serper AI', icon: Search },
    { id: 'scrape', label: 'Import from URL', description: 'Transform a blog or news article into a post', icon: LinkIcon },
    { id: 'manual', label: 'Custom Topic', description: 'Write about a specific idea or announcement', icon: ChevronRight },
];

const PLATFORMS = [
    { id: 'linkedin', label: 'LinkedIn', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
    { id: 'x', label: 'X (Twitter)', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg' },
    { id: 'instagram', label: 'Instagram', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png' },
    { id: 'threads', label: 'Threads', icon: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Threads_%28app%29_logo.svg' },
];

const PERSONAS = [
    { id: 'expert', label: 'Thought Leader', description: 'Authoritative, niche-focused, and highly insightful' },
    { id: 'storyteller', label: 'Narrator', description: 'Personal, engaging stories with a lesson' },
    { id: 'news', label: 'Reporter', description: 'Objective, fast-paced, and strictly professional' },
    { id: 'creator', label: 'Influencer', description: 'Modern, high-energy, and trend-aware' },
];

const TONES = [
    { label: 'Professional', value: 'professional' },
    { label: 'Creative', value: 'creative' },
    { label: 'Provocative', value: 'provocative' },
    { label: 'Witty', value: 'witty' },
    { label: 'Minimalist', value: 'minimalist' },
];

export default function PostConfigModal({ isOpen, onClose, onGenerate }: PostConfigModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [config, setConfig] = useState<PostConfig>({
        goal: 'trending',
        platforms: ['linkedin'],
        persona: 'expert',
        tone: 'professional',
        mediaType: 'image',
        isThread: false,
    });

    if (!isOpen) return null;

    const nextStep = () => currentStep < STEPS.length - 1 && setCurrentStep(prev => prev + 1);
    const prevStep = () => currentStep > 0 && setCurrentStep(prev => prev - 1);

    const togglePlatform = (id: string) => {
        setConfig(prev => ({
            ...prev,
            platforms: prev.platforms.includes(id)
                ? prev.platforms.filter(p => p !== id)
                : [...prev.platforms, id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] w-full max-w-2xl min-h-[600px] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Post Configuration</h3>
                            <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">Step {currentStep + 1} of 4</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="flex px-8 py-4 bg-white/[0.02] border-b border-white/5">
                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const active = i === currentStep;
                        const completed = i < currentStep;
                        return (
                            <div key={step.id} className="flex-1 flex flex-col items-center gap-2 relative">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 z-10 
                                    ${active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50 text-white' :
                                        completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'}`}>
                                    {completed ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-white/20'}`}>
                                    {step.title}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[1px] bg-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: completed ? '100%' : '0%' }}
                                            className="h-full bg-indigo-500/30"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="flex-1 p-8 overflow-y-auto w-full custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xl font-bold text-white">Choose your post strategy</h4>
                                    <p className="text-white/40 text-sm">Select how you want to source your content today.</p>
                                    <div className="grid gap-3">
                                        {GOALS.map((goal) => {
                                            const Icon = goal.icon;
                                            return (
                                                <button
                                                    key={goal.id}
                                                    onClick={() => setConfig({ ...config, goal: goal.id as any })}
                                                    className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left group
                                                        ${config.goal === goal.id
                                                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xl'
                                                            : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    <div className={`p-3 rounded-xl transition-colors ${config.goal === goal.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{goal.label}</p>
                                                        <p className="text-xs text-white/40">{goal.description}</p>
                                                    </div>
                                                    {config.goal === goal.id && <Check className="ml-auto text-indigo-400" size={20} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {config.goal === 'scrape' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                            <input
                                                type="text"
                                                placeholder="Paste article URL here..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                                value={config.sourceValue || ''}
                                                onChange={(e) => setConfig({ ...config, sourceValue: e.target.value })}
                                            />
                                        </motion.div>
                                    )}
                                    {config.goal === 'manual' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                            <textarea
                                                placeholder="What should this post be about?"
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                                                value={config.sourceValue || ''}
                                                onChange={(e) => setConfig({ ...config, sourceValue: e.target.value })}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <h4 className="text-xl font-bold text-white">Select Destinations</h4>
                                    <p className="text-white/40 text-sm">Choose where you want to publish this content.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {PLATFORMS.map((platform) => (
                                            <button
                                                key={platform.id}
                                                onClick={() => togglePlatform(platform.id)}
                                                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all
                                                    ${config.platforms.includes(platform.id)
                                                        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xl'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                            >
                                                <img src={platform.icon} alt={platform.label} className={`w-10 h-10 object-contain transition-opacity ${config.platforms.includes(platform.id) ? 'opacity-100' : 'opacity-30'}`} />
                                                <span className={`text-sm font-bold ${config.platforms.includes(platform.id) ? 'text-white' : 'text-white/30'}`}>{platform.label}</span>
                                                {config.platforms.includes(platform.id) && (
                                                    <div className="absolute top-3 right-3 bg-indigo-500 p-0.5 rounded-full text-white">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {config.platforms.includes('x') && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-white">X Thread Mode</p>
                                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Generate 3-5 connected posts</p>
                                            </div>
                                            <button
                                                onClick={() => setConfig({ ...config, isThread: !config.isThread })}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${config.isThread ? 'bg-indigo-500' : 'bg-white/10'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: config.isThread ? 24 : 4 }}
                                                    className="w-4 h-4 bg-white rounded-full absolute top-1"
                                                />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2">Define your Persona</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {PERSONAS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setConfig({ ...config, persona: p.id })}
                                                    className={`p-4 rounded-2xl border text-left transition-all
                                                        ${config.persona === p.id
                                                            ? 'bg-indigo-500/10 border-indigo-500/40'
                                                            : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    <p className={`font-bold text-sm mb-1 ${config.persona === p.id ? 'text-indigo-300' : 'text-white'}`}>{p.label}</p>
                                                    <p className="text-[10px] text-white/30 leading-tight">{p.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Tone & Style</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {TONES.map(t => (
                                                <button
                                                    key={t.value}
                                                    onClick={() => setConfig({ ...config, tone: t.value })}
                                                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all
                                                        ${config.tone === t.value
                                                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                            : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h4 className="text-xl font-bold text-white">Visual Content</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'image', label: 'AI Image', icon: Image },
                                            { id: 'video', label: 'AI Video', icon: Video },
                                            { id: 'none', label: 'Text Only', icon: Send },
                                        ].map(m => {
                                            const Icon = m.icon;
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setConfig({ ...config, mediaType: m.id as any })}
                                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all text-center
                                                        ${config.mediaType === m.id
                                                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-xl'
                                                            : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                                >
                                                    <div className={`p-3 rounded-2xl transition-colors ${config.mediaType === m.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'}`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{m.label}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {config.mediaType !== 'none' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Visual Style</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Photorealistic', 'Digital Art', '3D Render', 'Minimalist', 'Abstract', 'Cinematic'].map(style => (
                                                    <button
                                                        key={style}
                                                        onClick={() => setConfig({ ...config, visualStyle: style })}
                                                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left
                                                            ${config.visualStyle === style
                                                                ? 'bg-white/10 border-white/20 text-white'
                                                                : 'bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40'}`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-between gap-4 bg-white/[0.01]">
                    <button
                        onClick={prevStep}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                            ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={nextStep}
                            disabled={currentStep === 0 && config.goal === 'scrape' && !config.sourceValue}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => onGenerate(config)}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
                        >
                            <Sparkles size={18} />
                            GENERATE STUDIO POST
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
