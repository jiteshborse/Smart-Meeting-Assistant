import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Mic, Calendar, Users, FileText, Clock, ChevronRight } from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '../lib/utils';


export default function Dashboard() {
    const navigate = useNavigate();
    const { meetings, fetchMeetings, isLoading } = useMeetingStore();

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const recentMeetings = meetings.slice(0, 5);

    return (
        <div className="space-y-8 container max-w-6xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">
                    Your meeting assistant is ready to help
                </p>
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer border-blue-100 dark:border-blue-900"
                    onClick={() => navigate('/meetings/new')}
                >
                    <CardHeader>
                        <Mic className="h-8 w-8 mb-2 text-blue-500" />
                        <CardTitle className="text-lg">New Recording</CardTitle>
                        <CardDescription>Start a new meeting recording</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <FileText className="h-8 w-8 mb-2 text-green-500" />
                        <CardTitle className="text-lg">Recent Meetings</CardTitle>
                        <CardDescription>View your latest meetings</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <Calendar className="h-8 w-8 mb-2 text-purple-500" />
                        <CardTitle className="text-lg">Schedule</CardTitle>
                        <CardDescription>Connect your calendar</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <Users className="h-8 w-8 mb-2 text-orange-500" />
                        <CardTitle className="text-lg">Team</CardTitle>
                        <CardDescription>Invite team members</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Recent Meetings List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Meetings</CardTitle>
                    <CardDescription>Your 5 most recent meetings</CardDescription>
                </CardHeader>
                <CardContent>
                    {meetings.length > 0 ? (
                        <div className="space-y-4">
                            {meetings.slice(0, 5).map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                                >
                                    <div>
                                        <h3 className="font-medium">{meeting.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <div className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDuration(meeting.duration || 0)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                                        {meeting.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No meetings yet</p>
                            <p className="text-sm">Start recording your first meeting</p>
                            <Button
                                className="mt-4"
                                variant="outline"
                                onClick={() => navigate('/meetings/new')}
                            >
                                <Mic className="mr-2 h-4 w-4" />
                                Start Recording
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}