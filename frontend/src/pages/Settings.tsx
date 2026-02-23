import React from 'react';
import { CalendarConnection } from '../components/calendar/CalendarConnection';
import { CalendarEvents } from '../components/calendar/CalendarEvents';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Bell, Shield, Calendar } from 'lucide-react';

export const Settings: React.FC = () => {
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

                <TabsContent value="calendar" className="space-y-6">
                    <CalendarConnection />
                    <CalendarEvents />
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
            </Tabs>
        </div>
    );
};