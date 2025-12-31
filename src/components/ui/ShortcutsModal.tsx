import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: 'Enter', description: 'Send message' },
    { key: 'Shift + Enter', description: 'New line' },
    { key: 'Esc', description: 'Close modals/sidebars' },
    { key: 'Ctrl + /', description: 'Focus input' },
    { key: 'Ctrl + K', description: 'Clear chat' },
    { key: 'Ctrl + B', description: 'Toggle sidebar' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        {/* Keyboard Shortcuts Header */}
                        <div className="flex items-center gap-2 text-white/90">
                            <Keyboard size={20} className="text-purple-400" />
                            <h2 className="font-medium">Keyboard Shortcuts</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                <span className="text-white/60 group-hover:text-white/90 transition-colors text-sm">{shortcut.description}</span>
                                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 font-mono border border-white/5">{shortcut.key}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
