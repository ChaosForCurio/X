'use client';

import { motion } from 'framer-motion';
import { User } from '@stackframe/stack';
import MessageList from './MessageList';
import TrendingTopics from '../ui/TrendingTopics';
import { ChatMessage } from '@/context/AppContext';
import { RefObject, useEffect, memo } from 'react';
import { useSmoothScroll, smoothScrollTo } from '@/hooks/useSmoothScroll';

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

const ChatMessages = memo(({
    chatHistory, user, isLoading, isGeneratingImage, avatarMode,
    onDownload, onSuggestionClick, onFillInput, messagesEndRef,
    onOpenCodeCanvas, onFeedback, onTrendingClick
}: ChatMessagesProps) => {
    // Use GSAP smooth scroll hook for premium experience
    const scrollContainerRef = useSmoothScroll<HTMLDivElement>({
        duration: 0.5,
        ease: "power1.out",
        enabled: true,
        desktopOnly: true
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current && scrollContainerRef.current) {
            const scrollContainer = scrollContainerRef.current;
            const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 250;

            // Only auto-scroll if user is near bottom or it's the first message
            if (isNearBottom || chatHistory.length === 1) {
                smoothScrollTo(scrollContainer, 'max', {
                    duration: 0.8,
                    ease: "power2.inOut"
                });
            }
        }
    }, [chatHistory, messagesEndRef]);

    if (chatHistory.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 min-h-0 min-h-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center space-y-6 sm:space-y-8 max-w-3xl w-full"
                >
                    {!user ? (
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/40 pb-2">
                                Unlock Creativity.
                            </h1>
                            <p className="text-base sm:text-lg text-white/40 font-light max-w-xl mx-auto leading-relaxed px-4">
                                Join Xieriee to access premium AI tools, code generation, and visual design features.
                            </p>
                            <button
                                onClick={() => window.location.href = '/handler/sign-in'}
                                className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-semibold rounded-full hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1"
                            >
                                <span>Get Started</span>
                                <span className="block w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs group-hover:rotate-45 transition-transform duration-300">→</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="relative inline-block">
                                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-full opacity-50 animate-pulse-slow" />
                                <h1 className="relative text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight px-4">
                                    Good {getTimeBasedGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">{user.displayName?.split(' ')[0] || 'Creator'}</span>
                                </h1>
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg sm:text-xl text-white/40 font-light"
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
                        className="mt-8 sm:mt-12 w-full max-w-4xl px-3 sm:px-4"
                    >
                        <TrendingTopics onTopicClick={onTrendingClick} />
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div
            id="chat-scroll-container"
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
            style={{
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
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
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
}
