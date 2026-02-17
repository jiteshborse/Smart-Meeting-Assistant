import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { TranscriptDisplay } from '../components/recording/TranscriptDisplay';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Calendar, Clock, Download, Share2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useToast } from '../components/ui/use-toast';

export const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { meetings, fetchMeetings, isLoading, getAudioUrl, deleteMeeting } = useMeetingStore();
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const meeting = meetings.find((m) => m.id === id);

    useEffect(() => {
        if (!meeting && !isLoading) {
            fetchMeetings();
        }
    }, [meeting, isLoading, fetchMeetings]);

    useEffect(() => {
        const loadAudio = async () => {
            if (meeting?.id) {
                const url = await getAudioUrl(meeting.id);
                console.log('Meeting Detail - Signed Audio URL:', url);
                if (url) setAudioUrl(url);
            }
        };
        loadAudio();
    }, [meeting, getAudioUrl]);

    const handleDelete = async () => {
        if (!meeting?.id) return;

        if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
            setIsDeleting(true);
            try {
                await deleteMeeting(meeting.id);
                toast({
                    title: 'Meeting deleted',
                    description: 'The meeting and recording have been permanently deleted.'
                });
                navigate('/');
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to delete meeting. Please try again.',
                    variant: 'destructive'
                });
                setIsDeleting(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-xl text-muted-foreground">Meeting not found</p>
                <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {meeting.title}
                            <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                                {meeting.status}
                            </Badge>
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {Math.floor((meeting.duration || 0) / 60)}m {(meeting.duration || 0) % 60}s
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Audio Player & Summary */}
                <div className="space-y-6">
                    {/* Audio Player */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recording</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {audioUrl ? (
                                <AudioPlayer
                                    src={audioUrl}
                                    autoPlay={false}
                                    customAdditionalControls={[]}
                                    showJumpControls={true}
                                    layout="horizontal-reverse"
                                />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Audio not available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Placeholders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Summary</CardTitle>
                            <CardDescription>Generated summary of the meeting</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-muted-foreground italic">
                                Summary generation features coming soon...
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-muted-foreground italic">
                                No action items detected yet.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Transcript */}
                <div className="h-[600px]">
                    <TranscriptDisplay
                        segments={meeting.metadata?.transcript || []}
                        interimText=""
                        isRecording={false}
                    />
                </div>
            </div>
        </div>
    );
};
