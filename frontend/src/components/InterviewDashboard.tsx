import { useState, useCallback, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import SpeechRecognition from './SpeechRecognition';
import ResponseGenerator from './ResponseGenerator';
import TextToSpeech from './TextToSpeech';
import OpenAIConfig from './OpenAIConfig';
import DocumentManager from './DocumentManager';
import { useConversation } from '../hooks/useConversation';
import { useMicrophone } from '../hooks/useMicrophone';
import { useSystemAudio } from '../hooks/useSystemAudio';
import type { TextToSpeechRef } from '../types/speech';
import LiveTranscript from './LiveTranscript';
import useDeepgramLive from '../hooks/useDeepgramLive';
import useTranscriptBuffer from '../hooks/useTranscriptBuffer';
import { getSocket } from '../services/backend';
import createAudioAttribution from '../utils/audioAttribution';
import ConversationHistory from './ConversationHistory';

export default function InterviewDashboard() {
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentResponse, setCurrentResponse] = useState('');
    const [openaiConfigured, setOpenaiConfigured] = useState(false);
    const [isResponsePlaying, setIsResponsePlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');

    const textToSpeechRef = useRef<TextToSpeechRef>(null);
    const shareVideoRef = useRef<HTMLVideoElement>(null);

    // Custom hooks
    const { addQuestion, addResponse, conversations, clearHistory } = useConversation();
    const { isListening, toggleListening, transcript, isMicActive } = useMicrophone({
        onQuestionDetected: (question: string) => {
            console.log('🎤 Question detected in useMicrophone:', question);
            // Avoid duplicate history entries; rely on server detect:question
            setCurrentQuestion(question);
        }
    });

    // System audio capture (tab/system) for 2-way audio
    const { isSharing, startShare, stopShare, setListening: setSystemListening, stream: systemStream } = useSystemAudio({
        onQuestionDetected: (question: string) => {
            console.log('🖥️ Question detected from system audio:', question);
            // Avoid duplicate history entries; rely on server detect:question
            setCurrentQuestion(question);
        }
    });

    // Decouple system-audio transcription from mic listening: system stays active while sharing

    // If system audio sharing is active, mute TTS to avoid capturing our own AI response
    useEffect(() => {
        if (isSharing && textToSpeechRef.current) {
            textToSpeechRef.current.setMuted(true);
        }
    }, [isSharing]);

    // Bind the screen share media stream to the preview video element
    useEffect(() => {
        const video = shareVideoRef.current;
        if (!video) return;
        if (systemStream) {
            try {
                (video as any).srcObject = systemStream;
                const attemptPlay = () => {
                    setTimeout(() => {
                        video.play().catch(() => { /* ignore */ });
                    }, 0);
                };
                if (video.readyState >= 2) attemptPlay();
                else video.onloadedmetadata = attemptPlay;
            } catch {
                // no-op
            }
        } else {
            try {
                (video as any).srcObject = null;
                video.pause();
                video.removeAttribute('src');
                video.load();
            } catch {
                // no-op
            }
        }
    }, [systemStream]);

    // Live transcript buffered (dedup interim vs final)
    const { segments, upsertTranscript } = useTranscriptBuffer();
    // Track last 'them' finalized text to suppress duplicate 'me' lines when sharing
    const lastThemFinalRef = useRef<{ text: string; at: number } | null>(null);
    const lastMicSnapshotRef = useRef<string | null>(null);
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    // Middleware for consistent speaker attribution
    const attribution = createAudioAttribution({
        isSystemActive: () => !!systemStream,
        systemBiasMs: 500,
        vadThreshold: 0.06,
    });

    // Single Deepgram live session for system/tab audio → 'them'
    useDeepgramLive({
        stream: systemStream || null,
        enabled: !!systemStream,
        onTranscript: ({ text, isFinal }) => {
            const { speaker } = attribution.classifySystem();
            upsertTranscript({ speaker, text, isFinal });
            if (isFinal) {
                lastThemFinalRef.current = { text: normalize(text), at: Date.now() };
                // Rely solely on server detection to avoid duplicates
            }
        },
    });

    // Use Web Speech API output for 'me' to avoid needing a second Deepgram session
    // Push microphone interim/final to live transcript for fast local display
    const seenDetectIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const socket = getSocket();
        const onDetected = (payload: { id: string; question: string; source: string }) => {
            try {
                const id = String(payload?.id || '');
                const q = String(payload?.question || '').trim();
                if (!id || !q) return;
                const seen = seenDetectIdsRef.current;
                if (seen.has(id)) return;
                seen.add(id);
                setCurrentQuestion(q);
                addQuestion(q);
            } catch { }
        };
        socket.on('detect:question', onDetected);
        return () => {
            try { socket.off('detect:question', onDetected) } catch { }
        };
    }, [addQuestion]);

    useEffect(() => {
        // Poll for mic interim/final updates since __micLive is a global and doesn't trigger re-renders
        const timer = window.setInterval(() => {
            try {
                const micLive = (window as any).__micLive as { text: string; isFinal: boolean } | undefined;
                if (!micLive || !micLive.text) return;
                const snapshot = JSON.stringify(micLive);
                if (snapshot === lastMicSnapshotRef.current) return;
                lastMicSnapshotRef.current = snapshot;
                const vad = (window as any).__micVAD as { rms?: number; ts?: number } | undefined;
                const { accept, speaker } = attribution.classifyMic({ isFinal: micLive.isFinal, rms: vad?.rms });
                if (!accept) return;
                // Additional dedupe against very recent them finals to avoid echo artifacts
                if (isSharing && micLive.isFinal && lastThemFinalRef.current) {
                    const nowTs = Date.now();
                    const withinWindow = nowTs - lastThemFinalRef.current.at < 6000;
                    const micNorm = normalize(micLive.text);
                    const themNorm = lastThemFinalRef.current.text;
                    const isDuplicate = withinWindow && (micNorm === themNorm || micNorm.includes(themNorm) || themNorm.includes(micNorm));
                    if (isDuplicate) return;
                }
                upsertTranscript({ speaker, text: micLive.text, isFinal: micLive.isFinal });
                if (micLive.isFinal) {
                    try {
                        const socket = getSocket();
                        socket.emit('openai:detect:utterance', {
                            utterance: micLive.text,
                            source: 'speech',
                            context: {
                                resume: resumeText || undefined,
                                jobDescription: jobDescription || undefined,
                                additionalContext: additionalContext || undefined,
                            },
                        });
                    } catch { }
                }
            } catch { }
        }, 100);
        return () => { try { window.clearInterval(timer); } catch { } };
    }, [isSharing, attribution, upsertTranscript, resumeText, jobDescription, additionalContext]);

    const handleResponseGenerated = useCallback((response: string) => {
        setCurrentResponse(response);
        addResponse(response);
    }, [addResponse]);

    const handleSpeechStateChange = useCallback((playing: boolean, muted: boolean) => {
        setIsResponsePlaying(playing);
        setIsMuted(muted);
    }, []);

    const handleMuteToggle = useCallback((muted: boolean) => {
        setIsMuted(muted);
        // Update the TextToSpeech component's mute state
        if (textToSpeechRef.current) {
            textToSpeechRef.current.setMuted(muted);
        }
    }, []);

    const handleStopResponse = useCallback(() => {
        textToSpeechRef.current?.stop();
    }, []);

    const handleResumeUpdate = useCallback((text: string) => {
        setResumeText(text);
    }, []);

    const handleJobDescriptionUpdate = useCallback((text: string) => {
        setJobDescription(text);
    }, []);

    const handleAdditionalContextUpdate = useCallback((text: string) => {
        setAdditionalContext(text);
    }, []);

    return (
        <div className="min-h-screen bg-[#1a1a1a] from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-[#1a1a1a] shadow-sm border-b border-gray-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-40 h-10">
                                <img src="/logo.svg" alt="AI Interview Copilot" className="h-10 w-40" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">AI Interview Copilot</h1>
                                <p className="text-sm text-gray-300">Real-time interview question analysis & response generation</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Session Stats */}
                            <div className="hidden md:flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-green-600" />
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${!isMicActive ? 'bg-red-100 text-red-700' :
                                        isListening ? 'bg-green-100 text-green-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {!isMicActive ? 'No Mic' : isListening ? 'Live' : 'Ready'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Screen Share Preview (shown on top of voice input box while sharing) */}
                        {isSharing && (
                            <div className="bg-[#0f0f0f] border border-gray-700 rounded-md overflow-hidden">
                                <div className="px-3 py-2 text-xs text-gray-300 bg-[#0a0a0a] border-b border-gray-700">
                                    Screen Share Preview
                                </div>
                                <div className="relative">
                                    <video
                                        ref={shareVideoRef}
                                        className="w-full max-h-64 object-contain bg-black"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                    {(!systemStream || systemStream.getVideoTracks().length === 0) && (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 bg-black/60">
                                            No video in shared stream. Select a Tab or Window (and enable "Share audio") in the picker.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Speech Recognition */}
                        <SpeechRecognition
                            isListening={isListening}
                            onToggleListening={toggleListening}
                            onToggleShare={() => (isSharing ? stopShare() : startShare())}
                            onStopResponse={handleStopResponse}
                            isResponsePlaying={isResponsePlaying}
                            transcript={transcript}
                            isMicActive={isMicActive}
                            isSharing={isSharing}
                        />
                        {/* Live Transcript */}
                        <LiveTranscript segments={segments} />
                        {/* Hidden Text-to-Speech for automatic playback */}
                        <TextToSpeech
                            ref={textToSpeechRef}
                            text={currentResponse}
                            autoPlay={true}
                            onStateChange={handleSpeechStateChange}
                        />
                        {/* Document Manager */}
                        <DocumentManager
                            onResumeUpdate={handleResumeUpdate}
                            onJobDescriptionUpdate={handleJobDescriptionUpdate}
                            onAdditionalContextUpdate={handleAdditionalContextUpdate}
                            resumeText={resumeText}
                            jobDescription={jobDescription}
                            additionalContext={additionalContext}
                        />
                    </div>
                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Response Generator */}
                        <ResponseGenerator
                            question={currentQuestion}
                            onResponseGenerated={handleResponseGenerated}
                            openaiConfigured={openaiConfigured}
                            resumeText={resumeText}
                            jobDescription={jobDescription}
                            additionalContext={additionalContext}
                            onMuteToggle={handleMuteToggle}
                            isMuted={isMuted}
                            // Manual typing integration
                            onManualQuestionSubmit={(q) => {
                                // Route through backend detection; do not add to history here
                                try {
                                    const socket = getSocket();
                                    socket.emit('openai:detect:utterance', {
                                        utterance: q,
                                        source: 'typed',
                                        context: {
                                            resume: resumeText || undefined,
                                            jobDescription: jobDescription || undefined,
                                            additionalContext: additionalContext || undefined,
                                        },
                                    });
                                } catch { }
                            }}
                            isListening={isListening}
                            stopListening={() => {
                                // stop mic and system audio listening
                                if (isListening) toggleListening();
                            }}
                            startListening={() => {
                                if (!isListening) toggleListening();
                            }}
                            setSystemListening={setSystemListening}
                        />
                        {/* Conversation History */}
                        <ConversationHistory conversations={conversations} onClearHistory={clearHistory} />
                        {/* OpenAI Configuration */}
                        <OpenAIConfig onConfigChange={setOpenaiConfigured} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1a1a1a] border-t border-gray-600 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <p>AI Interview Copilot</p>
                        <p>Built with React + TypeScript + Tailwind CSS</p>
                    </div>
                </div>
            </div>
        </div>
    );
}