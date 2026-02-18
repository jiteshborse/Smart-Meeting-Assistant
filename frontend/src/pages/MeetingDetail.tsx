import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { useMeetingStore } from '../stores/meetingStore';
import { useToast } from '../components/ui/use-toast';
import {
    ArrowLeft,
    Download,
    Trash2,
    Clock,
    FileText,
    Mic,
    Calendar
} from 'lucide-react';
import { formatDuration, formatFileSize } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface TranscriptSegment {
    id: string;
    speaker: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
}

export const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { meetings, currentMeeting, setCurrentMeeting, deleteMeeting, fetchMeetings, isLoading, getAudioUrl } = useMeetingStore();
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch meetings if not loaded
    useEffect(() => {
        if (meetings.length === 0 && !isLoading) {
            fetchMeetings();
        }
    }, [meetings.length, isLoading, fetchMeetings]);

    // Find meeting and load details
    useEffect(() => {
        if (id) {
            const meeting = meetings.find(m => m.id === id) || null;
            setCurrentMeeting(meeting);

            if (meeting?.metadata) {
                // Parse transcript from metadata
                if (meeting.metadata.transcript) {
                    setTranscript(meeting.metadata.transcript as TranscriptSegment[]);
                }
            }
        }
    }, [id, meetings, setCurrentMeeting]);

    // Load secure audio URL
    useEffect(() => {
        const loadAudio = async () => {
            if (currentMeeting?.id) {
                const url = await getAudioUrl(currentMeeting.id);
                if (url) setAudioUrl(url);
            }
        };
        loadAudio();
    }, [currentMeeting, getAudioUrl]);

    const handleDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        try {
            await deleteMeeting(id);
            toast({
                title: 'Meeting deleted',
                description: 'The meeting has been permanently deleted.'
            });
            navigate('/');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete meeting.',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownloadTranscript = () => {
        if (!currentMeeting) return;

        const transcriptText = transcript
            .map(seg => `[${seg.speaker}]: ${seg.text}`)
            .join('\n\n');

        const blob = new Blob([transcriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentMeeting.title || 'meeting'}-transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!currentMeeting) {
        return (
            <div className="container max-w-4xl mx-auto py-8 text-center">
                <p>Meeting not found</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{currentMeeting.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {new Date(currentMeeting.created_at).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDuration(currentMeeting.duration || 0)}</span>
                            </div>
                            <Badge variant={currentMeeting.status === 'completed' ? 'default' : 'secondary'}>
                                {currentMeeting.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadTranscript}>
                        <Download className="mr-2 h-4 w-4" />
                        Transcript
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Mic className="h-5 w-5" />
                            Recording
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <audio controls className="w-full">
                            <source src={audioUrl} type={currentMeeting.metadata?.audio_type || 'audio/webm'} />
                            Your browser does not support the audio element.
                        </audio>
                        {currentMeeting.metadata?.audio_size && (
                            <p className="text-sm text-muted-foreground mt-2">
                                File size: {formatFileSize(currentMeeting.metadata.audio_size)}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Transcript */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Full Transcript
                        <Badge variant="outline" className="ml-2">
                            {transcript.length} segments
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6">
                            {transcript.map((segment, index) => (
                                <div key={segment.id || index} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{segment.speaker}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(segment.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-base pl-2">{segment.text}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDelete}
                title="Delete Meeting"
                description="Are you sure you want to delete this meeting? This action cannot be undone."
            />
        </div>
    );
};