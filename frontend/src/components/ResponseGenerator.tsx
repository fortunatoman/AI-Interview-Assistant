import { useEffect, useRef, useState } from 'react';
import { Brain, CheckCircle, AlertTriangle, Volume2, VolumeX, Send } from 'lucide-react';
import openaiService from '../services/openai';

interface ResponseGeneratorProps {
    question: string;
    onResponseGenerated: (response: string) => void;
    openaiConfigured?: boolean;
    resumeText?: string;
    jobDescription?: string;
    additionalContext?: string;
    onMuteToggle?: (muted: boolean) => void;
    isMuted?: boolean;
    // New props for manual typing + mic control
    onManualQuestionSubmit?: (question: string) => void;
    isListening?: boolean;
    stopListening?: () => void;
    startListening?: () => void;
    setSystemListening?: (listening: boolean) => void;
}

export default function ResponseGenerator({
    question,
    onResponseGenerated,
    openaiConfigured = false,
    resumeText = '',
    jobDescription = '',
    additionalContext = '',
    onMuteToggle,
    isMuted = false,
    onManualQuestionSubmit,
    isListening = false,
    stopListening,
    startListening,
    setSystemListening
}: ResponseGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [typedQuestion, setTypedQuestion] = useState('');
    const pausedByTypingRef = useRef(false);
    const detectedInputRef = useRef<HTMLTextAreaElement | null>(null);

    const autoResizeDetectedInput = () => {
        const el = detectedInputRef.current;
        if (!el) return;
        // Reset height to compute the correct scrollHeight
        el.style.height = 'auto';
        const maxHeightPx = 300; // grow up to this height, then scroll
        const nextHeight = Math.min(el.scrollHeight, maxHeightPx);
        el.style.height = `${nextHeight}px`;
        el.style.overflowY = el.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
    };
    // Removed responseSource to simplify logic

    const streamCleanupRef = useRef<null | (() => void)>(null);
    const responseTextRef = useRef('');

    const generateResponse = async (incoming: string): Promise<string> => {
        console.log('🔧 generateResponse (stream) called with:', incoming);
        setIsGenerating(true);
        setError(null);
        setCurrentResponse('');
        responseTextRef.current = '';

        // cancel previous stream if any
        try { streamCleanupRef.current?.(); } catch { }
        streamCleanupRef.current = null;

        try {
            if (!openaiConfigured || !openaiService.isConfigured()) {
                throw new Error('OpenAI is not configured. Please configure your API key first.');
            }

            const context = {
                resume: resumeText || undefined,
                jobDescription: jobDescription || undefined,
                additionalContext: additionalContext || undefined
            };

            const donePromise = new Promise<string>((resolve) => {
                openaiService
                    .streamAnswer({
                        question: incoming,
                        context,
                        onDelta: (delta) => {
                            responseTextRef.current += delta;
                            setCurrentResponse((prev) => prev + delta);
                        },
                        onDone: () => {
                            resolve(responseTextRef.current);
                        },
                        onError: (msg) => {
                            setError(msg);
                            resolve('');
                        },
                    })
                    .then((cleanup) => {
                        streamCleanupRef.current = cleanup;
                    })
                    .catch((e) => {
                        setError(e?.message || 'stream error');
                        resolve('');
                    });
            });

            const finalText = await donePromise;
            onResponseGenerated(finalText);
            return finalText;
        } catch (error: any) {
            setError(error.message);
            setCurrentResponse('');
            onResponseGenerated('');
            return '';
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        console.log('🧠 ResponseGenerator received question:', question);
        if (question) {
            // Populate textarea for visibility but do not focus; auto-generate immediately
            setTypedQuestion(question);
            autoResizeDetectedInput();
            generateResponse(question);
        }
    }, [question]);

    useEffect(() => {
        autoResizeDetectedInput();
    }, [typedQuestion]);

    const handleFocusInput = () => {
        if (isListening) {
            pausedByTypingRef.current = true;
            stopListening?.();
            setSystemListening?.(false);
        }
    };

    const handleBlurInput = () => {
        if (pausedByTypingRef.current) {
            pausedByTypingRef.current = false;
            startListening?.();
            setSystemListening?.(true);
        }
    };

    const submitTypedQuestion = async () => {
        const trimmed = typedQuestion.trim();
        if (!trimmed) return;
        // Optionally notify parent; generation is handled locally
        if (onManualQuestionSubmit) {
            onManualQuestionSubmit(trimmed);
        }
        setTypedQuestion('');
    };

    const clearTypedQuestion = () => {
        setTypedQuestion('');
        setTimeout(() => {
            detectedInputRef.current?.focus();
            handleFocusInput();
            autoResizeDetectedInput();
            stopListening?.();
            setSystemListening?.(false);
        }, 0);
    };

    return (
        <div className="bg-[#2c2c2c] rounded-md shadow-lg border border-gray-500 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-200">AI Response Generator</h3>
                </div>
                <div className="flex items-center text-xs rounded-full">
                    {onMuteToggle && (
                        <button
                            onClick={() => onMuteToggle(!isMuted)}
                            className={`p-1 rounded transition-colors flex items-center justify-center h-12 w-12 rounded-full text-white hover:scale-105 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                            title={isMuted ? 'Unmute Speech' : 'Mute Speech'}
                        >
                            {isMuted ? (
                                <VolumeX className="h-6 w-6" />
                            ) : (
                                <Volume2 className="h-6 w-6" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 p-4 bg-[#404040] rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-600 font-medium mb-2">Question Detected (edit or press Enter to send):</p>
                    <div className="flex items-center gap-2">
                        <button className="text-sm text-blue-600 font-medium mb-2" onClick={clearTypedQuestion}>
                            Clear
                        </button>
                    </div>
                </div>
                <div className="flex items-end gap-2">
                    <textarea
                        value={typedQuestion}
                        onChange={(e) => setTypedQuestion(e.target.value)}
                        onFocus={handleFocusInput}
                        onBlur={handleBlurInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submitTypedQuestion();
                            }
                        }}
                        rows={1}
                        ref={detectedInputRef}
                        className="flex-1 w-full text-sm resize-none px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={submitTypedQuestion}
                        disabled={!typedQuestion.trim()}
                        className="h-9 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm"
                        title="Send"
                    >
                        <Send className="h-4 w-4" />
                        Send
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Press Enter to send. Use Shift+Enter for a new line. Mic is paused while typing.</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Error</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <p className="text-xs text-red-600 mt-1">Please check your OpenAI configuration and try again.</p>
                </div>
            )}

            {isGenerating ? (
                <div className="flex items-center gap-3 p-4 bg-[#404040] rounded-lg">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-purple-600 font-medium">
                        OpenAI is thinking...
                    </span>
                </div>
            ) : currentResponse ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Response Ready</span>
                    </div>
                    <div className="p-4 bg-[#404040] rounded-lg border border-green-200">
                        <p className="text-gray-300 leading-relaxed">{currentResponse}</p>
                    </div>
                </div>
            ) : (
                <></>
            )}

        </div>
    );
}