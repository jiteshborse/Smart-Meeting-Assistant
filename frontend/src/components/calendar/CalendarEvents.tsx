import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useCalendarStore } from '../../stores/calendarStore';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Users,
    Video,
    MapPin,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export const CalendarEvents: React.FC = () => {
    const { events, isLoading, fetchEvents, isConnected } = useCalendarStore();
    const navigate = useNavigate();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isConnected) {
            fetchEvents();
        }
    }, [isConnected]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    const handleCreateMeeting = (event: any) => {
        // Navigate to new meeting with event data pre-filled
        navigate('/meetings/new', {
            state: {
                fromEvent: {
                    title: event.summary,
                    description: event.description,
                    startTime: event.start,
                    endTime: event.end,
                    attendees: event.attendees
                }
            }
        });
    };

    if (!isConnected) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Connect your calendar to see events</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Upcoming Calendar Events</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing || isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading && events.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No upcoming events</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleCreateMeeting(event)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium">{event.summary}</h3>
                                        {event.hangoutLink && (
                                            <Badge variant="outline" className="bg-green-100 text-green-800">
                                                <Video className="h-3 w-3 mr-1" />
                                                Meet
                                            </Badge>
                                        )}
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                            {event.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {format(event.start, 'MMM d, h:mm a')} - {format(event.end, 'h:mm a')}
                                        </div>

                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="flex items-center">
                                                <Users className="h-3 w-3 mr-1" />
                                                {event.attendees.length} {event.attendees.length === 1 ? 'guest' : 'guests'}
                                            </div>
                                        )}

                                        {event.location && (
                                            <div className="flex items-center">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {event.location}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="mt-3 w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCreateMeeting(event);
                                        }}
                                    >
                                        Create Meeting from Event
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};