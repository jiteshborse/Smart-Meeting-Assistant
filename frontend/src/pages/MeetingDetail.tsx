import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useMeetingStore } from '../stores/meetingStore';
import type { ActionItem } from '../types/database';
import { ActionItems } from '../components/meeting/ActionItems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Decisions } from '../components/meeting/Decisions';
import { Topics } from '../components/meeting/Topics';
import { SentimentMeter } from '../components/meeting/SentimentMeter';
import { SummaryTabs } from '../components/meeting/SummaryTabs';
import { AIProcessingAnimation } from '../components/meeting/AIProcessingAnimation';
import { useToast } from '../components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    ArrowLeft,
    Download,
    Trash2,
    Clock,
    FileText,
    Mic,
    Calendar,
    Brain,
    Repeat
} from 'lucide-react';
import { formatDuration } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { autoScheduler } from '../services/autoScheduler';
import { CommentSection } from '../components/comments/CommentSection';


interface TranscriptSegment {
    id: string;
    speaker: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
}



export const MeetingDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const navigate = useNavigate();
    const { toast } = useToast();

    const { meetings, currentMeeting, setCurrentMeeting, deleteMeeting, fetchMeetings, isLoading, getAudioUrl, analyzeMeeting } = useMeetingStore();
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        format: 'pdf' as 'pdf' | 'txt' | 'json',
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
        includeComments: true
    });
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
        dayOfWeek: new Date().getDay(),
        dayOfMonth: new Date().getDate(),
        time: '10:00',
        duration: 60,
        attendees: ''
    });

    // Transform AI analysis action items into the ActionItem format
    useEffect(() => {
        if (currentMeeting?.metadata?.ai_analysis?.actionItems) {
            const transformed: ActionItem[] = currentMeeting.metadata.ai_analysis.actionItems.map(
                (item, index) => ({
                    id: `action-${index}`,
                    description: item.description,
                    assignee: item.assignee,
                    due_date: item.dueDate,
                    priority: item.priority,
                    status: 'pending' as const,
                })
            );
            setActionItems(transformed);
        }
    }, [currentMeeting]);

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
                if (meeting.metadata.transcript) {
                    setTranscript(meeting.metadata.transcript as TranscriptSegment[]);
                }
            }
        }
    }, [id, meetings, setCurrentMeeting]);

    // Poll for updates when meeting is processing
    useEffect(() => {
        if (currentMeeting?.status === 'processing') {
            const interval = setInterval(async () => {
                await useMeetingStore.getState().fetchMeetings();
                const updated = useMeetingStore.getState().meetings.find(m => m.id === id);
                if (updated?.status === 'completed') {
                    if (updated.metadata?.transcript) {
                        setTranscript(updated.metadata.transcript as TranscriptSegment[]);
                    }
                    clearInterval(interval);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [currentMeeting?.status, id]);

    const handleActionItemStatus = async (itemId: string, status: string) => {
        setActionItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, status: status as any } : item
            )
        );
    };

    const handleAnalyze = async () => {
        if (!currentMeeting || !transcript.length) return;

        setIsAnalyzing(true);
        try {
            const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
            await analyzeMeeting(currentMeeting.id, transcriptText);

            toast({
                title: 'Analysis Complete',
                description: 'AI insights have been generated successfully.'
            });
        } catch (error) {
            toast({
                title: 'Analysis Failed',
                description: 'Failed to generate AI insights. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

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

    const handleExport = async (format: 'pdf' | 'txt' | 'json') => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/export/meetings/${id}/export`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({ ...exportOptions, format })
                }
            );

            if (!response.ok) throw new Error('Export failed');

            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `meeting.${format}`;

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Success',
                description: `Meeting exported as ${format.toUpperCase()}`
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to export meeting',
                variant: 'destructive'
            });
        }
    };

    if (!currentMeeting) {
        return null;
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
                    {!currentMeeting.metadata?.ai_analysis && transcript.length > 0 && (
                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Brain className="mr-2 h-4 w-4" />
                            {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleDownloadTranscript}>
                        <Download className="mr-2 h-4 w-4" />
                        Transcript
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2 space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="export-summary"
                                        checked={exportOptions.includeSummary}
                                        onCheckedChange={(checked) =>
                                            setExportOptions(prev => ({ ...prev, includeSummary: !!checked }))
                                        }
                                    />
                                    <label htmlFor="export-summary" className="text-sm">Include Summary</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="export-actions"
                                        checked={exportOptions.includeActionItems}
                                        onCheckedChange={(checked) =>
                                            setExportOptions(prev => ({ ...prev, includeActionItems: !!checked }))
                                        }
                                    />
                                    <label htmlFor="export-actions" className="text-sm">Include Action Items</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="export-transcript"
                                        checked={exportOptions.includeTranscript}
                                        onCheckedChange={(checked) =>
                                            setExportOptions(prev => ({ ...prev, includeTranscript: !!checked }))
                                        }
                                    />
                                    <label htmlFor="export-transcript" className="text-sm">Include Transcript</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="export-comments"
                                        checked={exportOptions.includeComments}
                                        onCheckedChange={(checked) =>
                                            setExportOptions(prev => ({ ...prev, includeComments: !!checked }))
                                        }
                                    />
                                    <label htmlFor="export-comments" className="text-sm">Include Comments</label>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('txt')}>
                                Export as Text
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('json')}>
                                Export as JSON
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        onClick={() => setShowScheduleDialog(true)}
                    >
                        <Repeat className="mr-2 h-4 w-4" />
                        Set Recurring
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
                        <audio ref={audioRef} controls className="w-full">
                            <source src={audioUrl} type={currentMeeting.metadata?.audio_type || 'audio/webm'} />
                            Your browser does not support the audio element.
                        </audio>
                    </CardContent>
                </Card>
            )}

            {/* AI Processing Animation */}
            {currentMeeting.status === 'processing' && !currentMeeting.metadata?.ai_analysis && (
                <AIProcessingAnimation />
            )}

            {/* 4-Tab Layout */}
            <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>

                <TabsContent value="transcript">
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
                </TabsContent>

                <TabsContent value="summary">
                    {currentMeeting.metadata?.ai_analysis?.summary ? (
                        <SummaryTabs summary={currentMeeting.metadata.ai_analysis.summary} />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No summary yet. Run AI analysis to generate.</p>
                            <Button
                                variant="link"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || transcript.length === 0}
                            >
                                Generate now
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="actions">
                    <ActionItems
                        items={actionItems}
                        onStatusChange={handleActionItemStatus}
                    />
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    {currentMeeting.metadata?.ai_analysis ? (
                        <>
                            {/* Sentiment */}
                            <SentimentMeter {...currentMeeting.metadata.ai_analysis.sentiment} />

                            {/* Decisions */}
                            <Decisions decisions={currentMeeting.metadata.ai_analysis.decisions || []} />

                            {/* Topics */}
                            <Topics topics={currentMeeting.metadata.ai_analysis.topics || []} />
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No AI insights generated yet.</p>
                            <Button
                                variant="link"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || transcript.length === 0}
                            >
                                Generate now
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="comments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Discussion</CardTitle>
                            <CardDescription>
                                Comment on this meeting and mention teammates with @
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CommentSection
                                meetingId={id!}
                                audioPlayerRef={audioRef}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDelete}
                title="Delete Meeting"
                description="Are you sure you want to delete this meeting? This action cannot be undone."
            />

            {/* Recurring Schedule Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Set Recurring Schedule</DialogTitle>
                        <DialogDescription>
                            Automatically schedule this meeting on a recurring basis
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                                value={scheduleForm.frequency}
                                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                                    setScheduleForm({ ...scheduleForm, frequency: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {scheduleForm.frequency === 'weekly' && (
                            <div className="space-y-2">
                                <Label>Day of Week</Label>
                                <Select
                                    value={scheduleForm.dayOfWeek.toString()}
                                    onValueChange={(value) =>
                                        setScheduleForm({ ...scheduleForm, dayOfWeek: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Sunday</SelectItem>
                                        <SelectItem value="1">Monday</SelectItem>
                                        <SelectItem value="2">Tuesday</SelectItem>
                                        <SelectItem value="3">Wednesday</SelectItem>
                                        <SelectItem value="4">Thursday</SelectItem>
                                        <SelectItem value="5">Friday</SelectItem>
                                        <SelectItem value="6">Saturday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {scheduleForm.frequency === 'monthly' && (
                            <div className="space-y-2">
                                <Label>Day of Month</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={scheduleForm.dayOfMonth}
                                    onChange={(e) =>
                                        setScheduleForm({ ...scheduleForm, dayOfMonth: parseInt(e.target.value) })
                                    }
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                                type="time"
                                value={scheduleForm.time}
                                onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, time: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Select
                                value={scheduleForm.duration.toString()}
                                onValueChange={(value) =>
                                    setScheduleForm({ ...scheduleForm, duration: parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Attendees (comma-separated emails)</Label>
                            <Input
                                value={scheduleForm.attendees}
                                onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, attendees: e.target.value })
                                }
                                placeholder="team@company.com, manager@company.com"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!currentMeeting) return;
                                autoScheduler.addRule({
                                    meetingId: currentMeeting.id,
                                    frequency: scheduleForm.frequency,
                                    dayOfWeek: scheduleForm.dayOfWeek,
                                    dayOfMonth: scheduleForm.dayOfMonth,
                                    time: scheduleForm.time,
                                    duration: scheduleForm.duration,
                                    attendees: scheduleForm.attendees
                                        .split(',')
                                        .map(e => e.trim())
                                        .filter(e => e),
                                    enabled: true
                                });
                                toast({
                                    title: 'Recurring Schedule Set',
                                    description: `This meeting will repeat ${scheduleForm.frequency}.`
                                });
                                setShowScheduleDialog(false);
                            }}
                        >
                            <Repeat className="mr-2 h-4 w-4" />
                            Create Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};