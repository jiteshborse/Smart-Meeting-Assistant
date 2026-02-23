import React, { useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useCalendarStore } from '../../stores/calendarStore';
import { useToast } from '../ui/use-toast';
import {
    Calendar,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Trash2
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';

export const CalendarConnection: React.FC = () => {
    const {
        isConnected,
        connection,
        isLoading,
        error,
        checkConnection,
        connectCalendar,
        disconnectCalendar,
        clearError
    } = useCalendarStore();

    const { toast } = useToast();
    const [showDisconnectDialog, setShowDisconnectDialog] = React.useState(false);

    useEffect(() => {
        checkConnection();

        // Check URL for callback result
        const params = new URLSearchParams(window.location.search);
        if (params.get('calendar') === 'connected') {
            toast({
                title: 'Calendar Connected',
                description: 'Your Google Calendar has been successfully connected.',
            });
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            checkConnection();
        } else if (params.get('calendar') === 'error') {
            toast({
                title: 'Connection Failed',
                description: 'Failed to connect Google Calendar. Please try again.',
                variant: 'destructive'
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (error) {
            toast({
                title: 'Error',
                description: error,
                variant: 'destructive'
            });
            clearError();
        }
    }, [error]);

    const handleDisconnect = async () => {
        await disconnectCalendar();
        setShowDisconnectDialog(false);
        toast({
            title: 'Calendar Disconnected',
            description: 'Your Google Calendar has been disconnected.',
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Calendar Integration
                        </div>
                        {isConnected && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Connect your Google Calendar to sync meetings and schedule follow-ups
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && !isConnected ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : isConnected ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Connected as</p>
                                        <p className="text-lg">{connection?.email}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Connected since {new Date(connection?.created_at || '').toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open('https://calendar.google.com', '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Calendar
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowDisconnectDialog(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-2">No Calendar Connected</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Connect your Google Calendar to import events and schedule meetings
                            </p>
                            <Button onClick={connectCalendar} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    'Connect Google Calendar'
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Calendar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove access to your Google Calendar. Any synced events will remain,
                            but future updates won't be synced.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnect}>
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};