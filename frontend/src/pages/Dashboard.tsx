import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mic, Calendar, Users, FileText, Clock, ChevronRight } from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';
import { formatDistanceToNow } from 'date-fns';

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
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-muted-foreground">Loading meetings...</p>
                        </div>
                    ) : recentMeetings.length > 0 ? (
                        <div className="space-y-4">
                            {recentMeetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{meeting.title}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-sm font-medium flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" />
                                                {Math.floor((meeting.duration || 0) / 60)}m {(meeting.duration || 0) % 60}s
                                            </div>
                                            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${meeting.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                }`}>
                                                {meeting.status}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No meetings yet</p>
                            <p className="text-sm mb-6">Start recording your first meeting to get started</p>
                            <Button onClick={() => navigate('/meetings/new')}>
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