import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase';
import { Copy, Globe, Lock, Users, Building2, X, UserPlus } from 'lucide-react';

interface ShareMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingId: string;
    currentVisibility: string;
    currentSharedWith: string[];
    onUpdate: () => void;
}

export const ShareMeetingDialog: React.FC<ShareMeetingDialogProps> = ({
    open,
    onOpenChange,
    meetingId,
    currentVisibility,
    currentSharedWith,
    onUpdate
}) => {
    const [visibility, setVisibility] = useState(currentVisibility || 'private');
    const [sharedWith, setSharedWith] = useState<string[]>(currentSharedWith || []);
    const [emailInput, setEmailInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleAddUser = async () => {
        if (!emailInput.trim()) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput)) {
            toast({
                title: 'Error',
                description: 'Please enter a valid email address',
                variant: 'destructive'
            });
            return;
        }

        // Look up the user by email
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', emailInput.trim())
            .single();

        if (!profile) {
            toast({
                title: 'User not found',
                description: 'No user found with that email address',
                variant: 'destructive'
            });
            return;
        }

        if (sharedWith.includes(profile.id)) {
            toast({
                title: 'Already shared',
                description: 'This meeting is already shared with that user',
                variant: 'destructive'
            });
            return;
        }

        setSharedWith([...sharedWith, profile.id]);
        setEmailInput('');
    };

    const handleRemoveUser = (userId: string) => {
        setSharedWith(sharedWith.filter(id => id !== userId));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('meetings')
                .update({
                    visibility,
                    shared_with: sharedWith
                })
                .eq('id', meetingId);

            if (error) throw error;

            toast({
                title: 'Sharing updated',
                description: 'Meeting sharing settings have been saved'
            });
            onUpdate();
            onOpenChange(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update sharing settings',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/meetings/${meetingId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: 'Link copied',
            description: 'Meeting link copied to clipboard'
        });
    };

    const getVisibilityIcon = (vis: string) => {
        switch (vis) {
            case 'public': return <Globe className="h-4 w-4" />;
            case 'organization': return <Building2 className="h-4 w-4" />;
            case 'team': return <Users className="h-4 w-4" />;
            default: return <Lock className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Meeting</DialogTitle>
                    <DialogDescription>
                        Control who can view this meeting
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Visibility */}
                    <div className="space-y-2">
                        <Label>Visibility</Label>
                        <Select value={visibility} onValueChange={setVisibility}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Private — Only you
                                    </div>
                                </SelectItem>
                                <SelectItem value="team">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Team — Shared users only
                                    </div>
                                </SelectItem>
                                <SelectItem value="organization">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Organization — All workspace members
                                    </div>
                                </SelectItem>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Public — Anyone with link
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Share with specific users */}
                    {(visibility === 'team' || visibility === 'private') && (
                        <div className="space-y-2">
                            <Label>Share with users</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter email address"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUser())}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddUser}
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>

                            {sharedWith.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {sharedWith.map((userId) => (
                                        <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                            {userId.substring(0, 8)}...
                                            <button onClick={() => handleRemoveUser(userId)}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Copy link */}
                    <div className="space-y-2">
                        <Label>Meeting Link</Label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/meetings/${meetingId}`}
                                className="text-sm"
                            />
                            <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        {copied && (
                            <p className="text-xs text-green-600">Copied!</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
