'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrendingTopic {
    title: string;
    query: string;
}

interface TrendingTopicsProps {
    onTopicClick: (query: string) => void;
}

export default function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTopics = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const url = forceRefresh ? '/api/trending?refresh=true' : '/api/trending';
            const res = await fetch(url);
            const data = await res.json();
            if (data.topics && data.topics.length > 0) {
                setTopics(data.topics);
            } else {
                setTopics([
                    { title: "Latest AI news", query: "@web latest AI developments" },
                    { title: "Tech trends 2025", query: "@web tech trends today" },
                    { title: "Global news today", query: "@web breaking news today" },
                    { title: "Best deals online", query: "best deals on electronics" },
                ]);
            }
        } catch (err) {
            console.error('Failed to fetch trending topics:', err);
            setError('Could not load trends');
            setTopics([
                { title: "Latest AI news", query: "@web latest AI developments" },
                { title: "Tech trends 2025", query: "@web tech trends today" },
                { title: "Shopping deals", query: "best online deals today" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    if (loading && topics.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 mt-8 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative">
                        <TrendingUp className="w-5 h-5 text-purple-400 animate-pulse" />
                        <div className="absolute inset-0 bg-purple-500/20 blur-lg animate-pulse" />
                    </div>
                    <span className="text-white/60 text-sm font-medium">Curating daily trends...</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="h-10 w-full rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/5 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-3xl mx-auto px-6 mt-6 mb-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg shadow-purple-900/20 border border-white/5 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                        <TrendingUp className="w-5 h-5 text-purple-300 drop-shadow-md" />
                        <Sparkles className="w-3 h-3 text-yellow-300 absolute top-1 right-1 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-white/90 text-sm font-bold tracking-wide block">
                            Trending Now
                        </span>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Real-time Insights</span>
                    </div>
                </div>
                <button
                    onClick={() => fetchTopics(true)}
                    className="p-2 rounded-full hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/10"
                    title="Refresh trends"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 text-white/30 group-hover:text-purple-300 transition-colors ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                </button>
            </div>

            {/* Error State */}
            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400/80 text-xs mb-3 bg-red-500/10 px-3 py-1.5 rounded-lg inline-block border border-red-500/20"
                >
                    {error}
                </motion.p>
            )}

            {/* Topics Grid - Premium Look */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                    {topics.map((topic, index) => (
                        <motion.button
                            key={topic.title}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTopicClick(topic.query)}
                            className="group relative flex items-start text-left gap-3 p-3 rounded-xl
                                bg-white/[0.03] backdrop-blur-md
                                border border-white/5 hover:border-purple-500/30
                                transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-purple-900/10
                                overflow-hidden h-full"
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500" />

                            {/* Search Icon / Context Icon */}
                            <div className="shrink-0 p-1.5 rounded-lg bg-white/5 text-white/30 group-hover:text-purple-300 group-hover:bg-purple-500/10 transition-colors border border-white/5 mt-0.5">
                                <Search className="w-3.5 h-3.5" />
                            </div>

                            <div className="flex-1 min-w-0 z-10">
                                <h4 className="text-sm font-medium text-white/70 group-hover:text-white transition-colors leading-tight mb-0.5 truncate">
                                    {topic.title}
                                </h4>
                                <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors truncate">
                                    {index < 2 ? '🔥 Viral Topic' : 'Top Search'}
                                </p>
                            </div>

                            {/* Chevron / Go Icon (Hidden until hover) */}
                            <div className="shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 self-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
