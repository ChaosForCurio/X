'use client';
/* eslint-disable @next/next/no-img-element */

import imageCompression from 'browser-image-compression';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Maximize2, Trash2, Check, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUser } from "@stackframe/stack";
import { toast } from 'sonner';

type AspectRatio = 'original' | '16:9' | '3:2' | '4:3' | '5:3' | '2:1' | '21:9' | '32:9' | '3.55:1';

const ASPECT_RATIOS: { [key in AspectRatio]: { label: string, ratio: number | null, desc: string } } = {
    'original': { label: 'Original', ratio: null, desc: 'Full Size' },
    '16:9': { label: '16:9', ratio: 16 / 9, desc: 'YouTube, TV' },
    '3:2': { label: '3:2', ratio: 3 / 2, desc: 'DSLR, Photos' },
    '4:3': { label: '4:3', ratio: 4 / 3, desc: 'Old TV' },
    '5:3': { label: '5:3', ratio: 5 / 3, desc: 'Modern UI' },
    '2:1': { label: '2:1', ratio: 2 / 1, desc: 'Cinematic' },
    '21:9': { label: '21:9', ratio: 21 / 9, desc: 'Ultrawide' },
    '32:9': { label: '32:9', ratio: 32 / 9, desc: 'Super Ultrawide' },
    '3.55:1': { label: '3.55:1', ratio: 3.55 / 1, desc: 'High Cinema' },
};

export default function UploadModal() {
    const { isUploadModalOpen, toggleUploadModal, addToFeed } = useApp();
    const user = useUser();
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [currentAspectRatio, setCurrentAspectRatio] = useState<AspectRatio>('original');
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; ratio: string } | null>(null);

    const analyzeImage = async (base64Image: string) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: "Analyze this image and generate a highly detailed, professional AI image generation prompt. Structure it to include: Subject, Art Style, Lighting, Color Palette, and Composition. The output should be a single, cohesive paragraph suitable for a high-end image generator. Do not include any introductory text like 'Here is a prompt', just give the prompt itself.",
                    image: base64Image
                }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (data.error) {
                    console.error("API Error Details:", data.details);
                    toast.error(`AI Error: ${data.details || data.error}`);
                } else if (data.response) {
                    toast.success("Image successfully analyzed!");
                    setPrompt(data.response);
                } else {
                    console.warn("No response field in data:", data);
                    toast.error("AI could not generate a prompt. Please try again or use a different image.");
                }
            } else {
                const text = await res.text();
                console.error("Server returned non-JSON response:", text);
                if (text.includes("Request Entity Too Large") || res.status === 413) {
                    toast.error("Image is too large. Please upload a smaller image.");
                } else {
                    toast.error("An error occurred while analyzing the image.");
                }
            }
        } catch (error) {
            console.error("Error analyzing image:", error);
            toast.error("Failed to analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getGCD = (a: number, b: number): number => {
        return b === 0 ? a : getGCD(b, a % b);
    };

    const cropImage = async (file: File, ratio: number | null): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    let width = img.width;
                    let height = img.height;

                    if (ratio) {
                        // Calculate crop dimensions
                        const currentRatio = width / height;
                        if (currentRatio > ratio) {
                            // Image is wider than target ratio, crop width
                            width = height * ratio;
                        } else {
                            // Image is taller than target ratio, crop height
                            height = width / ratio;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Center crop
                    const sourceX = (img.width - width) / 2;
                    const sourceY = (img.height - height) / 2;

                    ctx.drawImage(img, sourceX, sourceY, width, height, 0, 0, width, height);
                    resolve(canvas.toDataURL(file.type));
                };
                img.onerror = (err) => {
                    console.error("Image object loading error:", err);
                    reject(new Error('Failed to load image object.'));
                };
                img.src = e.target?.result as string;
            };
            reader.onerror = (err) => {
                console.error("FileReader error:", err);
                reject(new Error('Failed to read file.'));
            };
            reader.readAsDataURL(file);
        });
    };

    const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const processFile = async (file: File, ratioKey: AspectRatio = currentAspectRatio) => {
        setIsProcessing(true);
        try {
            if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {

                // 1. Crop Image if needed
                const targetRatio = ASPECT_RATIOS[ratioKey].ratio;
                let fileToCompress = file;

                try {
                    const croppedDataUrl = await cropImage(file, targetRatio);
                    fileToCompress = dataURLtoFile(croppedDataUrl, file.name);
                } catch (cropError) {
                    console.warn("Cropping failed, using original image:", cropError);
                    // Fallback to original file if cropping fails, but still try to compress
                }

                // 2. Compress Image
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };

                let compressedFile;
                try {
                    compressedFile = await imageCompression(fileToCompress, options);
                } catch (compressionError) {
                    console.warn("Compression failed, falling back to non-worker compression:", compressionError);
                    // Retry without web worker if it fails
                    compressedFile = await imageCompression(fileToCompress, { ...options, useWebWorker: false });
                }

                setFileToUpload(compressedFile);

                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    setSelectedImage(result);

                    // Calculate dimensions and ratio
                    const img = new Image();
                    img.onload = () => {
                        const gcd = getGCD(img.width, img.height);
                        const ratioStr = `${(img.width / gcd).toFixed(0)}:${(img.height / gcd).toFixed(0)}`;
                        setImageDimensions({
                            width: img.width,
                            height: img.height,
                            ratio: ratioStr
                        });
                    };
                    img.src = result;

                    // Only analyze if it's a new file (not just a resize of the same file)
                    // Note: We analyze the PROCESSED image now
                    if (!prompt) analyzeImage(result);
                };
                reader.readAsDataURL(compressedFile);
            } else {
                toast.warning('Please upload a PNG or JPG image.');
            }
        } catch (error) {
            console.error("Processing failed:", error);
            if (error instanceof Error) {
                toast.error(`Failed to process image: ${error.message}`);
            } else {
                toast.error("Failed to process image. Please try a different one.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAspectRatioChange = async (ratioKey: AspectRatio) => {
        setCurrentAspectRatio(ratioKey);
        if (originalFile) {
            await processFile(originalFile, ratioKey);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalFile(file);
            setPrompt(''); // Reset prompt for new file
            await processFile(file, 'original'); // Reset to original ratio for new file
            setCurrentAspectRatio('original');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setOriginalFile(file);
            setPrompt('');
            await processFile(file, 'original');
            setCurrentAspectRatio('original');
        }
    };

    const handleRegenerate = () => {
        if (selectedImage) {
            analyzeImage(selectedImage);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage || !prompt.trim()) return;

        setIsSharing(true);

        const newItem = {
            user: user?.displayName || 'Anonymous',
            avatar: user?.profileImageUrl || 'https://i.pravatar.cc/150?img=68',
            prompt: prompt.trim(),
            image: selectedImage,
            type: 'image' as const,
        };

        try {
            await addToFeed(newItem, fileToUpload || undefined);
            // Wait a bit for the animation to play
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error("Failed to share:", error);
            toast.error("Failed to share to feed. Please try again.");
        } finally {
            setIsSharing(false);
            resetForm();
            toggleUploadModal();
        }
    };

    const resetForm = () => {
        setPrompt('');
        setSelectedImage(null);
        setFileToUpload(null);
        setOriginalFile(null);
        setCurrentAspectRatio('original');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (isSharing) return; // Prevent closing while sharing
        resetForm();
        toggleUploadModal();
    };

    return (
        <AnimatePresence>
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-300"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-[#121212]/90 border border-white/10 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl"
                    >
                        {/* Success Overlay */}
                        <AnimatePresence>
                            {isSharing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, type: "spring" }}
                                        className="w-24 h-24 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]"
                                    >
                                        <Check className="w-12 h-12 text-green-400" strokeWidth={3} />
                                    </motion.div>
                                    <motion.h3
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl font-bold text-white mb-2 tracking-tight"
                                    >
                                        Shared Successfully!
                                    </motion.h3>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-gray-400 text-lg"
                                    >
                                        Your masterpiece is now live in the community feed.
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                    <Sparkles className="text-purple-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white tracking-tight">
                                        Share to Community
                                    </h2>
                                    <p className="text-sm text-gray-400">Showcase your creations to the world</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                {/* Left Column: Image Upload */}
                                <div className="flex flex-col gap-4">
                                    <div
                                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`group relative flex-1 min-h-[300px] lg:min-h-0 border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${selectedImage
                                            ? 'border-purple-500/30 bg-purple-500/5'
                                            : isDragging
                                                ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
                                                : 'border-white/10 hover:border-purple-500/30 hover:bg-white/5'
                                            } ${isProcessing ? 'cursor-wait opacity-70' : ''}`}
                                    >
                                        {selectedImage ? (
                                            <>
                                                <div className="absolute inset-0 p-2">
                                                    <img
                                                        src={selectedImage}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain rounded-xl"
                                                    />
                                                </div>
                                                {!isProcessing && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                                        <div className="p-4 bg-black/50 rounded-full border border-white/10 mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                            <RefreshCw size={24} className="text-white" />
                                                        </div>
                                                        <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">Click to change image</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); resetForm(); }}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-colors z-10 opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-8">
                                                <div className="w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5 group-hover:border-purple-500/20">
                                                    <Upload size={40} className="text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                                                </div>
                                                <h3 className="text-xl font-medium text-white mb-2">Upload your masterpiece</h3>
                                                <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
                                                    Drag and drop your image here, or click to browse. Supports PNG & JPG up to 5MB.
                                                </p>
                                            </div>
                                        )}
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                                                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                                                <span className="text-white font-medium">Processing Image...</span>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Aspect Ratio Controls */}
                                    {selectedImage && (
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    <Maximize2 size={14} className="text-purple-400" />
                                                    Aspect Ratio
                                                </span>
                                                {imageDimensions && (
                                                    <span className="text-xs text-purple-300 font-mono bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20">
                                                        {imageDimensions.width} × {imageDimensions.height}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((key) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleAspectRatioChange(key)}
                                                        disabled={isProcessing}
                                                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${currentAspectRatio === key
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/50'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={ASPECT_RATIOS[key].desc}
                                                    >
                                                        <span>{ASPECT_RATIOS[key].label}</span>
                                                        <span className="text-[9px] opacity-60 font-normal truncate w-full text-center">
                                                            {ASPECT_RATIOS[key].desc}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Details & Actions */}
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                                    Prompt
                                                    {selectedImage && !isAnalyzing && !isProcessing && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRegenerate(); }}
                                                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-purple-500/10"
                                                            title="Regenerate AI Prompt"
                                                        >
                                                            <RefreshCw size={12} />
                                                            Regenerate
                                                        </button>
                                                    )}
                                                </label>
                                                {isAnalyzing && (
                                                    <span className="text-xs text-purple-400 flex items-center gap-1.5 animate-pulse font-medium bg-purple-500/10 px-2 py-1 rounded-md">
                                                        <Sparkles size={12} />
                                                        AI Analyzing...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative group h-[calc(100%-2rem)] min-h-[200px]">
                                                <textarea
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    placeholder={isAnalyzing ? "Magic is happening..." : "Describe your image or let AI do it for you..."}
                                                    disabled={isAnalyzing || isProcessing}
                                                    className={`w-full h-full bg-black/20 border rounded-2xl p-5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none transition-all font-light leading-relaxed text-base ${isAnalyzing || isProcessing ? 'border-purple-500/30 opacity-70 cursor-wait' : 'border-white/10 hover:border-white/20 hover:bg-black/30'}`}
                                                />
                                                {isAnalyzing && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-md rounded-2xl z-30">
                                                        <div className="relative">
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                                className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
                                                            />
                                                            <motion.div
                                                                animate={{ scale: [1, 1.2, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute inset-0 flex items-center justify-center"
                                                            >
                                                                <Sparkles size={24} className="text-purple-400" />
                                                            </motion.div>
                                                        </div>
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="mt-6 text-center"
                                                        >
                                                            <span className="text-lg text-white font-medium tracking-wide block">AI Vision Working</span>
                                                            <span className="text-sm text-purple-300 opacity-60">Crafting high-fidelity prompt...</span>
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-6 mt-auto">
                                        <button
                                            onClick={handleUpload}
                                            disabled={!selectedImage || !prompt.trim() || isAnalyzing || isSharing || isProcessing}
                                            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] ${selectedImage && prompt.trim() && !isAnalyzing && !isSharing && !isProcessing
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 ring-1 ring-white/10'
                                                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                                }`}
                                        >
                                            {isAnalyzing || isProcessing ? (
                                                <>Processing...</>
                                            ) : isSharing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sharing...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={20} />
                                                    Share to Feed
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
