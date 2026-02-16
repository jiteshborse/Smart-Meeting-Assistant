import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Meeting } from '../types/database';
import { useAuthStore } from './authStore';

interface MeetingState {
    meetings: Meeting[];
    currentMeeting: Meeting | null;
    isLoading: boolean;
    fetchMeetings: () => Promise<void>;
    createMeeting: (title: string) => Promise<Meeting | null>;
    updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
    setCurrentMeeting: (meeting: Meeting | null) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
    meetings: [],
    currentMeeting: null,
    isLoading: false,

    fetchMeetings: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('meetings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ meetings: data || [] });
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createMeeting: async (title: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('meetings')
                .insert([
                    {
                        user_id: user.id,
                        title,
                        status: 'processing'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Update local state
            set((state) => ({
                meetings: [data, ...state.meetings]
            }));

            return data;
        } catch (error) {
            console.error('Error creating meeting:', error);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    updateMeeting: async (id: string, data: Partial<Meeting>) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase
                .from('meetings')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            // Update local state
            set((state) => ({
                meetings: state.meetings.map((m) =>
                    m.id === id ? { ...m, ...data } : m
                ),
                currentMeeting: state.currentMeeting?.id === id
                    ? { ...state.currentMeeting, ...data }
                    : state.currentMeeting
            }));
        } catch (error) {
            console.error('Error updating meeting:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    deleteMeeting: async (id: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase
                .from('meetings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Update local state
            set((state) => ({
                meetings: state.meetings.filter((m) => m.id !== id),
                currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting
            }));
        } catch (error) {
            console.error('Error deleting meeting:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentMeeting: (meeting) => set({ currentMeeting: meeting })
}));