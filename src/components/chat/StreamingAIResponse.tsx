'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BlurText } from "@/components/ui/blur-text";
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // or github-dark.css
import { toast } from 'sonner';
import { Play, SendHorizontal } from 'lucide-react';
import { VideoFeed, VideoCard } from './VideoFeed';
import { EntityCard } from './EntityCard';

// Capitalized component to render images safely with hooks
function MarkdownImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    const { src, alt, ...rest } = props;
    const [hasError, setHasError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    const srcStr = typeof src === 'string' ? src : '';
    const isYouTube = srcStr.includes('ytimg.com') || srcStr.includes('youtube.com');

    if (hasError || !srcStr) {
        return (
            <div className="rounded-xl border border-white/10 my-4 w-full aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] flex flex-col items-center justify-center gap-2">
                <span className="text-white/30 text-2xl">🎬</span>
                <span className="text-white/40 text-xs text-center px-2">{alt || 'Video Thumbnail'}</span>
            </div>
        );
    }

    return (
        <div className={`relative my-4 overflow-hidden rounded-2xl border border-white/10 shadow-2xl group/img ${isYouTube ? 'aspect-video w-full max-w-[500px]' : 'inline-block max-h-[300px]'}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={srcStr}
                alt={alt || 'Image'}
                className={`w-full h-full object-cover transition-all duration-700 bg-black/20 ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (isYouTube && target.src.includes('maxresdefault.jpg')) {
                        // Fallback to hqdefault if maxres doesn't exist
                        target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                    } else {
                        setIsLoading(false);
                        setHasError(true);
                    }
                }}
                {...rest}
            />
            {isYouTube && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform scale-90 group-hover/img:scale-100 transition-transform">
                        <Play size={20} className="text-white fill-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}

interface StreamingAIResponseProps {
    content: string;
    isNew: boolean; // Only stream if it's a new message
    onSuggestionClick?: (suggestion: string) => void; // Callback when suggestion is double-clicked (send to AI)
    onFillInput?: (suggestion: string) => void; // Callback when suggestion is single-clicked (fill input)
}

const StreamingAIResponse = React.memo(({ content, isNew, onSuggestionClick, onFillInput }: StreamingAIResponseProps) => {
    const isWebSearch = content.includes('🔎 Real-Time Insights:');

    return (
        <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent relative group/response`}>
            {isWebSearch && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                    <div className="relative">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Live Search Results</span>
                </div>
            )}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }: { children?: React.ReactNode }) => {
                        // Handle bracketed citations like [1], [2]
                        const processCitations = (content: React.ReactNode): React.ReactNode => {
                            if (typeof content !== 'string') return content;

                            const parts = content.split(/(\[\d+\])/g);
                            return parts.map((part, i) => {
                                if (part.match(/^\[\d+\]$/)) {
                                    const num = part.match(/\d+/)![0];
                                    return (
                                        <sup key={i} className="mx-0.5 px-1 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold cursor-help border border-blue-500/30 hover:bg-blue-500/40 transition-colors">
                                            {num}
                                        </sup>
                                    );
                                }
                                return part;
                            });
                        };

                        const processedChildren = React.Children.map(children, processCitations);

                        const extractRawText = (node: React.ReactNode): string => {
                            if (!node) return '';
                            if (typeof node === 'string') return node;
                            if (typeof node === 'number') return String(node);
                            if (Array.isArray(node)) return node.map(extractRawText).join('');
                            if (React.isValidElement(node)) {
                                return extractRawText((node.props as { children?: React.ReactNode }).children);
                            }
                            return '';
                        };

                        const fullText = extractRawText(children);

                        const ytFeedRegex = /\[YOUTUBE_FEED\]([\s\S]*?)\[\/YOUTUBE_FEED\]/;
                        const ytCardRegex = /\[YOUTUBE_CARD\]([\s\S]*?)\[\/YOUTUBE_CARD\]/;
                        const entityCardRegex = /\[ENTITY_CARD\]([\s\S]*?)\[\/ENTITY_CARD\]/;

                        if (fullText.includes('[ENTITY_CARD]')) {
                            const match = fullText.match(entityCardRegex);
                            if (match) {
                                try {
                                    const entityData = JSON.parse(match[1]);
                                    const parts = fullText.split(entityCardRegex);
                                    const before = parts[0];
                                    const after = parts[2];

                                    return (
                                        <div className="w-full">
                                            {before && <p className="mb-2">{processCitations(before)}</p>}
                                            <EntityCard {...entityData} />
                                            {after && <p className="mt-2 text-white/90">{processCitations(after)}</p>}
                                        </div>
                                    );
                                } catch (e) {
                                    console.error("Failed to parse Entity Card JSON", e);
                                }
                            }
                        }

                        if (fullText.includes('[YOUTUBE_FEED]')) {
                            const match = fullText.match(ytFeedRegex);
                            if (match) {
                                const videosJson = match[1];
                                const parts = fullText.split(ytFeedRegex);
                                const before = parts[0];
                                const after = parts[2];

                                return (
                                    <div className="w-full">
                                        {before && <p className="mb-2">{processCitations(before)}</p>}
                                        <VideoFeed videosJson={videosJson} />
                                        {after && <p className="mt-2 text-white/90">{processCitations(after)}</p>}
                                    </div>
                                );
                            }
                        }

                        if (fullText.includes('[YOUTUBE_CARD]')) {
                            const match = fullText.match(ytCardRegex);
                            if (match) {
                                try {
                                    const videoData = JSON.parse(match[1]);
                                    const parts = fullText.split(ytCardRegex);
                                    const before = parts[0];
                                    const after = parts[2];

                                    return (
                                        <div className="w-full my-4">
                                            {before && <p className="mb-2 text-white/90">{processCitations(before)}</p>}
                                            <div className="inline-block">
                                                <VideoCard video={videoData} />
                                            </div>
                                            {after && <p className="mt-2 text-white/90">{processCitations(after)}</p>}
                                        </div>
                                    );
                                } catch (e) {
                                    console.error("Failed to parse YouTube card JSON:", e);
                                }
                            }
                        }

                        if (typeof children === 'string' && isNew) {
                            return <div className="mb-2 last:mb-0 leading-relaxed"><BlurText text={children} /></div>;
                        }

                        return (
                            <motion.div
                                initial={isNew ? { opacity: 0, filter: 'blur(5px)' } : { opacity: 1, filter: 'blur(0px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.5 }}
                                className="mb-2 last:mb-0 leading-relaxed text-gray-300"
                            >
                                {processedChildren}
                            </motion.div>
                        );
                    },
                    code: ({ inline, className, children, ...props }: { inline?: boolean, className?: string, children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : null;

                        if (!inline) {
                            let highlightedCode = String(children).replace(/\n$/, '');
                            if (language && hljs.getLanguage(language)) {
                                try {
                                    highlightedCode = hljs.highlight(highlightedCode, { language }).value;
                                } catch (e) {
                                    console.error("Highlighting failed:", e);
                                }
                            } else {
                                // Auto-detect if language not specified
                                try {
                                    highlightedCode = hljs.highlightAuto(highlightedCode).value;
                                } catch (e) {
                                    console.error("Auto-highlighting failed:", e);
                                }
                            }

                            return (
                                <div className="relative bg-[#0d1117] rounded-lg my-4 overflow-hidden border border-white/10 group">
                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                        <span className="text-xs text-white/50 font-mono">{language || 'code'}</span>
                                        <button
                                            onClick={() => {
                                                try {
                                                    navigator.clipboard.writeText(String(children));
                                                    toast.success('Copied to clipboard');
                                                } catch {
                                                    console.error('Failed to copy code to clipboard');
                                                }
                                            }}
                                            className="text-xs text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="p-4 overflow-x-auto">
                                        <code
                                            className={`hljs ${className || ''} !bg-transparent !p-0 font-mono text-sm`}
                                            {...props}
                                            dangerouslySetInnerHTML={{ __html: highlightedCode }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props}>
                                {children}
                            </code>
                        );
                    },
                    ul: ({ children }: { children?: React.ReactNode }) => {
                        const items = React.Children.toArray(children);
                        const firstItem = items[0];
                        const isSourceList = items.length > 0 &&
                            React.isValidElement<{ children?: React.ReactNode }>(firstItem) &&
                            typeof firstItem.props.children === 'string' &&
                            firstItem.props.children.includes('http');

                        if (isSourceList) {
                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-6">
                                    {children}
                                </div>
                            );
                        }

                        return (
                            <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-300 marker:text-blue-400">
                                {children}
                            </ul>
                        );
                    },
                    ol: ({ children }: { children?: React.ReactNode }) => (
                        <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-300 marker:text-purple-400">
                            {children}
                        </ol>
                    ),
                    li: ({ children }: { children?: React.ReactNode }) => {
                        // Check if this is a source item (contains a link)
                        const childrenArray = React.Children.toArray(children);
                        const linkChild = childrenArray.find(child => React.isValidElement(child) && child.type === 'a') as React.ReactElement<{ href?: string; children?: React.ReactNode }> | undefined;

                        if (linkChild) {
                            const href = linkChild.props.href;
                            const title = linkChild.props.children;
                            let hostname = '';
                            if (href) {
                                try { hostname = new URL(href).hostname; } catch { }
                            }

                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-blue-500/40 hover:from-blue-500/10 transition-all duration-300 group no-underline"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Avatar className="h-6 w-6 border border-white/10">
                                            <AvatarImage src={`https://www.google.com/s2/favicons?domain=${hostname}`} alt={hostname} />
                                            <AvatarFallback className="text-[10px] bg-white/5">{hostname.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter truncate">{hostname}</span>
                                    </div>
                                    <div className="text-sm font-medium text-white/90 group-hover:text-white line-clamp-2 leading-tight">
                                        {title}
                                    </div>
                                </a>
                            );
                        }

                        // Existing suggestion/standard logic
                        const extractText = (node: React.ReactNode): string => {
                            if (typeof node === 'string') return node;
                            if (typeof node === 'number') return String(node);
                            if (Array.isArray(node)) return node.map(extractText).join('');
                            if (React.isValidElement(node)) {
                                const props = node.props as { children?: React.ReactNode };
                                if (props.children) {
                                    return extractText(props.children);
                                }
                            }
                            return '';
                        };

                        let suggestionText = extractText(children).trim();
                        const isSuggestion = suggestionText.startsWith('[SUGGESTION]');

                        if (isSuggestion && (onSuggestionClick || onFillInput)) {
                            // Remove the prefix for display
                            suggestionText = suggestionText.replace(/^\[SUGGESTION\]\s*/i, '').trim();

                            return (
                                <li className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/40 hover:from-purple-500/10 hover:to-blue-500/5 transition-all duration-300 group list-none mb-2">
                                    <button
                                        className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center hover:from-purple-500/40 hover:to-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                                        title="Click to fill input • Double-click to send"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onFillInput) onFillInput(suggestionText);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            if (onSuggestionClick) onSuggestionClick(suggestionText);
                                        }}
                                    >
                                        <SendHorizontal size={14} className="text-purple-400 group-hover:text-purple-300" />
                                    </button>
                                    <span
                                        className="flex-1 text-white/80 group-hover:text-white transition-colors cursor-pointer"
                                        onClick={() => onFillInput && onFillInput(suggestionText)}
                                    >
                                        {suggestionText}
                                    </span>
                                </li>
                            );
                        }

                        // Default list item rendering
                        return (
                            <li className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-purple-400/60 mb-1">
                                {children}
                            </li>
                        );
                    },
                    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-3xl font-bold mb-6 mt-8 first:mt-0 text-white flex items-center gap-3 pb-4 border-b border-white/10"><span>🔍</span> {children}</h1>,
                    h2: ({ children }: { children?: React.ReactNode }) => {
                        const content = Array.isArray(children) ? children.join('') : children?.toString() || '';
                        const lowerContent = content.toLowerCase();
                        const icon = lowerContent.includes('findings') ? '📌' :
                            lowerContent.includes('summary') ? '📊' :
                                lowerContent.includes('sources') ? '🌐' :
                                    lowerContent.includes('insights') ? '🚀' : '🔹';
                        return <h2 className="text-xl font-semibold mb-4 mt-8 first:mt-0 text-blue-100 bg-white/5 p-3 rounded-lg border-l-4 border-blue-500 flex items-center gap-2 shadow-sm">{typeof children === 'string' && <span>{icon}</span>} {children}</h2>;
                    },
                    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-semibold mb-3 mt-6 first:mt-0 text-purple-100 flex items-center gap-2"><span className="text-purple-400">•</span> {children}</h3>,
                    table: ({ children }: { children?: React.ReactNode }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-white/10 shadow-lg bg-[#0d1117]">
                            <table className="min-w-full divide-y divide-white/10 text-sm">{children}</table>
                        </div>
                    ),
                    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-white/10 text-white font-semibold">{children}</thead>,
                    th: ({ children }: { children?: React.ReactNode }) => <th className="px-6 py-4 text-left text-xs font-bold text-blue-200 uppercase tracking-wider border-b border-white/10">{children}</th>,
                    td: ({ children }: { children?: React.ReactNode }) => <td className="px-6 py-4 whitespace-nowrap text-gray-300 border-t border-white/5 hover:bg-white/5 transition-colors">{children}</td>,
                    blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-purple-500/50 pl-6 italic my-6 text-gray-300 bg-gradient-to-r from-purple-500/10 to-transparent py-4 rounded-r-xl shadow-inner">{children}</blockquote>,


                    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                        if (!href) return <span className="text-blue-400">{children}</span>;

                        let hostname = '';
                        try {
                            hostname = new URL(href).hostname;
                        } catch {
                            // invalid url
                        }

                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300 align-baseline">
                                {hostname && (
                                    <span className="inline-block relative top-0.5 shrink-0">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={`https://www.google.com/s2/favicons?domain=${hostname}`} alt={hostname} />
                                            <AvatarFallback className="text-[8px] bg-white/10 text-white/50">{hostname.substring(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </span>
                                )}
                                <span>{children}</span>
                            </a>
                        );
                    },
                    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <MarkdownImage {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div >
    );
});

StreamingAIResponse.displayName = 'StreamingAIResponse';

export default StreamingAIResponse;

