'use client';

import React, { useMemo, useState } from 'react';
import {
    MessageSquare, Plus, Settings, Trash2, Library,
    Newspaper, Plug, Search, Edit2, Check, X,
    TrendingUp, Sparkles, type LucideIcon
} from 'lucide-react';
import { useApp, type SavedChat } from '@/context/AppContext';
import { useUser, UserButton } from "@stackframe/stack";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Utility: Date Grouping ---
const groupChatsByDate = (chats: SavedChat[]) => {
    const groups: { [key: string]: SavedChat[] } = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = new Date(today - 86400000).getTime();
    const lastWeek = new Date(today - 86400000 * 7).getTime();

    chats.forEach(chat => {
        const chatDate = new Date(chat.date).getTime();
        if (isNaN(chatDate)) {
            groups['Older'].push(chat);
            return;
        }

        if (chatDate >= today) groups['Today'].push(chat);
        else if (chatDate >= yesterday) groups['Yesterday'].push(chat);
        else if (chatDate >= lastWeek) groups['Previous 7 Days'].push(chat);
        else groups['Older'].push(chat);
    });

    return groups;
};

export default function LeftSidebar() {
    const {
        toggleLeftSidebar, savedChats, startNewChat,
        loadChat, deleteChat, renameChat, toggleUploadModal,
        currentChatId, toggleConnectorsModal, connectedApps
    } = useApp();

    const user = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const groupedChats = useMemo(() => {
        const filtered = savedChats.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return groupChatsByDate(filtered);
    }, [savedChats, searchQuery]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505]/80 backdrop-blur-2xl border-r border-white/5 relative z-50">

            {/* --- Premium Header --- */}
            <div className="p-4 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles size={16} className="text-white fill-white/20" />
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">Xieriee</span>
                    </div>
                    <div className="lg:hidden">
                        <button onClick={toggleLeftSidebar} className="p-2 text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <button
                    onClick={startNewChat}
                    className="w-full group relative flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 active:scale-[0.98]"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* --- Search --- */}
            <div className="px-4 pb-2">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all"
                    />
                </div>
            </div>

            {/* --- Chat List --- */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6 custom-scrollbar">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    {Object.entries(groupedChats).map(([group, chats]) => {
                        if (chats.length === 0) return null;
                        return (
                            <div key={group} className="mb-6">
                                <h3 className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 sticky top-0 backdrop-blur-md z-10 py-1">
                                    {group}
                                </h3>
                                <div className="space-y-1">
                                    {chats.map(chat => {
                                        const isActive = chat.id === currentChatId;
                                        return (
                                            <motion.div key={chat.id} variants={itemVariants} className="px-2">
                                                {editingId === chat.id ? (
                                                    <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg border border-purple-500/50">
                                                        <input
                                                            autoFocus
                                                            className="flex-1 bg-transparent text-sm text-white px-2 outline-none w-full"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') { renameChat(chat.id, editTitle); setEditingId(null); }
                                                                else if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                        />
                                                        <button onClick={() => { renameChat(chat.id, editTitle); setEditingId(null); }} className="p-1 text-green-400 hover:bg-green-500/20 rounded"><Check size={14} /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="group relative">
                                                        <button
                                                            onClick={() => loadChat(chat.id)}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 border",
                                                                isActive
                                                                    ? "bg-gradient-to-r from-purple-500/10 to-blue-500/5 border-purple-500/20 text-white shadow-lg shadow-purple-900/10"
                                                                    : "border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]"
                                                            )}
                                                        >
                                                            <MessageSquare size={16} className={cn("shrink-0", isActive ? "text-purple-400 fill-purple-400/20" : "text-white/40 group-hover:text-white/60")} />
                                                            <span className="truncate flex-1 text-left">{chat.title || "Untitled Chat"}</span>
                                                        </button>

                                                        {/* Actions Hover */}
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#050505]/80 backdrop-blur pl-2 rounded-l-lg">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                                                                className="p-1.5 text-white/40 hover:text-blue-400 rounded-md hover:bg-white/10 transition-colors"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                                                                className="p-1.5 text-white/40 hover:text-red-400 rounded-md hover:bg-white/10 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* --- Footer / Navigation --- */}
            <div className="p-3 border-t border-white/5 bg-black/10 backdrop-blur-md">

                {/* Utilities Grid */}
                <div className="grid grid-cols-4 gap-1 mb-4">
                    <NavItem icon={Library} label="Lib" onClick={() => window.location.href = '/library'} />
                    <NavItem icon={TrendingUp} label="Stats" onClick={() => window.location.href = '/analytics'} />
                    <NavItem icon={Newspaper} label="News" onClick={() => window.location.href = '/news'} />
                    <NavItem
                        icon={Plug}
                        label="Apps"
                        onClick={toggleConnectorsModal}
                        badge={connectedApps.length > 0 ? connectedApps.length : undefined}
                    />
                </div>

                <button
                    onClick={toggleUploadModal}
                    className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all"
                >
                    <Plus size={14} /> Upload Media
                </button>

                {/* User Profile */}
                {user ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/10">
                            <UserButton />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{user.displayName || 'Creator'}</div>
                            <div className="text-[10px] text-white/40 truncate">Free Plan</div>
                        </div>
                        <Settings size={16} className="text-white/30 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
                    </div>
                ) : (
                    <button
                        onClick={() => window.location.href = '/handler/sign-in'}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm rounded-xl hover:shadow-lg transition-all"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, onClick, badge }: { icon: LucideIcon, label: string, onClick: () => void, badge?: number }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all relative group"
        >
            <Icon size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[9px] font-medium">{label}</span>
            {badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-green-500 border border-black shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
        </button>
    );
}
