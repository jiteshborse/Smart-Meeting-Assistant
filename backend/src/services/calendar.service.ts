import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin } from '../lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: { email: string; responseStatus?: string }[];
    location?: string;
    hangoutLink?: string;
}

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    // Generate auth URL for frontend
    getAuthUrl(userId: string): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            state: userId, // Pass user ID to identify who is connecting
            prompt: 'consent' // Force to get refresh token
        });
    }

    // Handle OAuth callback
    async handleCallback(code: string, userId: string): Promise<void> {
        try {
            // Exchange code for tokens
            const { tokens } = await this.oauth2Client.getToken(code);

            if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
                throw new Error('Missing required tokens');
            }

            // Get user email from Google
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            this.oauth2Client.setCredentials(tokens);

            const userInfo = await oauth2.userinfo.get();
            const email = userInfo.data.email;

            if (!email) {
                throw new Error('Could not get user email');
            }

            // Store tokens in database
            const { error } = await supabaseAdmin
                .from('calendar_connections')
                .upsert({
                    user_id: userId,
                    provider: 'google',
                    email: email,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: new Date(tokens.expiry_date).toISOString()
                }, {
                    onConflict: 'user_id,provider'
                });

            if (error) throw error;

        } catch (error) {
            console.error('Error in OAuth callback:', error);
            throw error;
        }
    }

    // Get user's calendar connection
    private async getConnection(userId: string) {
        const { data, error } = await supabaseAdmin
            .from('calendar_connections')
            .select('*')
            .eq('user_id', userId)
            .eq('provider', 'google')
            .single();

        if (error || !data) {
            throw new Error('No calendar connection found');
        }

        return data;
    }

    // Get authenticated client for user
    private async getAuthClient(userId: string): Promise<OAuth2Client> {
        const connection = await this.getConnection(userId);

        // Check if token is expired
        const expiresAt = new Date(connection.expires_at);
        const now = new Date();

        if (expiresAt <= now) {
            // Token expired, refresh it
            return await this.refreshToken(userId, connection.refresh_token);
        }

        // Set credentials and return client
        this.oauth2Client.setCredentials({
            access_token: connection.access_token,
            refresh_token: connection.refresh_token,
            expiry_date: expiresAt.getTime()
        });

        return this.oauth2Client;
    }

    // Refresh expired token
    private async refreshToken(userId: string, refreshToken: string): Promise<OAuth2Client> {
        try {
            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await this.oauth2Client.refreshAccessToken();

            if (!credentials.access_token || !credentials.expiry_date) {
                throw new Error('Failed to refresh token');
            }

            // Update in database
            const { error } = await supabaseAdmin
                .from('calendar_connections')
                .update({
                    access_token: credentials.access_token,
                    expires_at: new Date(credentials.expiry_date).toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('provider', 'google');

            if (error) throw error;

            this.oauth2Client.setCredentials(credentials);
            return this.oauth2Client;

        } catch (error) {
            console.error('Error refreshing token:', error);
            throw new Error('Failed to refresh calendar token');
        }
    }

    // Fetch upcoming events
    async getUpcomingEvents(userId: string, maxResults: number = 50): Promise<CalendarEvent[]> {
        try {
            const auth = await this.getAuthClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                maxResults,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = response.data.items || [];

            return events.map(event => ({
                id: event.id || '',
                summary: event.summary || 'Untitled Event',
                description: event.description || undefined,
                start: new Date(event.start?.dateTime || event.start?.date || ''),
                end: new Date(event.end?.dateTime || event.end?.date || ''),
                attendees: event.attendees?.map(a => ({
                    email: a.email || '',
                    responseStatus: a.responseStatus || undefined
                })),
                location: event.location || undefined,
                hangoutLink: event.hangoutLink || undefined
            }));

        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    // Create calendar event
    async createEvent(
        userId: string,
        event: Omit<CalendarEvent, 'id'>,
        meetingId?: string
    ): Promise<CalendarEvent> {
        try {
            const auth = await this.getAuthClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                    summary: event.summary,
                    description: event.description,
                    start: {
                        dateTime: event.start.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    end: {
                        dateTime: event.end.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    attendees: event.attendees?.map(a => ({ email: a.email })),
                    location: event.location,
                    conferenceData: event.hangoutLink ? {
                        createRequest: {
                            requestId: `${Date.now()}`,
                            conferenceSolutionKey: { type: 'hangoutsMeet' }
                        }
                    } : undefined
                },
                conferenceDataVersion: event.hangoutLink ? 1 : 0
            });

            const createdEvent = response.data;

            // Store in our database
            if (meetingId) {
                await supabaseAdmin
                    .from('calendar_events')
                    .insert({
                        user_id: userId,
                        calendar_event_id: createdEvent.id || '',
                        summary: createdEvent.summary || '',
                        description: createdEvent.description,
                        start_time: createdEvent.start?.dateTime || createdEvent.start?.date,
                        end_time: createdEvent.end?.dateTime || createdEvent.end?.date,
                        attendees: createdEvent.attendees || [],
                        meeting_id: meetingId,
                        raw_data: createdEvent
                    });
            }

            return {
                id: createdEvent.id || '',
                summary: createdEvent.summary || '',
                description: createdEvent.description || undefined,
                start: new Date(createdEvent.start?.dateTime || createdEvent.start?.date || ''),
                end: new Date(createdEvent.end?.dateTime || createdEvent.end?.date || ''),
                attendees: createdEvent.attendees?.map(a => ({
                    email: a.email || '',
                    responseStatus: a.responseStatus || undefined
                })),
                location: createdEvent.location || undefined,
                hangoutLink: createdEvent.hangoutLink || undefined
            };

        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    // Update calendar event
    async updateEvent(
        userId: string,
        eventId: string,
        updates: Partial<Omit<CalendarEvent, 'id'>>
    ): Promise<void> {
        try {
            const auth = await this.getAuthClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const requestBody: any = {};

            if (updates.summary) requestBody.summary = updates.summary;
            if (updates.description) requestBody.description = updates.description;
            if (updates.start) {
                requestBody.start = {
                    dateTime: updates.start.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                };
            }
            if (updates.end) {
                requestBody.end = {
                    dateTime: updates.end.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                };
            }
            if (updates.attendees) {
                requestBody.attendees = updates.attendees.map(a => ({ email: a.email }));
            }

            await calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                requestBody
            });

        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    // Delete calendar connection
    async disconnect(userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('calendar_connections')
            .delete()
            .eq('user_id', userId)
            .eq('provider', 'google');

        if (error) throw error;
    }
}

export const googleCalendarService = new GoogleCalendarService();