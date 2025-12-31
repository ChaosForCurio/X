'use client';
 

import { Plus, Download, Maximize, Minimize, SquarePen, Trash2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toggle3D from '../ui/Toggle3D';
import dynamic from 'next/dynamic';
import { useChatLogic } from '@/hooks/useChatLogic';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import { cn } from '@/lib/utils';
import { ArrowDown, Code, Image as ImageIcon, Search, PenSquare } from 'lucide-react';

import SmartContextBar from './SmartContextBar';
import PredictiveActions from './PredictiveActions';

// Dynamic imports
const CodeCanvas = dynamic(() => import('../ui/CodeCanvas'), { ssr: false });
const PostConfigModal = dynamic(() => import('../ui/PostConfigModal'), { ssr: false });
const SocialPreview = dynamic(() => import('../ui/SocialPreview'), { ssr: false });

export default function ChatArea() {

    // Use the Custom Hook
    const {
        user,
        inputPrompt, setInputPrompt,
        chatHistory,
        isLoading,
        isAnalyzing, analysisPrompt, setAnalysisPrompt,
        selectedImage, selectedPdf,
        isFullscreen, toggleFullscreen,
        showScrollButton,

        isLeftSidebarOpen, toggleLeftSidebar,
        isRightSidebarOpen, toggleRightSidebar,
        startNewChat,

        isCodeCanvasOpen, setIsCodeCanvasOpen,
        codeCanvasFiles, setCodeCanvasFiles,
        codeCanvasTitle,
        isCanvasGenerating,

        isPostConfigModalOpen, setIsPostConfigModalOpen,
        isSocialPreviewOpen, setIsSocialPreviewOpen,
        generatedPostContent,
        lastPostImageUrl,

        messagesEndRef,
        fileInputRef,
        textareaRef,

        handleSend,
        handleKeyDown,
        handleFileSelect,
        handleRemoveImage,
        handleTechNews,
        handleCreatePost,
        handleGeneratePost,
        handleOpenCodingCanvas,

        avatarMode,
        clearHistory
    } = useChatLogic();

    // Determine last message type for Predictive Actions
    const lastAiMessage = chatHistory.filter(m => m.role === 'ai').pop();
    const lastMessageType = lastAiMessage?.content.includes('```') ? 'code' :
        lastAiMessage?.content.startsWith('![') ? 'image' :
            lastAiMessage ? 'text' : undefined;

    const handlePredictiveAction = (actionId: string) => {
        switch (actionId) {
            case 'open_canvas':
                setIsCodeCanvasOpen(true);
                break;
            case 'explain_code':
                handleSend("Can you explain the code you just wrote?");
                break;
            case 'search_web':
                setInputPrompt("@web ");
                textareaRef.current?.focus();
                break;
            case 'generate_image':
                setInputPrompt("@image ");
                textareaRef.current?.focus();
                break;
            case 'create_post':
                handleCreatePost();
                break;
        }
    };

    const tokenCount = chatHistory.reduce((acc, msg) => acc + (msg.content.split(/\s+/).length * 1.3), 0) + (inputPrompt.split(/\s+/).length * 1.3);

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden outline-none bg-[#0a0a0a]">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
            </div>

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl z-30 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:block">
                            <Toggle3D type="panel" side="left" isOpen={isLeftSidebarOpen} onClick={toggleLeftSidebar} />
                        </div>
                        <button
                            onClick={toggleLeftSidebar}
                            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                        >
                            <span className="sr-only">Toggle Sidebar</span>
                            {isLeftSidebarOpen ? '<' : '>'}
                        </button>
                    </div>

                    <button
                        onClick={startNewChat}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all"
                        title="New Chat"
                    >
                        <Plus size={16} className="text-white/60 group-hover:text-white transition-colors" />
                        <span className="text-xs font-medium text-white/60 group-hover:text-white">New Chat</span>
                    </button>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="font-semibold text-white/90 tracking-tight text-sm flex items-center gap-2">
                        Xieriee 2.0
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/60 border border-white/10">Flamethrower</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Token Counter */}
                    <div className="hidden md:flex items-center px-3 py-1.5 bg-black/40 rounded-full border border-white/5">
                        <span className="text-[10px] text-white/40 font-mono tracking-wider">
                            {Math.round(tokenCount).toLocaleString()} TOKENS
                        </span>
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

                    <div className="flex items-center gap-1">
                        <ActionButton
                            icon={SquarePen}
                            onClick={handleCreatePost}
                            label="Create Post"
                            shortcut="Cmd+P"
                        />
                        <ActionButton
                            icon={Download}
                            onClick={() => {
                                const chatData = JSON.stringify(chatHistory, null, 2);
                                const blob = new Blob([chatData], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `xieriee-export-${Date.now()}.json`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                            }}
                            label="Export"
                        />
                        <ActionButton
                            icon={isFullscreen ? Minimize : Maximize}
                            onClick={toggleFullscreen}
                            label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        />
                    </div>

                    <div className="hidden lg:block ml-2">
                        <Toggle3D type="panel" side="right" isOpen={isRightSidebarOpen} onClick={toggleRightSidebar} />
                    </div>
                </div>
            </header>

            {/* Smart Context Bar */}
            <SmartContextBar
                isCodeCanvasOpen={isCodeCanvasOpen}
                isPostStudioOpen={isSocialPreviewOpen}
                isWebSearchActive={avatarMode === 'searching'}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative z-10">
                <ChatMessages
                    chatHistory={chatHistory}
                    user={user}
                    isLoading={isLoading}
                    isGeneratingImage={false}
                    avatarMode={avatarMode}
                    onDownload={(url) => window.open(url, '_blank')}
                    onSuggestionClick={(s) => handleSend(s)}
                    onFillInput={(s) => setInputPrompt(s)}
                    messagesEndRef={messagesEndRef}
                    onOpenCodeCanvas={(c, t) => { }}
                    onFeedback={() => { }}
                    onTrendingClick={(q) => handleSend(q)}
                />
            </div>

            {/* Input Area */}
            <div className="relative z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-10 pb-6">
                {/* Predictive Actions */}
                <div className="px-4 mb-2 flex justify-center">
                    <PredictiveActions
                        lastMessageType={lastMessageType}
                        onAction={handlePredictiveAction}
                    />
                </div>

                <ChatInput
                    inputPrompt={inputPrompt}
                    setInputPrompt={setInputPrompt}
                    handleSend={handleSend}
                    handleKeyDown={handleKeyDown}
                    isLoading={isLoading}
                    user={user}
                    isAnalyzing={isAnalyzing}
                    analysisPrompt={analysisPrompt}
                    setAnalysisPrompt={setAnalysisPrompt}
                    selectedImage={selectedImage}
                    selectedPdf={selectedPdf}
                    handleFileSelect={handleFileSelect}
                    handleRemoveImage={handleRemoveImage}
                    textareaRef={textareaRef}
                    fileInputRef={fileInputRef}
                    handleOpenCodingCanvas={handleOpenCodingCanvas}
                />

                <div className="text-center mt-2">
                    <p className="text-[10px] text-white/20 font-light tracking-widest hover:text-white/40 transition-colors cursor-default">
                        AI may produce inaccurate information. Verify important details.
                    </p>
                </div>
            </div>


            {/* Scroll to Bottom Button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                        className="fixed bottom-32 right-8 p-3 bg-white/10 backdrop-blur border border-white/10 text-white rounded-full shadow-lg z-50 hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                        aria-label="Scroll to bottom"
                    >
                        <ArrowDown className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modals */}
            <CodeCanvas
                isOpen={isCodeCanvasOpen}
                onClose={() => setIsCodeCanvasOpen(false)}
                files={codeCanvasFiles}
                onFilesChange={setCodeCanvasFiles}
                title={codeCanvasTitle}
                isGenerating={isCanvasGenerating}
                onApplyCode={(files) => {
                    const allCode = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
                    navigator.clipboard.writeText(allCode);
                    setIsCodeCanvasOpen(false);
                }}
                onSyncToChat={async (files) => {
                    const allCode = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
                    await handleSend(`Updated code:\n${allCode}`);
                }}
            />

            <PostConfigModal
                isOpen={isPostConfigModalOpen}
                onClose={() => setIsPostConfigModalOpen(false)}
                onGenerate={handleGeneratePost}
            />

            {isSocialPreviewOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
                    <div className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/10">
                        {/* Studio Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Post Studio</h2>
                                <p className="text-sm text-white/40">Preview and refine your social media content</p>
                            </div>
                            <button
                                onClick={() => setIsSocialPreviewOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                            >
                                <Plus className="rotate-45 w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-grid-pattern">
                            <div className="max-w-3xl mx-auto py-8">
                                <SocialPreview
                                    content={generatedPostContent}
                                    imageUrl={lastPostImageUrl || undefined}
                                    onClose={() => setIsSocialPreviewOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon: Icon, onClick, label, shortcut }: { icon: LucideIcon, onClick: () => void, label: string, shortcut?: string }) {
    return (
        <button
            onClick={onClick}
            className="group relative p-2 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-white"
            title={label}
        >
            <Icon size={18} />
            {/* Tooltip */}
            <span className="absolute top-full right-0 translate-y-2 px-2 py-1 bg-black/80 backdrop-blur border border-white/10 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {label} {shortcut && <span className="opacity-50 ml-1">({shortcut})</span>}
            </span>
        </button>
    );
}
