import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RecordingInterface } from '../components/recording/RecordingInterface';
import { TranscriptDisplay } from '../components/recording/TranscriptDisplay';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useMeetingStore } from '../stores/meetingStore';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { saveMeetingOffline } from '../lib/db';
import { useNetworkStatus } from '../hooks/useNetworkStatus';


export const NewMeeting: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isOnline } = useNetworkStatus();
    const { createMeeting, updateMeeting, uploadAudio } = useMeetingStore();

    const [step, setStep] = useState<'setup' | 'recording' | 'save'>('setup');
    const [meetingTitle, setMeetingTitle] = useState('');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [meetingId, setMeetingId] = useState<string | null>(null);

    const {
        transcriptSegments,
        interimTranscript,
        resetTranscript,
        startListening,
        stopListening,
        error: recognitionError
    } = useSpeechRecognition();

    // Log state changes for debugging
    React.useEffect(() => {
        console.log('NewMeeting State:', { step, meetingTitle, recordingDuration, segments: transcriptSegments.length });
    }, [step, meetingTitle, recordingDuration, transcriptSegments]);

    // Show recognition errors
    React.useEffect(() => {
        if (recognitionError) {
            toast({
                title: 'Speech Recognition Error',
                description: recognitionError,
                variant: 'destructive'
            });
        }
    }, [recognitionError, toast]);

    const handleStartRecording = async () => {
        if (!meetingTitle.trim()) {
            toast({
                title: 'Title required',
                description: 'Please enter a meeting title to continue.',
                variant: 'destructive'
            });
            return;
        }

        // Create meeting in database
        const meeting = await createMeeting(meetingTitle);
        if (meeting) {
            setMeetingId(meeting.id);
            setStep('recording');
            startListening();
        }
    };

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
        console.log('Recording complete. Blob:', blob, 'Duration:', duration);
        console.log('Final Transcript Segments:', transcriptSegments);
        setAudioBlob(blob);
        setRecordingDuration(duration);
        stopListening();
        setStep('save');
    };

    const handleCancel = () => {
        resetTranscript();
        navigate('/');
    };



    const handleSave = async () => {
        if (!meetingId || !audioBlob) return;

        try {
            if (isOnline) {
                // Online: upload to Supabase
                const audioUrl = await useMeetingStore.getState().uploadAudio(meetingId, audioBlob);

                await updateMeeting(meetingId, {
                    duration: recordingDuration,
                    status: 'completed',
                    metadata: {
                        transcript: transcriptSegments,
                        audio_url: audioUrl,
                        audio_size: audioBlob.size,
                        audio_type: audioBlob.type,
                        word_count: transcriptSegments.reduce((acc, seg) =>
                            acc + seg.text.split(' ').length, 0
                        )
                    }
                });

                toast({
                    title: 'Meeting saved',
                    description: 'Your meeting has been saved successfully.'
                });
            } else {
                // Offline: save to IndexedDB
                await saveMeetingOffline(
                    meetingId,
                    meetingTitle,
                    transcriptSegments,
                    audioBlob
                );

                toast({
                    title: 'Meeting saved offline',
                    description: 'Will sync when connection is restored.'
                });
            }

            navigate(`/meeting/${meetingId}`);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save meeting. Please try again.',
                variant: 'destructive'
            });
        }
    };

    {
        !isOnline && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                Offline Mode
            </Badge>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Meeting</h1>
                    <p className="text-muted-foreground">
                        {step === 'setup' && 'Configure your meeting'}
                        {step === 'recording' && 'Recording in progress'}
                        {step === 'save' && 'Review and save'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left column - Recording/Controls */}
                <div className="space-y-4">
                    {step === 'setup' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Meeting Details</CardTitle>
                                <CardDescription>
                                    Give your meeting a title to get started
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Meeting Title</label>
                                    <Input
                                        placeholder="e.g., Weekly Sync, Client Call, Brainstorming"
                                        value={meetingTitle}
                                        onChange={(e) => setMeetingTitle(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <Button
                                    onClick={handleStartRecording}
                                    className="w-full"
                                    size="lg"
                                >
                                    Start Recording
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'recording' && (
                        <RecordingInterface
                            onRecordingComplete={handleRecordingComplete}
                            onCancel={handleCancel}
                        />
                    )}

                    {step === 'save' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Save Recording</CardTitle>
                                <CardDescription>
                                    Review and save your meeting recording
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Meeting Title</label>
                                    <p className="text-lg font-semibold">{meetingTitle}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Duration</label>
                                    <p className="text-lg font-semibold">
                                        {Math.floor(recordingDuration / 60)} minutes {recordingDuration % 60} seconds
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Transcript Length</label>
                                    <p className="text-lg font-semibold">
                                        {transcriptSegments.length} segments
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Save className="mr-2 h-5 w-5" />
                                    Save Meeting
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column - Transcript */}
                <div>
                    <TranscriptDisplay
                        segments={transcriptSegments}
                        interimText={interimTranscript}
                        isRecording={step === 'recording'}
                    />
                </div>
            </div>
        </div>
    );
};