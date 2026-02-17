import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioLevel: number;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    resetRecording: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const initializationRef = useRef<boolean>(false);

    // Refs for state access in loops
    const isRecordingRef = useRef(false);
    const isPausedRef = useRef(false);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        isPausedRef.current = false;
        // Don't reset initializationRef here as it guards the start process
    }, []);

    const startRecording = useCallback(async () => {
        // Prevent multiple simultaneous initializations
        if (initializationRef.current) return;
        initializationRef.current = true;

        try {
            cleanup(); // Ensure clean state from previous runs
            setError(null);
            audioChunksRef.current = [];

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            // Set up audio context for visualization
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();

            // Resume context if suspended (browser policy)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            // Start visualization updates
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                if (!isRecordingRef.current) return;

                if (!isPausedRef.current && analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    // Calculate average volume
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;
                    setAudioLevel(average / 128); // Normalize roughly 0-1
                }
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            // Update refs and state
            isRecordingRef.current = true;
            isPausedRef.current = false;
            setIsRecording(true);
            setIsPaused(false);

            updateLevel();

            // Set up MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                setAudioLevel(0);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000); // Collect data every second

            // Start timer
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Microphone permission denied. Please allow access to record.');
                } else if (err.name === 'NotFoundError') {
                    setError('No microphone found. Please connect a microphone.');
                } else {
                    setError(`Failed to start recording: ${err.message}`);
                }
            } else {
                setError('An unknown error occurred');
            }
            cleanup();
        } finally {
            initializationRef.current = false;
        }
    }, [cleanup]);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                cleanState();
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorderRef.current?.mimeType || 'audio/webm'
                });

                cleanState();
                resolve(audioBlob);
            };

            mediaRecorderRef.current.stop();
        });
    }, [cleanup]);

    const cleanState = useCallback(() => {
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
    }, [cleanup]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            isPausedRef.current = true;

            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                audioContextRef.current.suspend();
            }

            // Pause timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            isPausedRef.current = false;

            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            // Resume timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
    }, []);

    const resetRecording = useCallback(() => {
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        audioChunksRef.current = [];
        setDuration(0);
        setAudioLevel(0);
        setError(null);
    }, [cleanup]);

    return {
        isRecording,
        isPaused,
        duration,
        audioLevel,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording
    };
};