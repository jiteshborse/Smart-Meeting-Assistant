import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarConnection } from '../components/calendar/CalendarConnection';
import { CalendarEvents } from '../components/calendar/CalendarEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Bell, Shield, Calendar, Users, UserPlus, Download, Trash2 } from 'lucide-react';
import { MeetingTemplates } from '../components/calendar/MeetingTemplates';
import { MembersList } from '../components/teams/MembersList';
import { InviteMemberDialog } from '../components/teams/InviteMemberDialog';
import { useOrganizationStore } from '../stores/organizationStore';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';




export const Settings: React.FC = () => {
    const { currentOrganization } = useOrganizationStore();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();
    return (
        <div className="container max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <Tabs defaultValue="calendar" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Privacy
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Profile settings coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Notification settings coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Data</CardTitle>
                            <CardDescription>
                                Manage your data and privacy settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Export Your Data</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Download a copy of all your data in JSON format
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        const response = await fetch(
                                            `${import.meta.env.VITE_API_URL}/api/export/user/export`,
                                            {
                                                headers: {
                                                    'Authorization': `Bearer ${session?.access_token}`
                                                }
                                            }
                                        );
                                        if (response.ok) {
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'user-data.json';
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        }
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export All Data
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-medium mb-2 text-red-600">Delete Account</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your account and all your data,
                                    including meetings, comments, and calendar connections.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        const response = await fetch(
                                            `${import.meta.env.VITE_API_URL}/api/export/user/account`,
                                            {
                                                method: 'DELETE',
                                                headers: {
                                                    'Authorization': `Bearer ${session?.access_token}`
                                                }
                                            }
                                        );
                                        if (response.ok) {
                                            await supabase.auth.signOut();
                                            navigate('/login');
                                        }
                                    }}
                                    className="bg-red-600"
                                >
                                    Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-6">
                    <CalendarConnection />
                    <MeetingTemplates />
                    <CalendarEvents />
                </TabsContent>

                <TabsContent value="team" className="space-y-6">
                    {currentOrganization ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Team Members</h2>
                                    <p className="text-muted-foreground">
                                        Manage who has access to {currentOrganization.name}
                                    </p>
                                </div>
                                <Button onClick={() => setShowInviteDialog(true)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite Member
                                </Button>
                            </div>

                            <MembersList organizationId={currentOrganization.id} />

                            <InviteMemberDialog
                                open={showInviteDialog}
                                onOpenChange={setShowInviteDialog}
                                organizationId={currentOrganization.id}
                            />
                        </>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-2">No Workspace Selected</h3>
                                <p className="text-muted-foreground">
                                    Please select or create a workspace to manage team members
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};