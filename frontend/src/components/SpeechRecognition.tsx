import { useState, useEffect } from 'react';
import { Mic, MicOff, Square, ScreenShare } from 'lucide-react';

interface SpeechRecognitionProps {
    onQuestionDetected?: (question: string) => void;
    isListening: boolean;
    onToggleListening: () => void;
    onToggleShare?: () => void;
    isSharing?: boolean;
    onStopResponse?: () => void;
    isResponsePlaying?: boolean;
    transcript?: string;
    isMicActive?: boolean;
}

export default function SpeechRecognition({
    isListening,
    onToggleListening,
    onToggleShare,
    onStopResponse,
    isResponsePlaying = false,
    transcript: externalTranscript,
    isMicActive = false,
    isSharing = false,
}: SpeechRecognitionProps) {
    const [isSupported, setIsSupported] = useState(false);

    // Use external transcript if provided
    const displayTranscript = externalTranscript || '';

    useEffect(() => {
        // Check if speech recognition is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true);
        }
    }, []);

    if (!isSupported) {
        return (
            <div className="card border-red-200 dark:border-red-800 text-center">
                <Mic className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-700 dark:text-red-400 font-medium">Speech Recognition Not Supported</p>
                <p className="text-red-600 dark:text-red-500 text-sm mt-1">
                    Please use a modern browser like Chrome or Edge
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary-600" />
                    Voice Input
                </h3>
                <div className="flex items-center gap-2">
                    {/* Share System Audio Button */}
                    {onToggleShare && (
                        <button
                            onClick={onToggleShare}
                            className={`p-2 rounded-lg transition-colors ${isSharing
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'
                                } hover:opacity-90`}
                            title={isSharing ? 'Stop Sharing System Audio' : 'Share System/Tab Audio'}
                        >
                            <ScreenShare className="h-4 w-4" />
                        </button>
                    )}
                    {/* Response Control Buttons */}
                    {isResponsePlaying && onStopResponse && (
                        <button
                            onClick={onStopResponse}
                            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25"
                            title="Stop Response"
                        >
                            <Square className="h-4 w-4" />
                        </button>
                    )}

                    {/* Microphone Button */}
                    <button
                        onClick={onToggleListening}
                        className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${isListening
                            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                            }`}
                        title={isListening ? 'Stop Listening' : 'Start Listening'}
                    >
                        {!isListening ? (
                            <MicOff className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm ${isListening ? 'text-green-600 dark:text-green-400' : 'text-secondary-500 dark:text-secondary-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-green-500' : 'bg-red-500'} ${isListening ? 'animate-pulse' : ''}`} />
                        {isMicActive
                            ? (isListening ? 'Listening for questions...' : 'Microphone ready - click to listen')
                            : 'Initializing microphone...'
                        }
                    </div>

                    {/* Response Status */}
                    {isResponsePlaying && (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Speaking answer...
                        </div>
                    )}
                </div>

                {displayTranscript && (
                    <div className="bg-secondary-50 dark:bg-secondary-700/50 rounded-lg p-3 border-l-4 border-primary-500">
                        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Last heard:</p>
                        <p className="text-secondary-800 dark:text-secondary-200">{displayTranscript}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
