'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Copy, Download, Play, RefreshCw, Code2, Eye, EyeOff,
    ChevronLeft, ChevronRight, Maximize2, Minimize2, Check,
    FileCode, FileJson, FileText, Braces, FileType, Sparkles, Loader2, MessageSquare
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeFile {
    id: string;
    name: string;
    language: string;
    content: string;
}

interface CodeCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    files: CodeFile[];
    onFilesChange?: (files: CodeFile[]) => void;
    title?: string;
    onApplyCode?: (files: CodeFile[]) => void;
    onSyncToChat?: (files: CodeFile[]) => void;
    isGenerating?: boolean;
}

// Get file icon based on language/extension
const getFileIcon = (language: string) => {
    switch (language) {
        case 'javascript':
        case 'typescript':
        case 'tsx':
        case 'jsx':
            return <FileCode size={14} className="text-yellow-400" />;
        case 'json':
            return <FileJson size={14} className="text-amber-400" />;
        case 'css':
        case 'scss':
        case 'sass':
            return <Braces size={14} className="text-blue-400" />;
        case 'html':
            return <FileType size={14} className="text-orange-400" />;
        default:
            return <FileText size={14} className="text-gray-400" />;
    }
};

// Get Monaco language from file extension
const getMonacoLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'sql': 'sql',
    };
    return langMap[ext] || 'plaintext';
};

export default function CodeCanvas({
    isOpen,
    onClose,
    files,
    onFilesChange,

    title = 'Code Canvas',
    onApplyCode,
    onSyncToChat,
    isGenerating = false
}: CodeCanvasProps) {
    const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || '');
    const [showPreview, setShowPreview] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const previewRef = useRef<HTMLIFrameElement>(null);

    // Get active file
    const activeFile = files.find(f => f.id === activeFileId) || files[0];

    // Handle code change
    const handleCodeChange = useCallback((value: string | undefined) => {
        if (!value || !activeFile) return;
        const updatedFiles = files.map(f =>
            f.id === activeFile.id ? { ...f, content: value } : f
        );
        onFilesChange?.(updatedFiles);
    }, [activeFile, files, onFilesChange]);

    // Generate preview HTML
    const generatePreview = useCallback(() => {
        const htmlFile = files.find(f => f.name.endsWith('.html'));
        const cssFile = files.find(f => f.name.endsWith('.css'));
        const jsFile = files.find(f => f.name.endsWith('.js') || f.name.endsWith('.jsx'));

        let previewHtml = htmlFile?.content || '';

        // If no HTML file, wrap content in basic HTML
        if (!htmlFile) {
            previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
            min-height: 100vh;
            color: white;
        }
        ${cssFile?.content || ''}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        ${jsFile?.content || ''}
    </script>
</body>
</html>`;
        } else {
            // Inject CSS and JS into existing HTML
            if (cssFile && !previewHtml.includes(cssFile.content)) {
                previewHtml = previewHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
            }
            if (jsFile && !previewHtml.includes(jsFile.content)) {
                previewHtml = previewHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
            }
        }

        return previewHtml;
    }, [files]);

    // Refresh preview
    const refreshPreview = useCallback(() => {
        setIsRefreshing(true);
        if (previewRef.current) {
            const previewHtml = generatePreview();
            previewRef.current.srcdoc = previewHtml;
        }
        setTimeout(() => setIsRefreshing(false), 500);
    }, [generatePreview]);

    // Auto-refresh preview when code changes
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshPreview();
        }, 1000);
        return () => clearTimeout(timer);
    }, [files, refreshPreview]);

    // Copy all code
    const handleCopyAll = useCallback(async () => {
        const allCode = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
        await navigator.clipboard.writeText(allCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [files]);

    // Copy active file
    const handleCopyActive = useCallback(async () => {
        if (!activeFile) return;
        await navigator.clipboard.writeText(activeFile.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [activeFile]);

    // Download all files as zip (simplified - just downloads active file)
    const handleDownload = useCallback(() => {
        if (!activeFile) return;
        const blob = new Blob([activeFile.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [activeFile]);

    // Apply code (use it)
    const handleApply = useCallback(() => {
        onApplyCode?.(files);
    }, [files, onApplyCode]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, isFullscreen, onClose]);

    if (!isOpen || files.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed right-0 top-0 h-full bg-[#0d0d1a] border-l border-white/10 shadow-2xl z-40 flex flex-col ${isFullscreen ? 'w-full' : 'w-[55%] min-w-[600px] max-w-[900px]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                                <Code2 size={16} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white">{title}</h2>
                                <p className="text-xs text-white/40">{files.length} file(s)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Toggle Preview */}
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`p-2 rounded-lg transition-colors ${showPreview
                                ? 'text-emerald-400 bg-emerald-500/20'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            title={showPreview ? 'Hide preview' : 'Show preview'}
                        >
                            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>

                        {/* Refresh Preview */}
                        <button
                            onClick={refreshPreview}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Refresh preview"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>

                        {/* Copy */}
                        <button
                            onClick={handleCopyActive}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Copy code"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>

                        {/* Download */}
                        <button
                            onClick={handleDownload}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Download file"
                        >
                            <Download size={16} />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* File Tabs */}
                <div className="flex items-center gap-1 px-2 py-2 border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
                    {files.map((file) => (
                        <button
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeFileId === file.id
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {getFileIcon(file.language)}
                            {file.name}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex ${showPreview ? 'flex-row' : 'flex-col'} overflow-hidden`}>
                    {/* Code Editor */}
                    <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full flex flex-col border-r border-white/5`}>
                        <div className="flex-1 overflow-hidden">
                            <MonacoEditor
                                height="100%"
                                language={activeFile?.language || 'javascript'}
                                value={activeFile?.content || ''}
                                onChange={handleCodeChange}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 16, bottom: 16 },
                                    wordWrap: 'on',
                                    tabSize: 2,
                                    renderWhitespace: 'selection',
                                    cursorBlinking: 'smooth',
                                    smoothScrolling: true,
                                    bracketPairColorization: { enabled: true },
                                }}
                            />
                        </div>
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <div className="w-1/2 h-full flex flex-col bg-white">
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">Preview</span>
                                </div>
                                <button
                                    onClick={refreshPreview}
                                    className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                                >
                                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            <iframe
                                ref={previewRef}
                                className="flex-1 w-full bg-white"
                                sandbox="allow-scripts allow-same-origin"
                                title="Preview"
                            />
                        </div>
                    )}

                    {/* Generating Overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
                                <Loader2 size={32} className="text-emerald-500 animate-spin" />
                                <p className="text-gray-300 font-medium">Generating Code...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/40 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyAll}
                            className="px-3 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Copy size={12} />
                            Copy All
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onSyncToChat && (
                            <button
                                onClick={() => onSyncToChat(files)}
                                className="px-3 py-2 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                                title="Sync edits back to chat context"
                            >
                                <MessageSquare size={16} />
                                Sync to Chat
                            </button>
                        )}

                        {onApplyCode && (
                            <button
                                onClick={handleApply}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                            >
                                <Sparkles size={16} />
                                Apply Code
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
