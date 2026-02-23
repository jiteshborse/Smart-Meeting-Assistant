import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

export interface CalendarConnection {
    provider: string;
    email: string;
    created_at: string;
}

interface CalendarState {
    isConnected: boolean;
    connection: CalendarConnection | null;
    events: CalendarEvent[];
    isLoading: boolean;
    error: string | null;

    checkConnection: () => Promise<void>;
    connectCalendar: () => Promise<void>;
    disconnectCalendar: () => Promise<void>;
    fetchEvents: (maxResults?: number) => Promise<void>;
    createEvent: (eventData: any) => Promise<CalendarEvent | null>;
    clearError: () => void;
}

const API_URL = import.meta.env.VITE_API_URL;

export const useCalendarStore = create<CalendarState>((set, get) => ({
    isConnected: false,
    connection: null,
    events: [],
    isLoading: false,
    error: null,

    checkConnection: async () => {
        try {
            set({ isLoading: true, error: null });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`${API_URL}/api/calendar/status`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to check connection');

            const data = await response.json();

            set({
                isConnected: data.connected,
                connection: data.connection || null
            });

        } catch (error) {
            console.error('Error checking calendar connection:', error);
            set({ error: 'Failed to check calendar connection' });
        } finally {
            set({ isLoading: false });
        }
    },

    connectCalendar: async () => {
        try {
            set({ isLoading: true, error: null });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/calendar/auth/google`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to get auth URL');

            const { url } = await response.json();

            // Redirect to Google OAuth
            window.location.href = url;

        } catch (error) {
            console.error('Error connecting calendar:', error);
            set({ error: 'Failed to connect calendar' });
            set({ isLoading: false });
        }
    },

    disconnectCalendar: async () => {
        try {
            set({ isLoading: true, error: null });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/calendar/disconnect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to disconnect');

            set({
                isConnected: false,
                connection: null,
                events: []
            });

        } catch (error) {
            console.error('Error disconnecting calendar:', error);
            set({ error: 'Failed to disconnect calendar' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchEvents: async (maxResults = 50) => {
        try {
            set({ isLoading: true, error: null });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/calendar/events?max=${maxResults}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();

            // Convert string dates to Date objects
            const events = data.events.map((event: any) => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
            }));

            set({ events });

        } catch (error) {
            console.error('Error fetching events:', error);
            set({ error: 'Failed to fetch calendar events' });
        } finally {
            set({ isLoading: false });
        }
    },

    createEvent: async (eventData) => {
        try {
            set({ isLoading: true, error: null });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/api/calendar/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) throw new Error('Failed to create event');

            const data = await response.json();

            // Refresh events list
            await get().fetchEvents();

            return data.event;

        } catch (error) {
            console.error('Error creating event:', error);
            set({ error: 'Failed to create calendar event' });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null })
}));