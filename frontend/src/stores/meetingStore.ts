import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';
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
    uploadAudio: (meetingId: string, audioBlob: Blob) => Promise<string | null>;
    getAudioUrl: (meetingId: string) => Promise<string | null>;
    analyzeMeeting: (meetingId: string, transcript: string) => Promise<void>;
}

export const useMeetingStore = create<MeetingState>((set) => ({
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



    uploadAudio: async (meetingId: string, audioBlob: Blob): Promise<string | null> => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        try {
            // Create file path: user-id/meeting-id/recording.webm
            const filePath = `${user.id}/${meetingId}/recording.webm`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('meeting-recordings')
                .upload(filePath, audioBlob, {
                    contentType: audioBlob.type,
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Generate signed URL for immediate use
            const { data, error: urlError } = await supabase.storage
                .from('meeting-recordings')
                .createSignedUrl(filePath, 3600 * 24 * 365); // 1 year expiry for the metadata link (or use path)

            if (urlError) throw urlError;

            // Update meeting with audio URL (storing signed URL for now, but better to store path)
            await supabase
                .from('meetings')
                .update({
                    metadata: {
                        audio_path: filePath, // Store path for future signing
                        audio_size: audioBlob.size,
                        audio_type: audioBlob.type
                    }
                })
                .eq('id', meetingId);

            return data.signedUrl;
        } catch (error) {
            console.error('Error uploading audio:', error);
            return null;
        }
    },

    getAudioUrl: async (meetingId: string): Promise<string | null> => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        const filePath = `${user.id}/${meetingId}/recording.webm`;

        const { data, error } = await supabase.storage
            .from('meeting-recordings')
            .createSignedUrl(filePath, 3600); // 1 hour validity

        if (error) {
            console.error('Error getting signed URL:', error);
            return null;
        }

        return data.signedUrl;
    },

    analyzeMeeting: async (meetingId: string, transcript: string) => {
        set({ isLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const response = await fetch('http://localhost:3001/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ meetingId, transcript })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Analysis failed');
            }

            const analysis = await response.json();

            // Store updates locally
            set((state) => {
                const updatedMeeting = state.meetings.find(m => m.id === meetingId);
                if (!updatedMeeting) return state;

                const newMetadata = {
                    ...updatedMeeting.metadata,
                    ai_analysis: analysis
                };

                const newMeeting = { ...updatedMeeting, metadata: newMetadata };

                return {
                    meetings: state.meetings.map(m => m.id === meetingId ? newMeeting : m),
                    currentMeeting: state.currentMeeting?.id === meetingId ? newMeeting : state.currentMeeting
                };
            });
        } catch (error) {
            console.error('Error analyzing meeting:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },



    deleteMeeting: async (id: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true });
        try {
            // 1. Delete audio from Storage
            const filePath = `${user.id}/${id}/recording.webm`;
            const { error: storageError } = await supabase.storage
                .from('meeting-recordings')
                .remove([filePath]);

            if (storageError) {
                console.warn('Error deleting audio file (continuing to DB delete):', storageError);
            }

            // 2. Delete meeting from DB
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
            throw error; // Re-throw to handle in UI
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentMeeting: (meeting) => set({ currentMeeting: meeting })
}));