import React, { memo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Sparkles, Code2, Copy, Volume2, Check, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage } from '@/context/AppContext';
import { hasCodeBlocks } from '@/lib/codeParser';
import GeminiLogo3D from '../ui/GeminiLogo3D';
import ImageGenerationSkeleton from '../ui/ImageGenerationSkeleton';
import MessageSkeleton from '../ui/MessageSkeleton';
import StreamingAIResponse from './StreamingAIResponse';

// Dynamic AI Avatar URLs based on mode
const AI_AVATARS = {
    default: 'https://www.notebookcheck.com/fileadmin/Notebooks/News/_nc4/google-gemini_0051.jpg',
    searching: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPfvCmSlNOt_s_Mf9dHXqbzQlnH4NTgmxR0w&s', // Globe/Search icon style
    creative: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8w4p5fXLXzVxT8QYH9pGNLphPQ4zvEpV0Tw&s' // AI art/creative style
};

// Helper to get avatar URL based on mode
const getAvatarUrl = (mode: 'default' | 'searching' | 'creative') => AI_AVATARS[mode];

// Sub-components for specific message types
const ImageMessage = ({ imageUrl, onDownload, showDownload = true }: { imageUrl: string, onDownload: (url: string) => void, showDownload?: boolean }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    if (hasError) {
        return (
            <div className="mb-3 mt-1 w-64 h-64 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-white/40 gap-2">
                <Sparkles size={24} className="opacity-50" />
                <span className="text-xs">Failed to load image</span>
            </div>
        );
    }

    return (
        <div className="mb-3 mt-1 relative group inline-block rounded-xl overflow-hidden bg-black/20 min-h-[100px]">
            <Image
                src={imageUrl}
                alt="Generated"
                className={`max-w-full rounded-xl shadow-lg border border-white/10 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                width={500}
                height={500}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                unoptimized
            />
            {isLoaded && showDownload && (
                <button
                    onClick={() => onDownload(imageUrl)}
                    className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all border border-white/20 shadow-lg opacity-0 group-hover:opacity-100"
                    title="Download Image"
                >
                    <Download size={20} />
                </button>
            )}
        </div>
    );
};

const PDFMessage = ({ pdfUrl }: { pdfUrl: string }) => {
    return (
        <div className="mb-3 mt-1 relative group inline-flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => window.open(pdfUrl, '_blank')}>
            <div className="h-12 w-12 flex items-center justify-center bg-red-500/20 rounded-lg text-red-400">
                <FileText size={24} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-white/90">PDF Document</span>
                <span className="text-xs text-white/50">Click to view</span>
            </div>
        </div>
    );
};

const VideoMessage = ({ videoUrl, onDownload }: { videoUrl: string, onDownload: (url: string) => void }) => {
    return (
        <div className="mb-3 mt-1 relative group rounded-xl overflow-hidden bg-black/20 border border-white/10 max-w-full sm:max-w-md">
            <video
                src={videoUrl}
                controls
                className="w-full h-auto rounded-xl shadow-lg"
                poster="/video-poster.png" // Optional: placeholder for video
            />
            <button
                onClick={() => onDownload(videoUrl)}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all border border-white/20 shadow-lg opacity-0 group-hover:opacity-100"
                title="Download Video"
            >
                <Download size={18} />
            </button>
        </div>
    );
};


interface UserType {
    displayName?: string | null;
    profileImageUrl?: string | null;
}

interface MessageListProps {
    chatHistory: ChatMessage[];
    user: UserType | null;
    isLoading: boolean;
    isGeneratingImage: boolean;
    avatarMode: 'default' | 'searching' | 'creative';
    onDownload: (url: string) => void;
    onSuggestionClick?: (suggestion: string) => void;
    onFillInput?: (suggestion: string) => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onOpenCodeCanvas?: (content: string, title?: string) => void;
    onFeedback?: (messageId: string, type: 'up' | 'down') => void;
}

const MessageList = memo(({
    chatHistory,
    user,
    isLoading,
    isGeneratingImage,
    avatarMode,
    onDownload,
    onSuggestionClick,
    onFillInput,
    messagesEndRef,
    onOpenCodeCanvas,
    onFeedback
}: MessageListProps) => {
    // Note: Avoid accessing refs during render to satisfy lint rules
    // Keep a simple "is last AI message" check for subtle animations

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error('Text-to-speech not supported');
        }
    };


    return (
        <div className="space-y-6 max-w-4xl mx-auto w-full pb-4">
            <AnimatePresence>
                {chatHistory.map((msg, index) => {
                    const isNew = msg.role === 'ai' && index === chatHistory.length - 1 && !isLoading;

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 bg-black/20 border border-white/10">
                                    {/* Mobile/Tablet Avatar - Dynamic based on mode */}
                                    <Image
                                        src={getAvatarUrl(avatarMode)}
                                        alt="AI"
                                        className="object-cover md:hidden"
                                        width={40}
                                        height={40}
                                    />
                                    {/* Desktop Avatar */}
                                    <div className="hidden md:block w-full h-full">
                                        <GeminiLogo3D mode={avatarMode} />
                                    </div>
                                </div>
                            )}

                            <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl group relative ${msg.role === 'user'
                                ? 'bg-white/10 text-white rounded-tr-sm backdrop-blur-sm'
                                : 'bg-transparent text-gray-100 rounded-tl-sm'
                                } `}>
                                {(() => {
                                    // Check for video markdown syntax first to prevent it being caught as an image
                                    const videoMatch = msg.content.match(/!\[Generated Video\]\((.*?)\)/);
                                    const videoUrl = videoMatch ? videoMatch[1] : null;

                                    // Check for markdown image syntax, but exclude if it's already identified as a video
                                    const imageMatch = msg.content.match(/!\[(?!Generated Video).*?\]\((.*?)\)/);
                                    const imageUrl = imageMatch ? imageMatch[1] : null;

                                    // Check for PDF attachment syntax
                                    const pdfMatch = msg.content.match(/\[PDF Attachment\]\((.*?)\)/);
                                    const pdfUrl = pdfMatch ? pdfMatch[1] : null;

                                    let textContent = msg.content;
                                    if (imageUrl) textContent = textContent.replace(/!\[.*?\]\(.*?\)/, '');
                                    if (pdfUrl) textContent = textContent.replace(/\[PDF Attachment\]\(.*?\)/, '');
                                    if (videoUrl) textContent = textContent.replace(/!\[Generated Video\]\(.*?\)/, '');
                                    // Remove hidden context
                                    textContent = textContent.replace(/<HIDDEN>[\s\S]*?<\/HIDDEN>/g, '');
                                    textContent = textContent.trim();

                                    return (
                                        <>
                                            {imageUrl && (
                                                <ImageMessage
                                                    imageUrl={imageUrl}
                                                    onDownload={onDownload}
                                                    showDownload={msg.role === 'ai'}
                                                />
                                            )}
                                            {pdfUrl && (
                                                <PDFMessage pdfUrl={pdfUrl} />
                                            )}
                                            {videoUrl && (
                                                <VideoMessage
                                                    videoUrl={videoUrl}
                                                    onDownload={onDownload}
                                                />
                                            )}
                                            {textContent && (
                                                msg.role === 'ai' ? (
                                                    <StreamingAIResponse
                                                        content={textContent}
                                                        isNew={isNew}
                                                        onSuggestionClick={onSuggestionClick}
                                                        onFillInput={onFillInput}
                                                    />
                                                ) : (
                                                    <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
                                                )
                                            )}
                                            {/* Open in Code Canvas button for AI messages with code */}
                                            {msg.role === 'ai' && hasCodeBlocks(msg.content) && onOpenCodeCanvas && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <button
                                                        onClick={() => onOpenCodeCanvas(msg.content, 'Generated Code')}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                                                    >
                                                        <Code2 size={14} />
                                                        Open in Code Canvas
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {msg.role === 'ai' && (
                                    <div className="absolute -bottom-8 left-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                        <button
                                            onClick={() => handleCopy(msg.content)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                            title="Copy text"
                                            aria-label="Copy text"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleSpeak(msg.content)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                            title="Read aloud"
                                            aria-label="Read aloud"
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-white/10" />
                                        <button
                                            onClick={() => onFeedback?.(msg.id, 'up')}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                            title="Good response"
                                            aria-label="Rate good"
                                        >
                                            <ThumbsUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => onFeedback?.(msg.id, 'down')}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                            title="Bad response"
                                            aria-label="Rate bad"
                                        >
                                            <ThumbsDown size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 border border-white/10 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                    <Image
                                        src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=random&color=fff`}
                                        alt="User"
                                        className="object-cover"
                                        width={40}
                                        height={40}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=random&color=fff`;
                                        }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {isGeneratingImage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 justify-start"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 bg-black/20 border border-white/10">
                            {/* Mobile/Tablet Avatar - Creative mode */}
                            <Image
                                src={getAvatarUrl('creative')}
                                alt="AI"
                                className="object-cover md:hidden"
                                width={40}
                                height={40}
                            />
                            {/* Desktop Avatar */}
                            <div className="hidden md:block w-full h-full">
                                <GeminiLogo3D mode="creative" />
                            </div>
                        </div>
                        <div className="max-w-[80%] md:max-w-[60%] w-full">
                            <ImageGenerationSkeleton />
                        </div>
                    </motion.div>
                )}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 justify-start"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 bg-black/20 border border-white/10">
                            <GeminiLogo3D mode={avatarMode} />
                        </div>
                        <div className="max-w-[80%] md:max-w-[70%] p-4 rounded-2xl bg-transparent text-gray-100 rounded-tl-sm">
                            <MessageSkeleton />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div >
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
