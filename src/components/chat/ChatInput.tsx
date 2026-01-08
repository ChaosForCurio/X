'use client';

import { Send, Paperclip, X, FileText, Loader2, UploadCloud, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import SpeechToText from '../ui/SpeechToText';
import CodingButton, { CodeTemplate } from '../ui/CodingButton';
import { User } from '@stackframe/stack';

interface ChatInputProps {
    inputPrompt: string;
    setInputPrompt: (val: string) => void;
    handleSend: (overridePrompt?: string, overrideImage?: string | null, overrideFile?: File | null) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    isLoading: boolean;
    user: User | null;
    isAnalyzing: boolean;
    analysisPrompt: string;
    setAnalysisPrompt: (val: string) => void;

    // File State
    selectedImage: string | null;
    selectedPdf: { file: File, text: string, name: string } | null;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: () => void;

    // Web Search
    isWebSearchEnabled: boolean;
    toggleWebSearch: () => void;

    // Refs
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Coding
    handleOpenCodingCanvas: (template: CodeTemplate) => void;
}

export default function ChatInput({
    inputPrompt, setInputPrompt, handleSend, handleKeyDown, isLoading, user,
    isAnalyzing, analysisPrompt, setAnalysisPrompt,
    selectedImage, selectedPdf, handleFileSelect, handleRemoveImage,
    isWebSearchEnabled, toggleWebSearch,
    textareaRef, fileInputRef, handleOpenCodingCanvas
}: ChatInputProps) {

    const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            toast.error('Invalid file type');
            return;
        }
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            const event = { target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(event);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        accept: { 'image/*': [], 'application/pdf': [] }
    });

    return (
        <div {...getRootProps()} className="p-6 max-w-4xl w-full mx-auto z-20 relative outline-none">
            <input {...getInputProps()} />

            {/* Drag Overlay */}
            <AnimatePresence>
                {isDragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-[2rem] pointer-events-none"
                    >
                        <div className="flex flex-col items-center gap-2 text-purple-400">
                            <UploadCloud className="w-10 h-10 animate-bounce" />
                            <p className="font-medium">Drop to attach</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative group">
                {/* Animated Gradient Border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-[2rem] opacity-30 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

                <div className="relative bg-[#0a0a0a] rounded-[1.8rem] border border-white/10 shadow-2xl shadow-purple-900/20 overflow-hidden">
                    {/* Previews */}
                    <AnimatePresence>
                        {(selectedImage || selectedPdf) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, padding: 0 }}
                                animate={{ opacity: 1, height: 'auto', padding: '16px' }}
                                exit={{ opacity: 0, height: 0, padding: 0 }}
                                className="px-4 pt-4 bg-black/20"
                            >
                                <div className="relative inline-block overflow-hidden rounded-xl">
                                    {selectedPdf ? (
                                        <div className="h-20 w-auto min-w-[160px] px-4 flex flex-row items-center gap-3 bg-white/10 rounded-xl border border-white/20 text-white/90">
                                            <div className="p-2 bg-red-500/20 rounded-lg">
                                                <FileText size={24} className="text-red-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate max-w-[120px]" title={selectedPdf.name}>{selectedPdf.name}</span>
                                                <span className="text-[10px] text-white/50">PDF Document</span>
                                            </div>
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selectedImage!} alt="Preview" className="h-20 w-auto rounded-xl border border-white/20" />
                                    )}

                                    {/* Scan Animation */}
                                    {isAnalyzing && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent z-10"
                                            initial={{ top: '-100%' }}
                                            animate={{ top: '100%' }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        />
                                    )}

                                    <button
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 shadow-lg z-20 group"
                                    >
                                        <X size={14} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Vision Badge */}
                    <AnimatePresence>
                        {analysisPrompt && !isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="px-4 pb-2 bg-black/20"
                            >
                                <div className="flex items-center gap-2 p-2 px-3 bg-purple-500/10 border border-purple-500/20 rounded-xl group hover:bg-purple-500/20 transition-all duration-300">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-purple-400 font-medium uppercase tracking-wider mb-0.5">AI Vision Suggestion</p>
                                        <p className="text-xs text-white/70 line-clamp-1 italic">&quot;{analysisPrompt}&quot;</p>
                                    </div>
                                    <button
                                        onClick={() => { setInputPrompt(analysisPrompt); setAnalysisPrompt(''); }}
                                        className="shrink-0 px-2.5 py-1 bg-purple-500 text-white text-[11px] font-semibold rounded-lg hover:bg-purple-600 transition-colors"
                                    >
                                        Use
                                    </button>
                                    <button onClick={() => setAnalysisPrompt('')} className="p-1 text-white/30 hover:text-white/60">
                                        <X size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <textarea
                        ref={textareaRef}
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={!user ? "Please sign in..." : isAnalyzing ? "Analyzing..." : "Ask anything... (@image, @web)"}
                        disabled={!user}
                        className="w-full bg-transparent text-white placeholder-white/30 p-5 pl-7 pr-16 min-h-[60px] max-h-[200px] resize-none outline-none custom-scrollbar disabled:cursor-not-allowed disabled:opacity-50 text-[15px] leading-relaxed"
                        rows={1}
                    />

                    <div className="flex items-center justify-between px-4 pb-4 pt-1 bg-gradient-to-t from-black/40 to-transparent">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!user}
                                className="p-2 text-white/40 hover:text-purple-400 hover:bg-white/5 rounded-full transition-all duration-300 disabled:opacity-30"
                                title="Upload file"
                            >
                                <Paperclip size={20} />
                            </button>

                            {/* Web Search Toggle */}
                            <button
                                onClick={toggleWebSearch}
                                disabled={!user}
                                className={`p-2 rounded-full transition-all duration-300 ${isWebSearchEnabled
                                    ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                    : 'text-white/40 hover:text-blue-400 hover:bg-white/5'}`}
                                title={isWebSearchEnabled ? "Web Search Enabled" : "Enable Web Search"}
                            >
                                <motion.div
                                    animate={isWebSearchEnabled ? { rotate: 360 } : { rotate: 0 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                >
                                    <Globe size={20} />
                                </motion.div>
                            </button>

                            <SpeechToText
                                onTranscript={(text) => {
                                    const newPrompt = inputPrompt ? `${inputPrompt} ${text}` : text;
                                    setInputPrompt(newPrompt);
                                    handleSend(newPrompt);
                                }}
                                disabled={!user}
                                continuous={false}
                            />
                            <CodingButton
                                onSelectTemplate={handleOpenCodingCanvas}
                                disabled={!user}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, application/pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <button
                            onClick={() => handleSend()}
                            disabled={!user || (!inputPrompt.trim() && !selectedImage && !selectedPdf && !isWebSearchEnabled) || isLoading}
                            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${user && (inputPrompt.trim() || selectedImage || selectedPdf || isWebSearchEnabled) && !isLoading
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/25 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                                } `}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
