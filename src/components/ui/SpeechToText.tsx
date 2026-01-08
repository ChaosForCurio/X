'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import StarfishMicrophone from './StarfishMicrophone';

interface SpeechToTextProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
    continuous?: boolean;
}

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
        webkitAudioContext: typeof AudioContext;
    }
}

export default function SpeechToText({ onTranscript, disabled = false, continuous = false }: SpeechToTextProps) {
    // --- Restored State & Refs ---
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSupported] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const transcriptRef = useRef<string>('');
    const onTranscriptRef = useRef(onTranscript);

    // Keep callback fresh
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    // Warn if not supported
    useEffect(() => {
        if (!isSupported) {
            console.warn('[SpeechToText] Web Speech API not supported in this browser');
        }
    }, [isSupported]);

    // --- Audio Visualizer State ---
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Clean up audio context on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                toast.error('Speech recognition is not supported in your browser. Try Chrome or Edge.');
                return;
            }

            // Request microphone access specifically for visualizer too
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Initialize Audio Context for Visualizer
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            source.connect(analyser); // Only connect to analyser, not destination (to avoid echo)

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            // Start Audio Analysis Loop
            const updateAudioLevel = () => {
                if (!analyserRef.current) return;

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                // Normalize 0-255 to roughly 0-100, slightly amplified
                const level = Math.min(100, (average / 128) * 100);

                setAudioLevel(level);
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };

            updateAudioLevel();


            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            transcriptRef.current = '';

            // Configure recognition
            recognition.continuous = continuous;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                // Recognition started
                setIsRecording(true);
                toast.info(continuous ? '🎤 Listening... Click again to stop' : '🎤 Listening... Speak now');
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    transcriptRef.current += finalTranscript;
                }

                // console.log('[SpeechToText] Interim:', interimTranscript, 'Final:', finalTranscript);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('[SpeechToText] Recognition error:', event.error);

                if (event.error !== 'aborted') {
                    setIsRecording(false);
                    setIsProcessing(false);
                    // Stop visualizer
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                    setAudioLevel(0);
                }

                switch (event.error) {
                    case 'not-allowed':
                        toast.error('Microphone access denied.');
                        break;
                    case 'no-speech':
                        if (!continuous) toast.error('No speech detected. Please try again.');
                        break;
                    case 'audio-capture':
                        toast.error('No microphone found.');
                        break;
                    default:
                        break;
                }
            };

            recognition.onend = () => {
                // Recognition ended
                setIsRecording(false);
                setAudioLevel(0); // Reset visualizer

                // Stop visualizer loop
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                // Close context to stop microphone usage
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close();
                }

                const finalText = transcriptRef.current.trim();

                if (finalText) {
                    setIsProcessing(true);
                    setTimeout(() => {
                        onTranscriptRef.current(finalText);
                        toast.success('✅ Speech captured!');
                        setIsProcessing(false);
                    }, 300);
                } else {
                    setIsProcessing(false);
                }

                // Stop raw stream
                stream.getTracks().forEach(track => track.stop());
            };

            recognition.start();

        } catch (error) {
            console.error('[SpeechToText] Error starting recognition:', error);
            toast.error('Failed to start speech recognition');
            setIsRecording(false);
        }
    }, [continuous]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            // Stopping recognition
            recognitionRef.current.stop();
        }

        // Visualizer Cleanup
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setAudioLevel(0);

    }, []);

    const handleClick = () => {
        // console.log('[SpeechToText] Button clicked', { disabled, isProcessing, isRecording, isSupported });

        if (disabled || isProcessing) return;

        if (!isSupported) {
            toast.error('Speech recognition is not supported in your browser.');
            return;
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="relative flex items-center justify-center">
            <StarfishMicrophone
                isRecording={isRecording}
                onClick={handleClick}
                disabled={disabled || isProcessing || !isSupported}
                audioLevel={audioLevel}
            />

            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-1 -right-1 z-20 bg-purple-500 rounded-full p-1"
                    >
                        <Loader2 size={12} className="animate-spin text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
