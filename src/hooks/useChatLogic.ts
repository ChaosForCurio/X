'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useApp, ChatMessage } from '@/context/AppContext';
import { useUser } from "@stackframe/stack";
import { compressImage } from '@/lib/imageUtils';
import { extractTextFromPDF } from '@/lib/pdf-parser';

import { parseCodeBlocks, ParsedCodeFile } from '@/lib/codeParser';
import { CodeTemplate } from '../components/ui/CodingButton';
import { PostConfig } from '../components/ui/PostConfigModal';

interface ImageContext {
    response?: string;
    prompt?: string;
    last_image_url?: string;
    extracted_text?: string;
    analysis?: {
        objects: string[];
        colors: string[];
        mood: string;
    };
}

// Helper to check if a prompt likely triggers a web search (matching backend logic)
const isSearchPrompt = (text: string) => {
    const lower = text.toLowerCase();
    const keywords = [
        "search", "find", "lookup", "check", "latest",
        "current", "recent", "news", "update",
        "@web", "trending", "official",
        "who is", "what is", "pricing", "free tier",
        "vs", "compare"
    ];
    return keywords.some(k => lower.includes(k));
};

// Helper to remove heavy base64 data from history before sending to API
const sanitizeHistory = (history: ChatMessage[]) => {
    return history.map(msg => {
        // Check if content contains base64 image or pdf
        if (msg.content.includes('data:image') || msg.content.includes('data:application/pdf')) {
            // Remove the base64 part but keep the markdown structure if possible, or just note it's an attachment
            return {
                ...msg,
                content: msg.content.replace(/!\[.*?\]\(data:.*?\)/g, '[Image Attachment]')
                    .replace(/\[PDF Attachment\]\(data:.*?\)/g, '[PDF Attachment]')
            };
        }
        return msg;
    });
};

export const useChatLogic = () => {
    const { inputPrompt, setInputPrompt, chatHistory, addMessage, updateMessage, toggleLeftSidebar, toggleRightSidebar, isLeftSidebarOpen, isRightSidebarOpen, generateImage, isGeneratingImage, generateVideo, currentChatId, uploadImage, startNewChat, clearHistory } = useApp();
    const user = useUser();

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [avatarMode, setAvatarMode] = useState<'default' | 'searching' | 'creative'>('default');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Analysis & Context State
    const [lastImageContext, setLastImageContext] = useState<ImageContext | null>(null);
    const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisPrompt, setAnalysisPrompt] = useState('');

    // File State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPdf, setSelectedPdf] = useState<{ file: File, text: string, name: string } | null>(null);

    // Feature: Code Canvas State
    const [isCodeCanvasOpen, setIsCodeCanvasOpen] = useState(false);
    const [codeCanvasFiles, setCodeCanvasFiles] = useState<ParsedCodeFile[]>([]);
    const [codeCanvasTitle, setCodeCanvasTitle] = useState('Code Canvas');
    const [isCanvasGenerating, setIsCanvasGenerating] = useState(false);

    // Feature: Post Generation State
    const [isPostConfigModalOpen, setIsPostConfigModalOpen] = useState(false);
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);
    const [isSocialPreviewOpen, setIsSocialPreviewOpen] = useState(false);
    const [generatedPostContent, setGeneratedPostContent] = useState('');
    const [lastPostImageUrl, setLastPostImageUrl] = useState<string | null>(null);

    // Feature: Web Search State
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef(inputPrompt);

    // Sync input ref
    useEffect(() => {
        inputRef.current = inputPrompt;
    }, [inputPrompt]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // -----------------------------------------------------
    // Handlers
    // -----------------------------------------------------

    const handleRemoveImage = useCallback(() => {
        setSelectedImage(null);
        setSelectedFile(null);
        setSelectedPdf(null);
        setAnalysisPrompt('');
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleTechNews = useCallback(() => {
        setIsWebSearchEnabled(true);
        const prompt = "What are the latest major tech advancements, AI news, and scientific breakthroughs from the last 24 hours? Provide a comprehensive summary.";
        setInputPrompt(prompt);
        textareaRef.current?.focus();
    }, [setInputPrompt]);

    const handleSend = useCallback(async (overridePrompt?: string, overrideImage?: string | null, overrideFile?: File | null) => {
        const activePrompt = overridePrompt !== undefined ? overridePrompt : inputRef.current.trim();
        const activeImage = overrideImage !== undefined ? overrideImage : selectedImage;
        const activeFile = overrideFile !== undefined ? overrideFile : selectedFile;

        if ((!activePrompt && !activeImage) || isLoading) return;

        let prompt = activePrompt;

        // Apply Web Search Prefix if toggled on and not already prefixed
        if (isWebSearchEnabled && !prompt.toLowerCase().includes('@web')) {
            prompt = `@web ${prompt}`;
        }

        // Clear inputs immediately
        if (overridePrompt === undefined) {
            setInputPrompt('');
            handleRemoveImage();
            // Don't auto-disable search mode, maybe the user wants it for the whole session?
            // Usually, specific @web is better per-message, but a toggle is "sticky".
            // Let's keep it sticky for now as requested by "toggle" UX.
        }

        // Always clear UI state just in case (original behavior)
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        let finalImageUrl = activeImage;

        if (activeFile && !activeFile.type.includes('pdf')) {
            try {
                finalImageUrl = await uploadImage(activeFile);
            } catch (error) {
                console.error("Failed to upload image:", error);
                addMessage('ai', '❌ Failed to upload image. Please try again.');
                return;
            }
        }

        // --- Quick Actions (Image / Video) ---
        if (prompt.toLowerCase().startsWith('@image ')) {
            addMessage('user', finalImageUrl ? `![User Image](${finalImageUrl}) \n${prompt} ` : prompt);
            try {
                const imageUrl = await generateImage(prompt.slice(7).trim(), 'default', finalImageUrl || undefined);
                if (imageUrl) addMessage('ai', `![Generated Image](${imageUrl})`);
                else addMessage('ai', '❌ Image generation failed.');
            } catch (error) {
                addMessage('ai', `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'} `);
            }
            return;
        }



        // --- Regular Chat Flow ---

        let userContent = prompt;
        // Handle Contexts
        if (selectedPdf) {
            const pdfUrl = URL.createObjectURL(selectedPdf.file);
            const pdfContext = `\n\n<HIDDEN>[Attached PDF Content: ${selectedPdf.file.name}]\n${selectedPdf.text}\n[End of PDF Content]</HIDDEN>`;
            userContent = (!prompt.trim() ? `[PDF Attachment](${pdfUrl})\nPlease analyze this PDF.` : `[PDF Attachment](${pdfUrl})\n${prompt}`) + pdfContext;
            setSelectedPdf(null); // Clear after use
        } else if (finalImageUrl) {
            userContent = finalImageUrl.startsWith('data:application/pdf')
                ? `[PDF Attachment](${finalImageUrl}) \n${prompt} `
                : `![User Image](${finalImageUrl}) \n${prompt} `;
            if (!selectedPdf) addMessage('user', finalImageUrl.startsWith('data') ? userContent : prompt);
            if (!selectedPdf) {
                if (finalImageUrl.startsWith('data:application/pdf')) addMessage('user', userContent);
                else addMessage('user', `![User Image](${finalImageUrl}) \n${prompt}`);
            }
        } else {
            addMessage('user', prompt);
        }

        setIsLoading(true);

        // Set Avatar Mode
        if (isSearchPrompt(prompt)) setAvatarMode('searching');
        else setAvatarMode('default');

        try {
            const sanitizedHistory = sanitizeHistory(chatHistory);

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...sanitizedHistory, { role: 'user', content: userContent }]
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                addMessage('ai', errorData.error || `❌ Server error: ${res.status}`);
                return;
            }

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                if (data.error) {
                    addMessage('ai', data.response || `❌ Error: ${data.error}`);
                    return;
                }

                // Handle Backend Actions
                if (data.backend?.action === 'generate_image') {
                    if (data.memory_update) setLastImageContext(data.memory_update);
                    if (data.explanation) addMessage('ai', data.explanation);
                    const imageUrl = await generateImage(data.backend.prompt, 'default', finalImageUrl || undefined);
                    if (imageUrl) {
                        addMessage('ai', `![Generated Image](${imageUrl})`);
                        if (data.memory_update) setLastImageContext({ ...data.memory_update, last_image_url: imageUrl });
                    }
                } else if (data.backend?.action === 'generate_video') {
                    if (data.explanation) addMessage('ai', data.explanation);
                    const videoUrl = await generateVideo(data.backend.prompt);
                    if (videoUrl) addMessage('ai', `Video generated successfully! \n\n[Video](${videoUrl})`);
                } else if (data.response) {
                    addMessage('ai', data.response);
                    return data.response;
                }
            } else {
                // Streaming response
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                if (!reader) return;

                const aiMessageId = addMessage('ai', '');
                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullContent += chunk;
                    updateMessage(aiMessageId, fullContent);
                    scrollToBottom();
                }
                return fullContent;
            }
        } catch (error) {
            console.error("Chat error:", error);
            addMessage('ai', `❌ Network error, please try again.`);
        } finally {
            setIsLoading(false);
            setAvatarMode('default');
            // Reset sticky behavior? No, let's let the user toggle off.
        }
    }, [selectedImage, selectedFile, selectedPdf, isLoading, chatHistory, currentChatId, lastImageContext, uploadImage, generateImage, generateVideo, addMessage, handleRemoveImage, setInputPrompt, isWebSearchEnabled]);


    // File Handlers
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            const loadingToast = toast.loading('Analyzing PDF...');
            try {
                const result = await extractTextFromPDF(file);
                // Truncate logic
                const text = result.text.length > 50000 ? result.text.substring(0, 50000) + "..." : result.text;
                setSelectedPdf({ file, text, name: file.name });
                toast.success('PDF ready', { id: loadingToast });
            } catch (e) { toast.error('PDF error', { id: loadingToast }); }
            return;
        }

        // Image logic
        const objectUrl = URL.createObjectURL(file);
        setSelectedFile(file);

        try {
            const compressed = await compressImage(file, 1200, 0.6);
            setSelectedImage(compressed);
            URL.revokeObjectURL(objectUrl);

            // Vision Analysis
            setIsAnalyzing(true);
            setAnalysisPrompt('Analyzing image...');
            const formData = new FormData(); formData.append('file', file);
            const [uploadData, analysisData] = await Promise.all([
                fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json()),
                fetch('/api/analyze-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: compressed })
                }).then(r => r.json())
            ]);

            if (analysisData?.response || analysisData?.prompt) setAnalysisPrompt(analysisData.response || analysisData.prompt);
            else setAnalysisPrompt('Could not analyze image.');

            // Save context
            if (user && uploadData?.url) {
                addDoc(collection(db, "image_contexts"), {
                    userId: user.id,
                    imageUrl: uploadData.url,
                    prompt: analysisData.response || analysisData.prompt,
                    timestamp: new Date()
                }).catch(console.error);
            }

        } catch (err) {
            console.error(err);
            setAnalysisPrompt('Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }

    }, [user]);


    // Feature Handlers
    const handleGeneratePost = async (config: PostConfig) => {
        setIsPostConfigModalOpen(false);
        setIsGeneratingPost(true);
        toast.info(`Designing post...`);

        try {
            const prompt = `ACT AS: Social Media Strategist... (Config: ${config.goal}, ${config.tone})...`;
            await handleSend(prompt, null, null);
        } catch (e) {
            toast.error('Failed to generate post');
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const handleOpenCodingCanvas = useCallback(async (template: CodeTemplate) => {
        setIsCodeCanvasOpen(true);
        setCodeCanvasTitle(template.label);
        setCodeCanvasFiles([]);
        setIsCanvasGenerating(true);

        const fullPrompt = template.prompt + (inputRef.current ? `\n\nContext: ${inputRef.current}` : '');
        setInputPrompt('');

        try {
            const res = await handleSend(fullPrompt);
            if (res && typeof res === 'string') {
                const files = parseCodeBlocks(res);
                if (files.length > 0) {
                    setCodeCanvasFiles(files);
                    toast.success('Project generated!');
                }
            }
        } finally {
            setIsCanvasGenerating(false);
        }
    }, [handleSend, setInputPrompt]);


    const openCodeCanvas = useCallback((content: string, title?: string) => {
        const files = parseCodeBlocks(content);
        if (files.length > 0) {
            setCodeCanvasFiles(files);
            setCodeCanvasTitle(title || 'Code Canvas');
            setIsCodeCanvasOpen(true);
        } else {
            toast.error('No code blocks found');
        }
    }, [setCodeCanvasFiles, setCodeCanvasTitle, setIsCodeCanvasOpen]);

    const handleFeedback = useCallback(async (messageId: string, type: 'up' | 'down') => {
        try {
            await fetch('/api/chat/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, type, chatId: currentChatId })
            });
            toast.success(`Feedback received`);
        } catch (error) {
            console.error("Error sending feedback:", error);
        }
    }, [currentChatId]);

    const handleDownload = useCallback((url: string) => {
        window.open(url, '_blank');
    }, []);

    // Return Interface
    return {
        // State
        user,
        inputPrompt, setInputPrompt,
        chatHistory,
        isLoading,
        isGeneratingImage,
        isAnalyzing, analysisPrompt, setAnalysisPrompt,

        selectedImage, selectedPdf,
        isFullscreen, toggleFullscreen: () => setIsFullscreen(!isFullscreen),
        showScrollButton,

        // Sidebar State
        isLeftSidebarOpen, toggleLeftSidebar,
        isRightSidebarOpen, toggleRightSidebar,
        startNewChat,

        // Canvas State
        isCodeCanvasOpen, setIsCodeCanvasOpen,
        codeCanvasFiles, setCodeCanvasFiles,
        codeCanvasTitle,
        isCanvasGenerating,

        // Post State
        isPostConfigModalOpen, setIsPostConfigModalOpen,
        isSocialPreviewOpen, setIsSocialPreviewOpen,
        generatedPostContent, setGeneratedPostContent,
        lastPostImageUrl,

        // Web Search
        isWebSearchEnabled,
        toggleWebSearch: () => setIsWebSearchEnabled(!isWebSearchEnabled),

        // Refs
        messagesEndRef,
        fileInputRef,
        textareaRef,

        // Handlers
        handleSend,
        handleKeyDown: useCallback((e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }, [handleSend]),
        handleFileSelect,
        handleRemoveImage,
        handleTechNews,
        handleCreatePost: () => setIsPostConfigModalOpen(true),
        handleGeneratePost,
        handleOpenCodingCanvas,
        openCodeCanvas,
        handleFeedback,
        handleDownload,

        // Other
        avatarMode,
        clearHistory
    };
};

