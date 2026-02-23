import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useCalendarStore } from '../stores/calendarStore';
import { useMeetingStore } from '../stores/meetingStore';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Users } from 'lucide-react';

export const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const { events, isConnected, fetchEvents } = useCalendarStore();
    const { meetings } = useMeetingStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        if (isConnected) {
            fetchEvents();
        }
    }, [isConnected]);

    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
        const dateKey = format(event.start, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, typeof events>);

    // Check if event has a linked meeting
    const getLinkedMeeting = (eventId: string) => {
        return meetings.find(m => m.metadata?.calendar_event_id === eventId);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Calendar</h1>
                {!isConnected && (
                    <Button onClick={() => navigate('/settings')}>
                        Connect Calendar
                    </Button>
                )}
            </div>

            {!isConnected ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-semibold mb-2">No Calendar Connected</h2>
                        <p className="text-muted-foreground mb-4">
                            Connect your Google Calendar to see your upcoming events
                        </p>
                        <Button onClick={() => navigate('/settings')}>
                            Go to Settings
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Calendar sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Date Navigator</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Simple date picker - you can add a proper calendar component here */}
                                <div className="space-y-2">
                                    {Object.keys(eventsByDate).sort().map(dateKey => (
                                        <button
                                            key={dateKey}
                                            onClick={() => setSelectedDate(new Date(dateKey))}
                                            className={`w-full text-left p-2 rounded hover:bg-muted ${format(selectedDate, 'yyyy-MM-dd') === dateKey ? 'bg-muted' : ''
                                                }`}
                                        >
                                            <div className="font-medium">{format(new Date(dateKey), 'EEEE, MMMM d')}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {eventsByDate[dateKey].length} events
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Events list */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Events for {format(selectedDate, 'MMMM d, yyyy')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []).length > 0 ? (
                                        eventsByDate[format(selectedDate, 'yyyy-MM-dd')].map(event => {
                                            const linkedMeeting = getLinkedMeeting(event.id);

                                            return (
                                                <div
                                                    key={event.id}
                                                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-medium">{event.summary}</h3>
                                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                                                </div>
                                                                {event.attendees && event.attendees.length > 0 && (
                                                                    <div className="flex items-center">
                                                                        <Users className="h-3 w-3 mr-1" />
                                                                        {event.attendees.length}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {linkedMeeting ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-green-100 text-green-800 border-green-200"
                                                                onClick={() => navigate(`/meeting/${linkedMeeting.id}`)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                View Meeting
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => navigate('/meetings/new', {
                                                                    state: { fromEvent: event }
                                                                })}
                                                            >
                                                                Create Meeting
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No events scheduled for this day</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};