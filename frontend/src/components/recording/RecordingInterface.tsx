import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { Mic, Square, Pause, Play, RotateCcw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { formatDuration } from '../../lib/utils';

interface RecordingInterfaceProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
    onRecordingComplete,
    onCancel
}) => {
    const {
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
    } = useAudioRecorder();

    const [isStopping, setIsStopping] = useState(false);

    const handleStop = async () => {
        setIsStopping(true);
        const audioBlob = await stopRecording();
        if (audioBlob) {
            onRecordingComplete(audioBlob, duration);
        }
        setIsStopping(false);
    };

    const handleCancel = () => {
        resetRecording();
        onCancel();
    };

    // Auto-start recording when component mounts
    useEffect(() => {
        startRecording();
    }, []);

    // Calculate waveform bar heights based on audio level
    const waveformBars = Array.from({ length: 50 }, () => {
        const height = isRecording && !isPaused
            ? Math.max(4, Math.min(40, audioLevel * 40 * (0.5 + Math.random() * 0.5)))
            : 4;
        return height;
    });

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Timer Display */}
                <div className="text-center mb-6">
                    <div className="text-6xl font-mono font-bold tabular-nums">
                        {formatDuration(duration)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        {isPaused ? 'Paused' : isRecording ? 'Recording' : 'Ready'}
                    </div>
                </div>

                {/* Waveform Visualization */}
                <div className="flex items-center justify-center gap-[2px] h-16 mb-8">
                    {waveformBars.map((height, index) => (
                        <div
                            key={index}
                            className="w-1 bg-primary rounded-full transition-all duration-100"
                            style={{
                                height: `${height}px`,
                                opacity: isRecording && !isPaused ? 1 : 0.3
                            }}
                        />
                    ))}
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center gap-4">
                    {!isRecording ? (
                        <Button
                            size="lg"
                            onClick={startRecording}
                            className="rounded-full h-16 w-16"
                        >
                            <Mic className="h-8 w-8" />
                        </Button>
                    ) : (
                        <>
                            {isPaused ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={resumeRecording}
                                    className="rounded-full h-14 w-14"
                                >
                                    <Play className="h-6 w-6" />
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={pauseRecording}
                                    className="rounded-full h-14 w-14"
                                >
                                    <Pause className="h-6 w-6" />
                                </Button>
                            )}

                            <Button
                                size="lg"
                                variant="destructive"
                                onClick={handleStop}
                                disabled={isStopping}
                                className="rounded-full h-16 w-16"
                            >
                                <Square className="h-8 w-8" />
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleCancel}
                                className="rounded-full h-14 w-14"
                            >
                                <RotateCcw className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Status Message */}
                <div className="text-center mt-4 text-sm text-muted-foreground">
                    {!isRecording && !error && 'Click the microphone to start recording'}
                    {isRecording && !isPaused && 'Recording in progress...'}
                    {isPaused && 'Recording paused'}
                    {error && 'Please check your microphone settings'}
                </div>
            </CardContent>
        </Card>
    );
};