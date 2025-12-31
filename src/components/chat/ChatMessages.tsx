'use client';

import { motion } from 'framer-motion';
import { User } from '@stackframe/stack';
import MessageList from './MessageList';
import TrendingTopics from '../ui/TrendingTopics';
import { ChatMessage } from '@/context/AppContext';
import { RefObject } from 'react';

interface ChatMessagesProps {
    chatHistory: ChatMessage[];
    user: User | null;
    isLoading: boolean;
    isGeneratingImage: boolean;
    avatarMode: 'default' | 'searching' | 'creative';
    onDownload: (url: string) => void;
    onSuggestionClick: (suggestion: string) => void;
    onFillInput: (text: string) => void;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    onOpenCodeCanvas: (content: string, title?: string) => void;
    onFeedback: (messageId: string, type: 'up' | 'down') => void;

    // Empty State specific
    onTrendingClick: (query: string) => void;
}

export default function ChatMessages({
    chatHistory, user, isLoading, isGeneratingImage, avatarMode,
    onDownload, onSuggestionClick, onFillInput, messagesEndRef,
    onOpenCodeCanvas, onFeedback, onTrendingClick
}: ChatMessagesProps) {

    if (chatHistory.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center space-y-8 max-w-3xl w-full"
                >
                    {!user ? (
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/40 pb-2">
                                Unlock Creativity.
                            </h1>
                            <p className="text-lg text-white/40 font-light max-w-xl mx-auto leading-relaxed">
                                Join Xieriee to access premium AI tools, code generation, and visual design features.
                            </p>
                            <button
                                onClick={() => window.location.href = '/handler/sign-in'}
                                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1"
                            >
                                <span>Get Started</span>
                                <span className="block w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs group-hover:rotate-45 transition-transform duration-300">→</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="relative inline-block">
                                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-full opacity-50 animate-pulse-slow" />
                                <h1 className="relative text-4xl md:text-6xl font-bold text-white tracking-tight">
                                    Good {getTimeBasedGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">{user.displayName?.split(' ')[0] || 'Creator'}</span>
                                </h1>
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl text-white/40 font-light"
                            >
                                How can I assist you today?
                            </motion.p>
                        </div>
                    )}
                </motion.div>

                {/* Trending Topics */}
                {user && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-12 w-full max-w-4xl px-4"
                    >
                        <TrendingTopics onTopicClick={onTrendingClick} />
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-0 overflow-y-auto custom-scrollbar scroll-smooth">
            <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-8">
                <MessageList
                    chatHistory={chatHistory}
                    user={user}
                    isLoading={isLoading}
                    isGeneratingImage={isGeneratingImage}
                    avatarMode={avatarMode}
                    onDownload={onDownload}
                    onSuggestionClick={onSuggestionClick}
                    onFillInput={onFillInput}
                    messagesEndRef={messagesEndRef}
                    onOpenCodeCanvas={onOpenCodeCanvas}
                    onFeedback={onFeedback}
                />
            </div>
        </div>
    );
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
}
