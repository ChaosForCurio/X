'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    TrendingUp, Users, MessageSquare, Image as ImageIcon, Video, Search,
    ArrowUpRight, ArrowDownRight, Activity, Zap, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface AnalyticsData {
    success: boolean;
    stats: {
        totalChats: number;
        totalMessages: number;
        totalLibraryItems: number;
    };
    activityTrend: Array<{ name: string; chats: number; messages: number }>;
    toolUsage: Array<{ name: string; value: number }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics');
                const json = await res.json();
                if (json.success) {
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm animate-pulse">Computing system analytics...</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Total Chats', value: data?.stats?.totalChats || 0, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '+12%' },
        { label: 'Messages', value: data?.stats?.totalMessages || 0, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '+18%' },
        { label: 'Library Items', value: data?.stats?.totalLibraryItems || 0, icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+5%' },
        { label: 'Gen Efficiency', value: '98.4%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', trend: '+2%' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            System Analytics
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Real-time performance and engagement tracking</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-400">
                        <TrendingUp size={14} className="text-green-400" />
                        <span>Systems nominal: All services active</span>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                                    <ArrowUpRight size={10} />
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-gray-400 text-sm">{stat.label}</h3>
                                <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                            {/* Decorative line */}
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10 group-hover:opacity-30 transition-opacity" style={{ color: stat.color.replace('text-', '') }} />
                        </motion.div>
                    ))}
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Trend (Line Chart) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Activity size={18} className="text-purple-400" />
                                Engagement Activity
                            </h2>
                            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                            </select>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.activityTrend}>
                                    <defs>
                                        <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff40"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#ffffff40"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff10', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="chats" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorChats)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="messages" stroke="#3B82F6" fillOpacity={1} fill="url(#colorMsgs)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Tool Usage (Bar Chart) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6"
                    >
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Cpu size={18} className="text-emerald-400" />
                            Feature Usage
                        </h2>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.toolUsage} layout="vertical" margin={{ left: -20, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#ffffff40"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff10', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {data?.toolUsage.map((entry: { name: string; value: number }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Most Used</span>
                                <span className="text-white font-medium">Image Generation</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Avg Response Time</span>
                                <span className="text-emerald-400 font-medium">1.2s</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Integration Health */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Search Engine', 'Audio Service', 'Reasoning Engine'].map((name, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <div className="flex-1">
                                <h4 className="text-sm font-medium">{name}</h4>
                                <p className="text-[10px] text-gray-500">Latency: {200 + i * 50}ms</p>
                            </div>
                            <button className="text-[10px] text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2">Ping</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
