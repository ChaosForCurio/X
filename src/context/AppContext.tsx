'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useUser } from "@stackframe/stack";
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export interface SavedChat {
    id: string;
    title: string;
    date: string;
    messages: ChatMessage[];
}

export interface FeedItem {
    id: string; // Changed to string for Firestore ID
    userId: string;
    user: string;
    avatar: string;
    prompt: string;
    likes: number;
    likedBy: string[]; // Array of user IDs who liked the post
    image: string;
    type: 'image' | 'audio' | 'video' | 'text';
    createdAt?: { seconds: number; nanoseconds: number } | Date; // Firestore Timestamp shape
}

// Connector interface for external app integrations
export interface ConnectedApp {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'productivity' | 'development' | 'communication' | 'storage' | 'ai';
    isConnected: boolean;
    lastSynced?: string;
    color: string;
    isMCP?: boolean; // Flag for MCP-based connectors
}

// Available connectors list (used by both AppContext and ConnectorsModal)
const AVAILABLE_CONNECTORS: Omit<ConnectedApp, 'isConnected' | 'lastSynced'>[] = [
    // Productivity
    { id: 'google-drive', name: 'Google Drive', description: 'Access your Google Drive files', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', category: 'productivity', color: '#4285F4' },
    { id: 'notion', name: 'Notion', description: 'Search your Notion workspace', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png', category: 'productivity', color: '#000000' },
    { id: 'dropbox', name: 'Dropbox', description: 'Access your Dropbox files', icon: 'https://cf.dropboxstatic.com/static/images/icons/dropbox_2019-vflMg6_6G.svg', category: 'productivity', color: '#0061FF' },
    { id: 'trello', name: 'Trello', description: 'Access your Trello boards', icon: 'https://cdn.worldvectorlogo.com/logos/trello.svg', category: 'productivity', color: '#0079BF' },
    // Development
    { id: 'github', name: 'GitHub', description: 'Search repos and issues', icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png', category: 'development', color: '#181717' },
    { id: 'gitlab', name: 'GitLab', description: 'Access GitLab repositories', icon: 'https://about.gitlab.com/images/press/press-kit-icon.svg', category: 'development', color: '#FC6D26' },
    { id: 'jira', name: 'Jira', description: 'Search Jira issues', icon: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg', category: 'development', color: '#0052CC' },
    { id: 'linear', name: 'Linear', description: 'Access Linear issues', icon: 'https://asset.brandfetch.io/iduDa181eM/idYaXf_1kV.png', category: 'development', color: '#5E6AD2' },
    // Communication
    { id: 'slack', name: 'Slack', description: 'Search Slack messages', icon: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', category: 'communication', color: '#4A154B' },
    { id: 'discord', name: 'Discord', description: 'Access Discord servers', icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg', category: 'communication', color: '#5865F2' },
    { id: 'gmail', name: 'Gmail', description: 'Search your emails', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', category: 'communication', color: '#EA4335' },
    { id: 'outlook', name: 'Outlook', description: 'Access Outlook emails', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg', category: 'communication', color: '#0078D4' },
    // Storage
    { id: 'onedrive', name: 'OneDrive', description: 'Access OneDrive files', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg', category: 'storage', color: '#0078D4' },
    { id: 'box', name: 'Box', description: 'Access Box storage', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Box%2C_Inc._logo.svg', category: 'storage', color: '#0061D5' },
    { id: 'sharepoint', name: 'SharePoint', description: 'Access SharePoint sites', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg', category: 'storage', color: '#038387' },
    { id: 'confluence', name: 'Confluence', description: 'Search Confluence pages', icon: 'https://cdn.worldvectorlogo.com/logos/confluence-1.svg', category: 'ai', color: '#172B4D' },
    { id: 'hubspot', name: 'HubSpot', description: 'Access HubSpot CRM', icon: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png', category: 'ai', color: '#FF7A59' },
    { id: 'salesforce', name: 'Salesforce', description: 'Access Salesforce CRM', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg', category: 'ai', color: '#00A1E0' },
];

interface AppContextType {
    inputPrompt: string;
    setInputPrompt: React.Dispatch<React.SetStateAction<string>>;
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    addMessage: (role: 'user' | 'ai', content: string) => Promise<string>;
    updateMessage: (id: string, content: string) => void;
    isLeftSidebarOpen: boolean;
    toggleLeftSidebar: () => void;
    isRightSidebarOpen: boolean;
    toggleRightSidebar: () => void;
    isUploadModalOpen: boolean;
    toggleUploadModal: () => void;
    // Connectors
    isConnectorsModalOpen: boolean;
    toggleConnectorsModal: () => void;
    connectedApps: ConnectedApp[];
    connectApp: (connectorId: string) => void;
    disconnectApp: (connectorId: string) => void;
    clearHistory: () => void;
    savedChats: SavedChat[];
    startNewChat: () => void;
    loadChat: (chatId: string) => void;
    deleteChat: (chatId: string) => void;
    renameChat: (chatId: string, newTitle: string) => Promise<void>;
    communityFeed: FeedItem[];
    addToFeed: (item: Omit<FeedItem, 'id' | 'userId' | 'userAvatar' | 'userName' | 'createdAt' | 'likes' | 'likedBy'>, file?: File) => Promise<void>;
    deleteFeedItem: (id: string) => Promise<void>;
    likeFeedItem: (id: string) => Promise<void>;
    uploadImage: (file: File) => Promise<string>; // Deprecated name, kept for compatibility
    uploadFile: (file: File) => Promise<string>;
    userAvatar: string;
    setUserAvatar: (avatar: string) => void;
    isGeneratingImage: boolean;
    generateImage: (prompt: string, model?: string, image?: string) => Promise<string | null>;
    isGeneratingVideo: boolean;
    generateVideo: (prompt: string, model?: string, options?: Record<string, unknown>) => Promise<string | null>;
    currentChatId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [inputPrompt, setInputPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
    const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [communityFeed, setCommunityFeed] = useState<FeedItem[]>([]);
    const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=68');
    const [currentChatId, setCurrentChatId] = useState<string>(`chat-${Date.now()}`);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    // Refs for state access in async closures
    const chatHistoryRef = useRef<ChatMessage[]>([]);

    useEffect(() => {
        chatHistoryRef.current = chatHistory;
    }, [chatHistory]);

    // Refs for optimization
    const user = useUser();

    // Fetch community feed from Firestore on mount
    useEffect(() => {
        const fetchFeed = async () => {
            const timeout = setTimeout(() => {
                console.warn("Community feed fetch timed out after 5 seconds, continuing without feed");
                setCommunityFeed([]);
            }, 5000);

            try {
                const q = query(collection(db, "communityFeed"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                clearTimeout(timeout);

                const feedData: FeedItem[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    userId: doc.data().userId || 'anonymous',
                    user: doc.data().userName || 'Anonymous',
                    avatar: doc.data().userAvatar || 'https://i.pravatar.cc/150?img=68',
                    prompt: doc.data().prompt || '',
                    likes: doc.data().likes || 0,
                    likedBy: doc.data().likedBy || [],
                    image: doc.data().imageUrl,
                    type: doc.data().type || 'image',
                    createdAt: doc.data().createdAt
                }));
                setCommunityFeed(feedData);
            } catch (error) {
                clearTimeout(timeout);
                console.error("Failed to fetch community feed:", error);
                setCommunityFeed([]);
            }
        };

        fetchFeed();
    }, []);

    const uploadFile = useCallback(async (file: File): Promise<string> => {
        try {
            let fileToUpload = file;

            // Only compress images
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1600,
                    useWebWorker: true,
                };
                try {
                    fileToUpload = await imageCompression(file, options);
                } catch (error) {
                    console.warn("Image compression failed, proceeding with original file:", error);
                }
            }

            // 2. Get Signature
            const signRes = await fetch('/api/sign-cloudinary', { method: 'POST' });
            if (!signRes.ok) {
                const error = await signRes.json();
                throw new Error(error.error || 'Failed to get upload signature');
            }
            const signData = await signRes.json();
            const { signature, timestamp, cloudName, apiKey, folder } = signData;

            // 3. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', folder);

            const endpointType = file.type.startsWith('image/') ? 'image' : 'video'; // Audio goes to video endpoint in Cloudinary normally

            const uploadRes2 = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes2.ok) {
                const errorData = await uploadRes2.json() as { error?: { message?: string } };
                throw new Error(errorData.error?.message || 'Cloudinary upload failed');
            }

            const uploadData = await uploadRes2.json();
            const mediaUrl = uploadData.secure_url;
            const publicId = uploadData.public_id;

            // 4. Save to DB (Only for images for now? Or keep generic?)
            // The existing /api/save-image route might expect images. 
            // But we can probably just skip this local persistence for audio if it's strictly for the feed for now.
            // Or assume save-image handles basic metadata.

            if (file.type.startsWith('image/')) {
                const saveRes = await fetch('/api/save-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: mediaUrl, publicId }),
                });

                if (!saveRes.ok) {
                    console.warn('Failed to save image to DB, but upload succeeded');
                }
            }

            return mediaUrl;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[Upload] Failed:", errorMessage);
            toast.error(`Upload failed: ${errorMessage}`);
            throw error;
        }
    }, []);

    const toggleLeftSidebar = useCallback(() => {
        setIsLeftSidebarOpen(prev => {
            if (!prev) setIsRightSidebarOpen(false);
            return !prev;
        });
    }, []);

    const toggleRightSidebar = useCallback(() => {
        setIsRightSidebarOpen(prev => {
            if (!prev) setIsLeftSidebarOpen(false);
            return !prev;
        });
    }, []);

    const toggleUploadModal = useCallback(() => setIsUploadModalOpen(prev => !prev), []);
    const toggleConnectorsModal = useCallback(() => setIsConnectorsModalOpen(prev => !prev), []);

    // Load connected apps from localStorage on mount
    useEffect(() => {
        try {
            const storedApps = localStorage.getItem('connectedApps');
            if (storedApps) {
                setConnectedApps(JSON.parse(storedApps));
            }
        } catch (e) {
            console.warn('[Connectors] Failed to load connected apps:', e);
        }
    }, []);

    // Save connected apps to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('connectedApps', JSON.stringify(connectedApps));
        } catch (e) {
            console.warn('[Connectors] Failed to save connected apps:', e);
        }
    }, [connectedApps]);

    const connectApp = useCallback((connectorId: string) => {
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Find the connector info from our known list
        const connectorInfo = AVAILABLE_CONNECTORS.find(c => c.id === connectorId);
        if (!connectorInfo) return;

        const newApp: ConnectedApp = {
            ...connectorInfo,
            isConnected: true,
            lastSynced: timeStr
        };

        setConnectedApps(prev => {
            const exists = prev.find(a => a.id === connectorId);
            if (exists) {
                return prev.map(a => a.id === connectorId ? newApp : a);
            }
            return [...prev, newApp];
        });

        toast.success(`Connected to ${connectorInfo.name}`);
    }, []);

    const disconnectApp = useCallback((connectorId: string) => {
        const app = connectedApps.find(a => a.id === connectorId);
        setConnectedApps(prev => prev.filter(a => a.id !== connectorId));
        if (app) {
            toast.success(`Disconnected from ${app.name}`);
        }
    }, [connectedApps]);

    const addToFeed = useCallback(async (item: Omit<FeedItem, 'id' | 'userId' | 'userAvatar' | 'userName' | 'createdAt' | 'likes' | 'likedBy'>, file?: File) => {
        // Create a temporary ID for optimistic update
        const tempId = String(Date.now());
        const newItem: FeedItem = {
            ...item,
            id: tempId,
            userId: user?.id || 'anonymous',
            user: user?.displayName || 'Anonymous',
            avatar: user?.profileImageUrl || 'https://i.pravatar.cc/150?img=68',
            likes: 0,
            likedBy: [],
            image: item.image,
            type: item.type || 'image', // Default to image
            createdAt: new Date()
        };

        // Optimistic update
        setCommunityFeed((prev) => [newItem, ...prev]);

        const uploadPromise = async () => {
            let mediaUrl = item.image;
            if (file) {
                mediaUrl = await uploadFile(file);
            } else if (item.image.startsWith('data:image')) {
                const blob = await (await fetch(item.image)).blob();
                const imageFile = new File([blob], `feed-${Date.now()}.jpg`, { type: 'image/jpeg' });
                mediaUrl = await uploadFile(imageFile);
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, "communityFeed"), {
                userId: user?.id || 'anonymous',
                userAvatar: user?.profileImageUrl || 'https://i.pravatar.cc/150?img=68',
                userName: user?.displayName || 'Anonymous',
                imageUrl: mediaUrl, // DB field is 'imageUrl' traditionally, keep using it for the URL
                prompt: item.prompt,
                type: item.type || 'image',
                likes: 0,
                likedBy: [],
                createdAt: serverTimestamp()
            });

            // Also save to user's personal library (Postgres)
            if (user && item.type !== 'audio') { // Skip audio for library for now? Or allow?
                try {
                    const libRes = await fetch('/api/library', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: mediaUrl }),
                    });

                    if (!libRes.ok) {
                        const errText = await libRes.text();
                        console.error("Failed to save to library (API error):", libRes.status, errText);
                    } else {
                        // Successfully saved to library
                    }
                } catch (err) {
                    console.error("Failed to save to library (Network/Other):", err);
                    // Don't block the feed post if library save fails
                }
            }

            // Update the locally added item with the real ID and URL
            setCommunityFeed((prev) =>
                prev.map((i) =>
                    i.id === tempId ? { ...i, id: docRef.id, image: mediaUrl } : i
                )
            );
            return "Posted to community!";
        };

        toast.promise(uploadPromise(), {
            loading: 'Sharing to community...',
            success: (data) => data,
            error: (err) => {
                // Rollback optimistic update
                setCommunityFeed((prev) => prev.filter((i) => i.id !== tempId));
                return `Failed to post: ${err.message}`;
            }
        });
    }, [user, uploadFile]);

    const deleteFeedItem = useCallback(async (id: string) => {
        // Optimistic update
        setCommunityFeed(prev => prev.filter(item => item.id !== id));
        try {
            await fetch(`/api/feed/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error("Failed to delete feed item:", error);
            // Revert on failure (would need to re-fetch or keep item in memory to revert properly, 
            // but for now we just log error. In a real app we'd handle rollback better)
        }
    }, []);

    const likeFeedItem = useCallback(async (id: string) => {
        if (!user) {
            toast.error("Please sign in to like posts");
            return;
        }

        const userId = user.id;
        const item = communityFeed.find(i => i.id === id);
        if (!item) return;

        const hasLiked = item.likedBy.includes(userId);

        // Optimistic update
        setCommunityFeed(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    likes: hasLiked ? item.likes - 1 : item.likes + 1,
                    likedBy: hasLiked
                        ? item.likedBy.filter(uid => uid !== userId)
                        : [...item.likedBy, userId]
                };
            }
            return item;
        }));

        try {
            await fetch(`/api/feed/${id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
        } catch (error) {
            console.error("Failed to like feed item:", error);
            // Revert
            setCommunityFeed(prev => prev.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        likes: hasLiked ? item.likes + 1 : item.likes - 1,
                        likedBy: hasLiked
                            ? [...item.likedBy, userId]
                            : item.likedBy.filter(uid => uid !== userId)
                    };
                }
                return item;
            }));
        }
    }, [user, communityFeed]);

    const messageIdCounter = useRef(0);

    // Load sidebar states from localStorage on mount (keep UI preferences local)
    useEffect(() => {
        const storedLeft = localStorage.getItem('isLeftSidebarOpen');
        const storedRight = localStorage.getItem('isRightSidebarOpen');

        if (storedLeft !== null) setIsLeftSidebarOpen(storedLeft === 'true');
        if (storedRight !== null) setIsRightSidebarOpen(storedRight === 'true');
    }, []);

    // Save sidebar states to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('isLeftSidebarOpen', String(isLeftSidebarOpen));
        } catch (e) {
            console.warn('[LocalStorage] Failed to save left sidebar state:', e);
        }
    }, [isLeftSidebarOpen]);

    useEffect(() => {
        try {
            localStorage.setItem('isRightSidebarOpen', String(isRightSidebarOpen));
        } catch (e) {
            console.warn('[LocalStorage] Failed to save right sidebar state:', e);
        }
    }, [isRightSidebarOpen]);

    // Load chat history from DB on mount or when user changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setChatHistory([]);
                setSavedChats([]);
                return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                const res = await fetch('/api/chats', { signal: controller.signal });
                clearTimeout(timeout);

                if (!res.ok) {
                    throw new Error(`API error: ${res.status}`);
                }

                const data = await res.json();
                if (data.success && data.chats) {
                    const loadedChats = data.chats.map((c: { id: string; title: string; createdAt: string }) => ({
                        id: c.id,
                        title: c.title,
                        date: new Date(c.createdAt).toLocaleDateString(),
                        messages: []
                    }));

                    const uniqueChats = Array.from(new Map(loadedChats.map((c: SavedChat) => [c.id, c])).values()) as SavedChat[];
                    setSavedChats(uniqueChats);
                    startNewChat();
                } else {
                    setChatHistory([]);
                    startNewChat();
                }
            } catch (error) {
                clearTimeout(timeout);
                console.error("Failed to load initial chat history:", error);
                setChatHistory([]);
                setSavedChats([]);
                startNewChat();
            }
        };

        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const addMessage = useCallback(async (role: 'user' | 'ai', content: string) => {
        messageIdCounter.current += 1;
        const msgId = `msg-${messageIdCounter.current}-${Date.now()}`;
        const newMessage: ChatMessage = {
            id: msgId,
            role,
            content,
            timestamp: new Date(),
        };

        const currentHistory = chatHistoryRef.current;
        const updatedHistory = [...currentHistory, newMessage];
        setChatHistory(updatedHistory);

        // Calculate updated title
        let updatedTitle = 'New Chat';
        const currentSavedChat = savedChats.find(c => c.id === currentChatId);
        if (currentSavedChat && currentSavedChat.title !== 'New Chat') {
            updatedTitle = currentSavedChat.title;
        }

        // Update title if it's a user message and currently "New Chat" or just update it to match content
        if (role === 'user') {
            updatedTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        }

        const updatedChat: SavedChat = {
            id: currentChatId,
            title: updatedTitle,
            date: new Date().toLocaleDateString(),
            messages: updatedHistory
        };

        // Optimistic update
        setSavedChats(prev => prev.map(chat => {
            if (chat.id === currentChatId) {
                return updatedChat;
            }
            return chat;
        }));

        // Persist to DB
        try {
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedChat),
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
        } catch (error) {
            console.error("[DB] Failed to save chat message:", error);
            toast.error("Failed to sync message with cloud. It might not be saved.");
            // We don't necessarily rollback here to avoid flickering, but we warn the user
        }
        return msgId;
    }, [currentChatId, savedChats]);

    const updateMessage = useCallback((id: string, content: string) => {
        setChatHistory(prev => prev.map(msg =>
            msg.id === id ? { ...msg, content } : msg
        ));
    }, []);

    const startNewChat = useCallback(async () => {
        const history = chatHistoryRef.current;
        if (history.length > 0) {
            // Save current chat if it has messages
            const lastUserMsg = [...history].reverse().find(msg => msg.role === 'user');
            const titleText = lastUserMsg ? lastUserMsg.content : history[0].content;
            // Use the currentChatId for saving
            const chatId = currentChatId;

            const newSavedChat: SavedChat = {
                id: chatId,
                title: titleText.slice(0, 30) + (titleText.length > 30 ? '...' : ''),
                date: new Date().toLocaleDateString(),
                messages: [...history]
            };

            // Optimistic update: Remove existing if present, then add to top
            setSavedChats(prev => {
                const filtered = prev.filter(c => c.id !== chatId);
                return [newSavedChat, ...filtered];
            });

            // Persist to DB (fire and forget)
            fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSavedChat),
            }).catch(error => {
                console.error("Failed to save chat:", error);
            });
        } else {
            // If current chat was empty, remove it from savedChats list if it's there (cleanup placeholder)
            setSavedChats(prev => prev.filter(c => c.id !== currentChatId));
        }

        setChatHistory([]);
        setInputPrompt('');
        // Generate a new ID for the new session
        const newId = `chat-${Date.now()}`;
        setCurrentChatId(newId);

        // Add new empty chat to savedChats so it appears in sidebar immediately
        const newChatSession: SavedChat = {
            id: newId,
            title: 'New Chat',
            date: new Date().toLocaleDateString(),
            messages: []
        };
        setSavedChats(prev => [newChatSession, ...prev]);
    }, [currentChatId]);

    const loadChat = useCallback(async (id: string) => {
        try {
            setCurrentChatId(id); // Set the active chat ID
            const res = await fetch(`/api/chats/${id}`);

            if (res.status === 404) {
                console.warn(`Chat ${id} not found, removing from list.`);
                setSavedChats(prev => prev.filter(c => c.id !== id));
                if (savedChats.length <= 1) {
                    startNewChat();
                }
                return;
            }

            const data = await res.json();
            if (data.success) {
                const messages = data.messages.map((m: { id: string; role: 'user' | 'ai'; content: string; createdAt: string }) => ({
                    id: String(m.id),
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.createdAt)
                }));
                setChatHistory(messages);
            }
        } catch (error) {
            console.error("Failed to load chat:", error);
        }
    }, [savedChats, startNewChat]);

    const deleteChat = useCallback(async (id: string) => {
        const chatToDelete = savedChats.find(c => c.id === id);
        if (!chatToDelete) return;

        setSavedChats(prev => prev.filter(c => c.id !== id));

        try {
            const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            toast.success("Chat deleted");
        } catch (error) {
            console.error("[DB] Failed to delete chat:", error);
            toast.error("Failed to delete chat. Reverting...");
            setSavedChats(prev => {
                if (prev.some(c => c.id === id)) return prev;
                return [chatToDelete, ...prev];
            });
        }
    }, [savedChats]);

    const renameChat = useCallback(async (id: string, title: string) => {
        const oldTitle = savedChats.find(c => c.id === id)?.title;
        setSavedChats(prev => prev.map(c => c.id === id ? { ...c, title } : c));

        try {
            const res = await fetch(`/api/chats/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            toast.success("Chat renamed");
        } catch (error) {
            console.error("[DB] Failed to rename chat:", error);
            toast.error("Failed to rename chat. Reverting...");
            if (oldTitle) {
                setSavedChats(prev => prev.map(c => c.id === id ? { ...c, title: oldTitle } : c));
            }
        }
    }, [savedChats]);

    const clearHistory = useCallback(async () => {
        const chatIdToDelete = currentChatId;
        setChatHistory([]);
        const newId = `chat-${Date.now()}`;
        setCurrentChatId(newId);

        setSavedChats(prev => {
            const filtered = prev.filter(c => c.id !== chatIdToDelete);
            const newChatSession: SavedChat = {
                id: newId,
                title: 'New Chat',
                date: new Date().toLocaleDateString(),
                messages: []
            };
            return [newChatSession, ...filtered];
        });

        const chatToRestore = savedChats.find(c => c.id === chatIdToDelete);

        try {
            const res = await fetch(`/api/chats/${chatIdToDelete}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
        } catch (error) {
            console.error("[DB] Failed to clear chat history:", error);
            toast.error("Failed to clear cloud history. Reverting UI...");
            if (chatToRestore) {
                setSavedChats(prev => {
                    const exists = prev.some(c => c.id === chatIdToDelete);
                    if (exists) return prev;
                    return [chatToRestore, ...prev];
                });
            }
        }
    }, [currentChatId, savedChats]);

    const generateImage = useCallback(async (prompt: string, model: string = 'flux', image?: string): Promise<string | null> => {
        setIsGeneratingImage(true);
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model,
                    image
                }),
            });

            const data = await res.json();

            if (data.success && data.data?.image) {
                if (user) {
                    fetch('/api/library', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: data.data.image.url }),
                    }).catch(err => console.error("[Library Sync] Error:", err));
                }
                return data.data.image.url;
            } else {
                toast.error(`Image generation failed: ${data.error || 'Unknown error'}`);
                return null;
            }
        } catch (error) {
            console.error('[Generate Image] Error:', error);
            return null;
        } finally {
            setIsGeneratingImage(false);
        }
    }, [user]);

    const generateVideo = useCallback(async (prompt: string, model: string = 'google-veo', options?: Record<string, unknown>): Promise<string | null> => {
        setIsGeneratingVideo(true);
        try {
            const res = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model,
                    options
                }),
            });

            const data = await res.json();

            if (data.success && data.data?.video) {
                // Sync with personal library if needed (though library is currently image-centric)
                return data.data.video.url;
            } else {
                toast.error(`Video generation failed: ${data.error || 'Unknown error'}`);
                return null;
            }
        } catch (error) {
            console.error('[Generate Video] Error:', error);
            return null;
        } finally {
            setIsGeneratingVideo(false);
        }
    }, []);


    const contextValue = React.useMemo(() => ({
        inputPrompt,
        setInputPrompt,
        chatHistory,
        setChatHistory,
        addMessage,
        updateMessage,
        clearHistory,
        isLeftSidebarOpen,
        toggleLeftSidebar,
        isRightSidebarOpen,
        toggleRightSidebar,
        isUploadModalOpen,
        toggleUploadModal,
        isConnectorsModalOpen,
        toggleConnectorsModal,
        connectedApps,
        connectApp,
        disconnectApp,
        userAvatar,
        setUserAvatar,
        currentChatId,
        isGeneratingImage,
        generateImage,
        isGeneratingVideo,
        generateVideo,
        savedChats,
        startNewChat,
        loadChat,
        deleteChat,
        renameChat,
        communityFeed,
        addToFeed,
        deleteFeedItem,
        likeFeedItem,
        uploadImage: uploadFile,
        uploadFile,
    }), [
        inputPrompt, chatHistory, isLeftSidebarOpen, isRightSidebarOpen,
        isConnectorsModalOpen, isUploadModalOpen, connectedApps, userAvatar,
        currentChatId, isGeneratingImage, isGeneratingVideo, savedChats,
        communityFeed, addMessage, updateMessage, clearHistory, generateImage, generateVideo, loadChat,
        startNewChat, toggleUploadModal, toggleConnectorsModal, connectApp,
        disconnectApp, deleteChat, renameChat, likeFeedItem, deleteFeedItem,
        uploadFile, addToFeed, toggleLeftSidebar, toggleRightSidebar
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
