import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { useCalendarStore } from '../../stores/calendarStore';
import { useToast } from '../ui/use-toast';
import { Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleFollowUpProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingId?: string;
    meetingTitle?: string;
    actionItem?: {
        description: string;
        assignee?: string;
    };
    onScheduled?: (eventId: string) => void;
}

export const ScheduleFollowUp: React.FC<ScheduleFollowUpProps> = ({
    open,
    onOpenChange,
    meetingId,
    meetingTitle,
    actionItem,
    onScheduled
}) => {
    const { createEvent, isConnected } = useCalendarStore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: actionItem
            ? `Follow-up: ${actionItem.description.substring(0, 50)}...`
            : `Follow-up: ${meetingTitle || 'Meeting'}`,
        description: actionItem?.description || '',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        attendees: actionItem?.assignee || '',
        hasMeet: true
    });

    const handleSubmit = async () => {
        if (!isConnected) {
            toast({
                title: 'Calendar not connected',
                description: 'Please connect your calendar first.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse time
            const [startHour, startMinute] = formData.startTime.split(':').map(Number);
            const [endHour, endMinute] = formData.endTime.split(':').map(Number);

            const start = new Date(formData.date);
            start.setHours(startHour, startMinute, 0);

            const end = new Date(formData.date);
            end.setHours(endHour, endMinute, 0);

            // Create event
            const event = await createEvent({
                summary: formData.title,
                description: formData.description,
                start,
                end,
                attendees: formData.attendees
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email),
                meetingId
            });

            if (event) {
                toast({
                    title: 'Event Created',
                    description: 'Follow-up meeting has been scheduled.',
                });

                onScheduled?.(event.id);
                onOpenChange(false);
            }

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create calendar event.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Calendar Not Connected</DialogTitle>
                        <DialogDescription>
                            Please connect your Google Calendar in Settings to schedule follow-ups.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => window.location.href = '/settings'}>
                            Go to Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Follow-up Meeting</DialogTitle>
                    <DialogDescription>
                        Create a calendar event for your next meeting.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Follow-up meeting"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Meeting agenda or notes..."
                            rows={3}
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="border rounded-md p-2">
                            <Calendar
                                mode="single"
                                selected={formData.date}
                                onSelect={(date) => date && setFormData({ ...formData, date })}
                                className="rounded-md"
                            />
                        </div>
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendees */}
                    <div className="space-y-2">
                        <Label>Attendees (comma-separated emails)</Label>
                        <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input
                                value={formData.attendees}
                                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                placeholder="john@example.com, jane@example.com"
                            />
                        </div>
                    </div>

                    {/* Google Meet */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="hasMeet"
                            checked={formData.hasMeet}
                            onChange={(e) => setFormData({ ...formData, hasMeet: e.target.checked })}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="hasMeet" className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Add Google Meet video conferencing
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Schedule Meeting'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};