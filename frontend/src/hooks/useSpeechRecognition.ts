import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
}

interface SpeechRecognitionEvent {
    results: {
        [index: number]: SpeechRecognitionResult;
        length: number;
    };
    resultIndex: number;
}

interface TranscriptionSegment {
    id: string;
    speaker: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
}

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    isSupported: boolean;
    transcriptSegments: TranscriptionSegment[];
    interimTranscript: string;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcriptSegments, setTranscriptSegments] = useState<TranscriptionSegment[]>([]);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const speakerCounterRef = useRef(1);
    const currentSpeakerRef = useRef(`Speaker ${speakerCounterRef.current}`);

    // Check for browser support
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            setIsSupported(!!SpeechRecognition);
        }
    }, []);

    const generateId = () => Math.random().toString(36).substring(2, 15);

    const initializeRecognition = useCallback(() => {
        if (!isSupported) return null;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access.');
            } else if (event.error === 'no-speech') {
                setError('No speech detected. Please check your microphone.');
            } else {
                setError(`Recognition error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';

            console.log('Speech recognition result event:', event.results.length);
            let finalSegments: TranscriptionSegment[] = [];
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                console.log('Result:', result[0].transcript, 'isFinal:', result.isFinal);
                const transcript = result[0].transcript;
                const confidence = result[0].confidence;

                if (result.isFinal) {
                    // Simple speaker change detection (based on pauses - this is basic)
                    // In production, you'd use proper diarization
                    if (i > 0 && i % 5 === 0) {
                        speakerCounterRef.current++;
                        currentSpeakerRef.current = `Speaker ${speakerCounterRef.current}`;
                    }

                    finalSegments.push({
                        id: generateId(),
                        speaker: currentSpeakerRef.current,
                        text: transcript.trim(),
                        timestamp: Date.now(),
                        isFinal: true
                    });
                } else {
                    interim += transcript;
                }
            }

            if (finalSegments.length > 0) {
                setTranscriptSegments(prev => [...prev, ...finalSegments]);
            }

            setInterimTranscript(interim);
        };

        return recognition;
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (err) {
                // Recognition already started
                console.log('Recognition already started');
            }
        } else {
            const recognition = initializeRecognition();
            if (recognition) {
                recognitionRef.current = recognition;
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Failed to start recognition:', err);
                }
            }
        }
    }, [isSupported, initializeRecognition]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscriptSegments([]);
        setInterimTranscript('');
        speakerCounterRef.current = 1;
        currentSpeakerRef.current = 'Speaker 1';
    }, []);

    return {
        isListening,
        isSupported,
        transcriptSegments,
        interimTranscript,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
};