import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import type { TextToSpeechProps, TextToSpeechRef } from '../types/speech';

const TextToSpeech = forwardRef<TextToSpeechRef, TextToSpeechProps>(({ text, autoPlay = false, onStateChange }, ref) => {
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<number>(0);
    const [rate] = useState(1);
    const [pitch] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);

    // Keep a live ref of mute state to avoid stale closures in event callbacks
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSupported(true);

            const loadVoices = () => {
                const availableVoices = speechSynthesis.getVoices();
                setVoices(availableVoices);

                // Try to find a good English voice
                const englishVoice = availableVoices.findIndex(voice =>
                    voice.lang.startsWith('en') && voice.name.includes('Female')
                );
                if (englishVoice !== -1) {
                    setSelectedVoice(englishVoice);
                }
            };

            loadVoices();
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        if (autoPlay && text && isSupported && !isMutedRef.current) {
            speak();
        }
    }, [text, autoPlay, isSupported]);

    const speak = () => {
        if (!text || !isSupported || isMuted) return;

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (voices[selectedVoice]) {
            utterance.voice = voices[selectedVoice];
        }

        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 0.8;

        utterance.onstart = () => {
            onStateChange?.(true, isMutedRef.current);
        };

        utterance.onend = () => {
            onStateChange?.(false, isMutedRef.current);
        };

        utterance.onerror = () => {
            onStateChange?.(false, isMutedRef.current);
        };

        speechSynthesis.speak(utterance);
    };

    const stop = () => {
        speechSynthesis.cancel();
        onStateChange?.(false, isMutedRef.current);
    };

    const toggleMute = () => {
        const newMutedState = !isMutedRef.current;
        setIsMuted(newMutedState);
        isMutedRef.current = newMutedState;

        if (newMutedState) {
            // Mute by stopping speech
            speechSynthesis.cancel();
            onStateChange?.(false, newMutedState);
        } else {
            // Unmute: do not auto-resume; report current speaking state
            onStateChange?.(speechSynthesis.speaking, newMutedState);
        }
    };

    const setMuted = (muted: boolean) => {
        setIsMuted(muted);
        isMutedRef.current = muted;

        if (muted) {
            // Mute by stopping speech
            speechSynthesis.cancel();
            onStateChange?.(false, muted);
        } else {
            // Do not auto-resume; report current speaking state
            onStateChange?.(speechSynthesis.speaking, muted);
        }
    };

    // Expose functions to parent component
    useImperativeHandle(ref, () => ({
        stop,
        speak,
        toggleMute,
        setMuted
    }));

    return null;
});

TextToSpeech.displayName = 'TextToSpeech';

export default TextToSpeech;