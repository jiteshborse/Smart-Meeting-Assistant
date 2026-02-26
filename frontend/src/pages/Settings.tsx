import React, { useState } from 'react';
import { CalendarConnection } from '../components/calendar/CalendarConnection';
import { CalendarEvents } from '../components/calendar/CalendarEvents';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Bell, Shield, Calendar, Users, UserPlus } from 'lucide-react';
import { MeetingTemplates } from '../components/calendar/MeetingTemplates';
import { MembersList } from '../components/teams/MembersList';
import { InviteMemberDialog } from '../components/teams/InviteMemberDialog';
import { useOrganizationStore } from '../stores/organizationStore';
import { Button } from '../components/ui/button';




export const Settings: React.FC = () => {
    const { currentOrganization } = useOrganizationStore();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
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
                            <CardTitle>Privacy Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Privacy settings coming soon...</p>
                        </CardContent>
                    </Card>
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