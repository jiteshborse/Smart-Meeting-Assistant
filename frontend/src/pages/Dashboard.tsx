import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mic, Calendar, Users, FileText } from 'lucide-react';
import { RecordingInterface } from '../recording/RecordingInterface';

export default function Dashboard() {
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
        console.log('Recording complete', { audioBlob, duration });
        setIsRecording(false);
        // TODO: Handle the recorded audio (save to backend, etc.)
    };

    const handleCancel = () => {
        setIsRecording(false);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">
                    Your meeting assistant is ready to help
                </p>
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setIsRecording(true)}
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

            {/* Recording Interface or Placeholder */}
            {isRecording ? (
                <RecordingInterface
                    onRecordingComplete={handleRecordingComplete}
                    onCancel={handleCancel}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Meetings</CardTitle>
                        <CardDescription>Your 5 most recent meetings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No meetings yet</p>
                            <p className="text-sm">Start recording your first meeting</p>
                            <Button
                                className="mt-4"
                                variant="outline"
                                onClick={() => setIsRecording(true)}
                            >
                                <Mic className="mr-2 h-4 w-4" />
                                Start Recording
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}