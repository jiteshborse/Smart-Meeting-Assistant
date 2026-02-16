import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,

            setUser: (user) => set({ user }),
            setLoading: (loading) => set({ isLoading: loading }),

            signIn: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (error) throw error;

                    set({ user: data.user });
                } finally {
                    set({ isLoading: false });
                }
            },

            signUp: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password
                    });

                    if (error) throw error;

                    set({ user: data.user });
                } finally {
                    set({ isLoading: false });
                }
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({ user: null });
            },

            initialize: async () => {
                // Check for existing session
                const { data: { session } } = await supabase.auth.getSession();
                set({ user: session?.user || null, isLoading: false });

                // Listen for auth changes
                supabase.auth.onAuthStateChange((_event, session) => {
                    set({ user: session?.user || null });
                });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user })
        }
    )
);