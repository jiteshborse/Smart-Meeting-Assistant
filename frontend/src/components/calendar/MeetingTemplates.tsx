import React, { useState } from 'react';
import { ScheduleFollowUp } from './ScheduleFollowUp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import {
    Calendar,
    Clock,
    Save,
    Trash2,
    Edit,
    Copy,
    Users
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    description: string;
    duration: number; // minutes
    defaultAttendees: string[];
    hasMeet: boolean;
    agenda: string[];
    createdAt: Date;
}

export const MeetingTemplates: React.FC = () => {
    const { createEvent } = useCalendarStore();
    const { toast } = useToast();

    const [templates, setTemplates] = useState<Template[]>(() => {
        // Load from localStorage
        const saved = localStorage.getItem('meeting-templates');
        return saved ? JSON.parse(saved) : [];
    });

    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [schedulingFromTemplate, setSchedulingFromTemplate] = useState<Template | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 60,
        defaultAttendees: '',
        hasMeet: true,
        agenda: ''
    });

    const saveTemplate = () => {
        const newTemplate: Template = {
            id: editingTemplate?.id || Date.now().toString(),
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            defaultAttendees: formData.defaultAttendees
                .split(',')
                .map(email => email.trim())
                .filter(email => email),
            hasMeet: formData.hasMeet,
            agenda: formData.agenda
                .split('\n')
                .map(item => item.trim())
                .filter(item => item),
            createdAt: new Date()
        };

        let updatedTemplates;
        if (editingTemplate) {
            updatedTemplates = templates.map(t =>
                t.id === editingTemplate.id ? newTemplate : t
            );
        } else {
            updatedTemplates = [...templates, newTemplate];
        }

        setTemplates(updatedTemplates);
        localStorage.setItem('meeting-templates', JSON.stringify(updatedTemplates));

        setShowTemplateDialog(false);
        setEditingTemplate(null);
        resetForm();

        toast({
            title: editingTemplate ? 'Template Updated' : 'Template Created',
            description: `Meeting template "${newTemplate.name}" has been saved.`
        });
    };

    const deleteTemplate = (id: string) => {
        const updatedTemplates = templates.filter(t => t.id !== id);
        setTemplates(updatedTemplates);
        localStorage.setItem('meeting-templates', JSON.stringify(updatedTemplates));

        toast({
            title: 'Template Deleted',
            description: 'Meeting template has been removed.'
        });
    };

    const useTemplate = (template: Template) => {
        setSchedulingFromTemplate(template);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            duration: 60,
            defaultAttendees: '',
            hasMeet: true,
            agenda: ''
        });
    };

    const editTemplate = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            duration: template.duration,
            defaultAttendees: template.defaultAttendees.join(', '),
            hasMeet: template.hasMeet,
            agenda: template.agenda.join('\n')
        });
        setShowTemplateDialog(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Meeting Templates</CardTitle>
                        <CardDescription>
                            Create and reuse templates for recurring meetings
                        </CardDescription>
                    </div>
                    <Button onClick={() => {
                        resetForm();
                        setEditingTemplate(null);
                        setShowTemplateDialog(true);
                    }}>
                        <Save className="h-4 w-4 mr-2" />
                        New Template
                    </Button>
                </CardHeader>
                <CardContent>
                    {templates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No templates yet</p>
                            <p className="text-sm">Create templates for recurring meetings</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium">{template.name}</h3>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => editTemplate(template)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => deleteTemplate(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-3">
                                        {template.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {template.duration} min
                                        </Badge>
                                        {template.defaultAttendees.length > 0 && (
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {template.defaultAttendees.length} attendees
                                            </Badge>
                                        )}
                                        {template.hasMeet && (
                                            <Badge variant="outline" className="bg-green-100 text-green-800">
                                                Google Meet
                                            </Badge>
                                        )}
                                    </div>

                                    {template.agenda.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs font-medium mb-1">Agenda:</p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                {template.agenda.slice(0, 3).map((item, i) => (
                                                    <li key={i} className="truncate">{item}</li>
                                                ))}
                                                {template.agenda.length > 3 && (
                                                    <li>+{template.agenda.length - 3} more items</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        size="sm"
                                        onClick={() => useTemplate(template)}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Use Template
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Template Dialog */}
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Save meeting configurations for quick reuse
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Weekly Sync, Client Call"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this meeting type"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Select
                                value={formData.duration.toString()}
                                onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
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
                            <Label>Default Attendees (comma-separated emails)</Label>
                            <Input
                                value={formData.defaultAttendees}
                                onChange={(e) => setFormData({ ...formData, defaultAttendees: e.target.value })}
                                placeholder="team@company.com, client@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Agenda Items (one per line)</Label>
                            <Textarea
                                value={formData.agenda}
                                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                                placeholder="Review progress&#10;Discuss blockers&#10;Plan next steps"
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasMeet"
                                checked={formData.hasMeet}
                                onChange={(e) => setFormData({ ...formData, hasMeet: e.target.checked })}
                            />
                            <Label htmlFor="hasMeet">Include Google Meet by default</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveTemplate}>
                            {editingTemplate ? 'Update' : 'Create'} Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule from Template Dialog */}
            {schedulingFromTemplate && (
                <ScheduleFollowUp
                    open={!!schedulingFromTemplate}
                    onOpenChange={(open) => !open && setSchedulingFromTemplate(null)}
                    meetingTitle={schedulingFromTemplate.name}
                    actionItem={{
                        description: schedulingFromTemplate.description,
                        assignee: schedulingFromTemplate.defaultAttendees.join(', ')
                    }}
                />
            )}
        </>
    );
};