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
import { useOrganizationStore } from '../../stores/organizationStore';
import { useToast } from '../ui/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId: string;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
    open,
    onOpenChange,
    organizationId
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({
                title: 'Error',
                description: 'Email is required',
                variant: 'destructive'
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: 'Error',
                description: 'Please enter a valid email address',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    email,
                    organizationId,
                    role
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send invitation');
            }

            toast({
                title: 'Invitation Sent',
                description: `An invitation has been sent to ${email}`
            });

            onOpenChange(false);
            setEmail('');
            setRole('member');

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send invitation',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Invite Team Members</DialogTitle>
                        <DialogDescription>
                            Send an email invitation to join your workspace
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@company.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={role}
                                onValueChange={(value: any) => setRole(value)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {role === 'admin' && 'Can manage members and settings'}
                                {role === 'member' && 'Can create and edit meetings'}
                                {role === 'viewer' && 'Can only view meetings'}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};