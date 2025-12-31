'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Search, Check, ExternalLink, Unplug, Zap, ShieldCheck, RefreshCw,
    Cloud, Code, Mail, Calendar, FileText, Database, MessageSquare, Folder, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

// Connector types and data
export interface Connector {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'productivity' | 'development' | 'communication' | 'storage' | 'ai';
    isConnected: boolean;
    lastSynced?: string;
    color: string;
}

const AVAILABLE_CONNECTORS: Omit<Connector, 'isConnected' | 'lastSynced'>[] = [
    // Productivity
    {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Access and search your Google Drive files, docs, and sheets',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
        category: 'productivity',
        color: '#4285F4'
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Search and reference your Notion workspace and pages',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
        category: 'productivity',
        color: '#000000'
    },
    {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Access your Dropbox files and folders',
        icon: 'https://cf.dropboxstatic.com/static/images/icons/dropbox_2019-vflMg6_6G.svg',
        category: 'productivity',
        color: '#0061FF'
    },
    {
        id: 'trello',
        name: 'Trello',
        description: 'Access your Trello boards, lists, and cards',
        icon: 'https://cdn.worldvectorlogo.com/logos/trello.svg',
        category: 'productivity',
        color: '#0079BF'
    },
    // Development
    {
        id: 'github',
        name: 'GitHub',
        description: 'Search repos, issues, and pull requests from your GitHub',
        icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        category: 'development',
        color: '#181717'
    },
    {
        id: 'gitlab',
        name: 'GitLab',
        description: 'Access your GitLab repositories and projects',
        icon: 'https://about.gitlab.com/images/press/press-kit-icon.svg',
        category: 'development',
        color: '#FC6D26'
    },
    {
        id: 'jira',
        name: 'Jira',
        description: 'Search and reference Jira issues and projects',
        icon: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg',
        category: 'development',
        color: '#0052CC'
    },
    {
        id: 'linear',
        name: 'Linear',
        description: 'Access Linear issues, projects, and cycles',
        icon: 'https://asset.brandfetch.io/iduDa181eM/idYaXf_1kV.png',
        category: 'development',
        color: '#5E6AD2'
    },
    // Communication
    {
        id: 'slack',
        name: 'Slack',
        description: 'Search messages and channels from your Slack workspace',
        icon: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
        category: 'communication',
        color: '#4A154B'
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Access your Discord servers and messages',
        icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg',
        category: 'communication',
        color: '#5865F2'
    },
    {
        id: 'gmail',
        name: 'Gmail',
        description: 'Search and reference your Gmail emails',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
        category: 'communication',
        color: '#EA4335'
    },
    {
        id: 'outlook',
        name: 'Outlook',
        description: 'Access your Outlook emails and calendar',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
        category: 'communication',
        color: '#0078D4'
    },
    // Storage
    {
        id: 'onedrive',
        name: 'OneDrive',
        description: 'Access your Microsoft OneDrive files',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg',
        category: 'storage',
        color: '#0078D4'
    },
    {
        id: 'box',
        name: 'Box',
        description: 'Search and access your Box cloud storage',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Box%2C_Inc._logo.svg',
        category: 'storage',
        color: '#0061D5'
    },
    {
        id: 'sharepoint',
        name: 'SharePoint',
        description: 'Access your SharePoint sites and documents',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg',
        category: 'storage',
        color: '#038387'
    },
    // AI & Analytics
    // Productivity
    {
        id: 'confluence',
        name: 'Confluence',
        description: 'Search your Confluence spaces and pages',
        icon: 'https://cdn.worldvectorlogo.com/logos/confluence-1.svg',
        category: 'ai',
        color: '#172B4D'
    },
    {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Access your HubSpot CRM data and contacts',
        icon: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
        category: 'ai',
        color: '#FF7A59'
    },
    {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Access your Salesforce CRM and data',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
        category: 'ai',
        color: '#00A1E0'
    }
];

const CATEGORY_INFO = {
    productivity: { label: 'Productivity', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    development: { label: 'Development', icon: Code, color: 'from-purple-500 to-pink-500' },
    communication: { label: 'Communication', icon: MessageSquare, color: 'from-green-500 to-emerald-500' },
    storage: { label: 'Cloud Storage', icon: Cloud, color: 'from-orange-500 to-amber-500' },
    ai: { label: 'AI Agents', icon: Sparkles, color: 'from-indigo-500 to-purple-500' }
};

interface ConnectorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectedApps: Connector[];
    onConnect: (connectorId: string) => void;
    onDisconnect: (connectorId: string) => void;
}

export default function ConnectorsModal({
    isOpen,
    onClose,
    connectedApps,
    onConnect,
    onDisconnect
}: ConnectorsModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [authUrl, setAuthUrl] = useState<string | null>(null);

    useEffect(() => {
        // Handle standard OAuth callbacks here if needed
    }, [onConnect]);

    // Merge available connectors with connected status
    const connectors: Connector[] = AVAILABLE_CONNECTORS.map(conn => {
        const connected = connectedApps.find(c => c.id === conn.id);
        return {
            ...conn,
            isConnected: !!connected,
            lastSynced: connected?.lastSynced
        };
    });

    // Filter connectors
    const filteredConnectors = connectors.filter(conn => {
        const matchesSearch = conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conn.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || conn.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Group by category
    const groupedConnectors = filteredConnectors.reduce((acc, conn) => {
        if (!acc[conn.category]) acc[conn.category] = [];
        acc[conn.category].push(conn);
        return acc;
    }, {} as Record<string, Connector[]>);

    const handleConnect = async (connectorId: string) => {
        setConnectingId(connectorId);

        // Standard connector - simulate OAuth flow delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        onConnect(connectorId);
        setConnectingId(null);
    };

    const handleDisconnect = async (connectorId: string) => {
        setConnectingId(connectorId);

        await new Promise(resolve => setTimeout(resolve, 800));
        onDisconnect(connectorId);
        setConnectingId(null);
    };

    const connectedCount = connectors.filter(c => c.isConnected).length;

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] 
                                   rounded-2xl border border-white/10 shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex-none p-6 border-b border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/20">
                                        <Zap className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Connectors</h2>
                                        <p className="text-sm text-white/50">
                                            Connect external apps to enhance your AI experience
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search and Stats */}
                            <div className="flex items-center gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="Search connectors..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                                                   text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50
                                                   focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    />
                                </div>

                                {/* Connected count badge */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                                    <ShieldCheck className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium text-green-400">{connectedCount} Connected</span>
                                </div>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'all'
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    All Apps
                                </button>
                                {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                                    const Icon = info.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveCategory(key)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeCategory === key
                                                ? 'bg-white/10 text-white border border-white/20'
                                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon size={14} />
                                            {info.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Connector Grid */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {Object.entries(groupedConnectors).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-center">
                                    <Folder className="w-12 h-12 text-white/20 mb-3" />
                                    <p className="text-white/40">No connectors found</p>
                                    <p className="text-white/20 text-sm">Try a different search term</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {Object.entries(groupedConnectors).map(([category, categoryConnectors]) => {
                                        const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                                        const CategoryIcon = categoryInfo.icon;

                                        return (
                                            <div key={category}>
                                                {/* Category Header */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${categoryInfo.color} bg-opacity-20`}>
                                                        <CategoryIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                                                        {categoryInfo.label}
                                                    </h3>
                                                    <div className="flex-1 h-px bg-white/5" />
                                                </div>

                                                {/* Connectors */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {categoryConnectors.map((connector) => (
                                                        <motion.div
                                                            key={connector.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`group relative p-4 rounded-xl border transition-all duration-300 ${connector.isConnected
                                                                ? 'bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 hover:border-green-500/40'
                                                                : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                {/* Icon */}
                                                                <div
                                                                    className="w-12 h-12 rounded-xl p-2 flex items-center justify-center shrink-0 bg-white/5 border border-white/10"
                                                                    style={{
                                                                        boxShadow: connector.isConnected
                                                                            ? `0 0 20px ${connector.color}20`
                                                                            : 'none'
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={connector.icon}
                                                                        alt={connector.name}
                                                                        width={32}
                                                                        height={32}
                                                                        className="object-contain"
                                                                        unoptimized
                                                                    />
                                                                </div>

                                                                {/* Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                                                            {connector.name}
                                                                        </h4>
                                                                        {connector.isConnected && (
                                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                                                                                <Check size={10} className="text-green-400" />
                                                                                <span className="text-[10px] font-medium text-green-400">Connected</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-white/50 mt-1 line-clamp-2">
                                                                        {connector.description}
                                                                    </p>
                                                                    {connector.isConnected && connector.lastSynced && (
                                                                        <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                                                                            <RefreshCw size={10} />
                                                                            Last synced: {connector.lastSynced}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Action Button */}
                                                                <div className="shrink-0">
                                                                    {connector.isConnected ? (
                                                                        <button
                                                                            onClick={() => handleDisconnect(connector.id)}
                                                                            disabled={connectingId === connector.id}
                                                                            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 
                                                                                       border border-red-500/20 hover:border-red-500/40 rounded-lg 
                                                                                       text-red-400 text-sm font-medium transition-all disabled:opacity-50"
                                                                        >
                                                                            {connectingId === connector.id ? (
                                                                                <RefreshCw size={14} className="animate-spin" />
                                                                            ) : (
                                                                                <Unplug size={14} />
                                                                            )}
                                                                            <span className="hidden sm:inline">Disconnect</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleConnect(connector.id)}
                                                                            disabled={connectingId === connector.id}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                                                                                       hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 
                                                                                       hover:border-purple-500/50 rounded-lg text-purple-300 text-sm font-medium 
                                                                                       transition-all disabled:opacity-50"
                                                                        >
                                                                            {connectingId === connector.id ? (
                                                                                <>
                                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                                    <span>Connecting...</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ExternalLink size={14} />
                                                                                    <span>Connect</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Standard connector footers */}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex-none p-4 border-t border-white/5 bg-black/20">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-white/40">
                                    Connected apps can access data based on your permissions. You can disconnect anytime.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                                               rounded-lg text-sm font-medium text-white/70 hover:text-white transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
