'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Layout, FileJson, Boxes, AppWindow, Terminal, ChevronUp } from 'lucide-react';

export interface CodeTemplate {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    files: Array<{ name: string; language: string; content: string }>;
    prompt?: string;
}

const codeTemplates: CodeTemplate[] = [
    {
        id: 'landing-page',
        label: 'Landing Page',
        icon: <Layout size={16} />,
        description: 'Design a website landing page',
        files: [], // AI will generate
        prompt: "Create a modern, responsive landing page with a hero section, features list, and call to action. Use beautiful gradients and glassmorphism. Return index.html and styles.css."
    },
    {
        id: 'react-component',
        label: 'React Component',
        icon: <Boxes size={16} />,
        description: 'Modern React functional component',
        files: [],
        prompt: "Create a modern React component with TypeScript and Framer Motion animations. Return Component.tsx and a usage example in App.tsx."
    },
    {
        id: 'dashboard',
        label: 'Dashboard Layout',
        icon: <AppWindow size={16} />,
        description: 'Admin dashboard structure',
        files: [],
        prompt: "Create a modern admin dashboard layout with a sidebar, header, and stats cards grid. Use HTML/CSS or React."
    },
    {
        id: 'threejs',
        label: '3D Scene',
        icon: <Boxes size={16} />,
        description: 'Interactive 3D scene (Three.js)',
        files: [],
        prompt: "Create a simple interactive 3D scene using Three.js or React Three Fiber. Return index.html with the setup."
    },
    {
        id: 'empty',
        label: 'Custom Project',
        icon: <Terminal size={16} />,
        description: 'Start from scratch with AI',
        files: [],
        prompt: "Create a basic project structure."
    },
];

interface CodingButtonProps {
    onSelectTemplate: (template: CodeTemplate) => void;
    disabled?: boolean;
}

export default function CodingButton({ onSelectTemplate, disabled }: CodingButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (template: CodeTemplate) => {
        setIsOpen(false);
        onSelectTemplate(template);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`p-2 rounded-full transition-all duration-200 flex items-center gap-1 ${isOpen
                    ? 'text-cyan-400 bg-cyan-500/20'
                    : 'text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10'
                    } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
                title="Open Coding Canvas"
            >
                <Code2 size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-cyan-900/30 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-white/10 bg-cyan-500/10">
                            <p className="text-xs text-white/60 font-medium">Start Coding Project</p>
                        </div>

                        {/* Options */}
                        <div className="p-1.5 space-y-0.5">
                            {codeTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelect(template)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                                        {template.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">{template.label}</p>
                                        <p className="text-xs text-white/40">{template.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer tip */}
                        <div className="px-3 py-2 border-t border-white/5 bg-black/20">
                            <p className="text-[10px] text-white/30 text-center">
                                Open a live coding environment with instant preview
                            </p>
                        </div>

                        {/* Arrow indicator */}
                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/10 transform rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
