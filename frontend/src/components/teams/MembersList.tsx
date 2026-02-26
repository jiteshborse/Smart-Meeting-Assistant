import React, { useState, useEffect } from 'react';
import { useOrganizationStore } from '../../stores/organizationStore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
import { useToast } from '../ui/use-toast';
import {
    MoreVertical,
    Shield,
    UserMinus,
    Crown,
    Mail,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface MembersListProps {
    organizationId: string;
}

export const MembersList: React.FC<MembersListProps> = ({ organizationId }) => {
    const { members, fetchMembers, updateMemberRole, removeMember } = useOrganizationStore();
    const { toast } = useToast();

    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');

    useEffect(() => {
        fetchMembers(organizationId);

        // Get current user's role
        const getUserRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentMember = members.find(m => m.user_id === session?.user?.id);
            if (currentMember) {
                setCurrentUserRole(currentMember.role);
            }
        };
        getUserRole();
    }, [organizationId, members]);

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            await updateMemberRole(memberId, newRole as any);
            toast({
                title: 'Role Updated',
                description: 'Member role has been updated successfully.'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update member role',
                variant: 'destructive'
            });
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            await removeMember(memberToRemove);
            toast({
                title: 'Member Removed',
                description: 'Member has been removed from the workspace.'
            });
            setMemberToRemove(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to remove member',
                variant: 'destructive'
            });
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };

        return (
            <Badge className={colors[role as keyof typeof colors]}>
                {role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                {role}
            </Badge>
        );
    };

    const canManage = ['owner', 'admin'].includes(currentUserRole);

    return (
        <div className="space-y-4">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                >
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarFallback>
                                {member.user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {member.user?.full_name || member.user?.email}
                                </span>
                                {getRoleBadge(member.role)}
                            </div>

                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {member.user?.email}
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {canManage && member.role !== 'owner' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                                    Make Member
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                                    Make Viewer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setMemberToRemove(member.id)}
                                >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            ))}

            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the member from the workspace. They will lose access to all shared meetings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};