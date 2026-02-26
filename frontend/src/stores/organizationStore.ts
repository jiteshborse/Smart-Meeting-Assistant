import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import type { Organization, OrganizationMember, OrganizationRole, Team } from '../types/database';

interface OrganizationState {
    organizations: Organization[];
    currentOrganization: Organization | null;
    members: OrganizationMember[];
    teams: Team[];
    isLoading: boolean;
    error: string | null;

    fetchOrganizations: () => Promise<void>;
    createOrganization: (name: string) => Promise<Organization | null>;
    setCurrentOrganization: (org: Organization | null) => void;
    fetchMembers: (organizationId: string) => Promise<void>;
    fetchTeams: (organizationId: string) => Promise<void>;
    createTeam: (organizationId: string, name: string, description?: string) => Promise<Team | null>;
    updateMemberRole: (memberId: string, role: OrganizationRole) => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    clearError: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
    organizations: [],
    currentOrganization: null,
    members: [],
    teams: [],
    isLoading: false,
    error: null,

    fetchOrganizations: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select(`
          *,
          organization_members!inner(*)
        `)
                .eq('organization_members.user_id', user.id);

            if (error) throw error;
            set({ organizations: data || [] });
        } catch (error) {
            console.error('Error fetching organizations:', error);
            set({ error: 'Failed to load organizations' });
        } finally {
            set({ isLoading: false });
        }
    },

    createOrganization: async (name: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        set({ isLoading: true, error: null });
        try {
            // Generate slug from name
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            // Create organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name,
                    slug,
                    created_by: user.id
                })
                .select()
                .single();

            if (orgError) throw orgError;

            // Add creator as owner
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: org.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // Refresh organizations list
            await get().fetchOrganizations();

            return org;
        } catch (error) {
            console.error('Error creating organization:', error);
            set({ error: 'Failed to create organization' });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentOrganization: (org) => {
        set({ currentOrganization: org });
        if (org) {
            get().fetchMembers(org.id);
            get().fetchTeams(org.id);
        }
    },

    fetchMembers: async (organizationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
          *,
          user:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
                .eq('organization_id', organizationId);

            if (error) throw error;
            set({ members: data || [] });
        } catch (error) {
            console.error('Error fetching members:', error);
            set({ error: 'Failed to load members' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchTeams: async (organizationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('organization_id', organizationId);

            if (error) throw error;
            set({ teams: data || [] });
        } catch (error) {
            console.error('Error fetching teams:', error);
            set({ error: 'Failed to load teams' });
        } finally {
            set({ isLoading: false });
        }
    },

    createTeam: async (organizationId: string, name: string, description?: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('teams')
                .insert({
                    organization_id: organizationId,
                    name,
                    description
                })
                .select()
                .single();

            if (error) throw error;

            // Refresh teams list
            await get().fetchTeams(organizationId);

            return data;
        } catch (error) {
            console.error('Error creating team:', error);
            set({ error: 'Failed to create team' });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    updateMemberRole: async (memberId: string, role: OrganizationRole) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ role })
                .eq('id', memberId);

            if (error) throw error;

            // Update local state
            set(state => ({
                members: state.members.map(m =>
                    m.id === memberId ? { ...m, role } : m
                )
            }));
        } catch (error) {
            console.error('Error updating member role:', error);
            set({ error: 'Failed to update member role' });
        } finally {
            set({ isLoading: false });
        }
    },

    removeMember: async (memberId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            // Update local state
            set(state => ({
                members: state.members.filter(m => m.id !== memberId)
            }));
        } catch (error) {
            console.error('Error removing member:', error);
            set({ error: 'Failed to remove member' });
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null })
}));