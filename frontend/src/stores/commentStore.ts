import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Comment {
    id: string;
    meeting_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    mentions: string[];
    timestamp_offset?: number;
    created_at: string;
    updated_at: string;
    user?: {
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    replies?: Comment[];
    reactions?: CommentReaction[];
}

export interface CommentReaction {
    id: string;
    comment_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

interface CommentState {
    comments: Comment[];
    isLoading: boolean;
    error: string | null;
    realtimeChannel: RealtimeChannel | null;

    fetchComments: (meetingId: string) => Promise<void>;
    addComment: (meetingId: string, content: string, parentId?: string, timestampOffset?: number) => Promise<Comment | null>;
    updateComment: (commentId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    addReaction: (commentId: string, emoji: string) => Promise<void>;
    removeReaction: (commentId: string, emoji: string) => Promise<void>;
    subscribeToComments: (meetingId: string) => void;
    unsubscribeFromComments: () => void;
    clearError: () => void;
}

// Helper: fetch profiles for a list of user IDs and return a map
async function fetchProfileMap(userIds: string[]): Promise<Map<string, { email: string; full_name: string | null; avatar_url: string | null }>> {
    const map = new Map<string, { email: string; full_name: string | null; avatar_url: string | null }>();
    if (userIds.length === 0) return map;

    const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

    if (data) {
        data.forEach(p => map.set(p.id, { email: p.email || '', full_name: p.full_name, avatar_url: p.avatar_url }));
    }
    return map;
}

// Helper: enrich comments with profile data
function enrichComments(comments: any[], profileMap: Map<string, any>): Comment[] {
    return comments.map(c => ({
        ...c,
        user: profileMap.get(c.user_id) || null,
        replies: c.replies?.map((r: any) => ({
            ...r,
            user: profileMap.get(r.user_id) || null
        }))
    }));
}

export const useCommentStore = create<CommentState>((set, get) => ({
    comments: [],
    isLoading: false,
    error: null,
    realtimeChannel: null,

    fetchComments: async (meetingId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Step 1: Fetch comments with reactions and replies
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    reactions:comment_reactions(*),
                    replies:comments!parent_id(
                        *,
                        reactions:comment_reactions(*)
                    )
                `)
                .eq('meeting_id', meetingId)
                .is('parent_id', null)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Step 2: Collect all unique user IDs
            const userIds = new Set<string>();
            (data || []).forEach(c => {
                userIds.add(c.user_id);
                c.replies?.forEach((r: any) => userIds.add(r.user_id));
            });

            // Step 3: Fetch profiles
            const profileMap = await fetchProfileMap([...userIds]);

            // Step 4: Merge
            set({ comments: enrichComments(data || [], profileMap) });
        } catch (error) {
            console.error('Error fetching comments:', error);
            set({ error: 'Failed to load comments' });
        } finally {
            set({ isLoading: false });
        }
    },

    addComment: async (meetingId: string, content: string, parentId?: string, timestampOffset?: number) => {
        const user = useAuthStore.getState().user;
        if (!user) return null;

        // Extract mentions (@username)
        const mentionRegex = /@(\w+)/g;
        const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    meeting_id: meetingId,
                    user_id: user.id,
                    parent_id: parentId || null,
                    content,
                    mentions,
                    timestamp_offset: timestampOffset
                })
                .select('*')
                .single();

            if (error) throw error;

            // Build enriched comment with user info from auth store
            const enrichedComment: Comment = {
                ...data,
                user: {
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || null,
                    avatar_url: user.user_metadata?.avatar_url || null
                },
                reactions: [],
                replies: []
            };

            // Update local state
            if (parentId) {
                set(state => ({
                    comments: state.comments.map(comment =>
                        comment.id === parentId
                            ? {
                                ...comment,
                                replies: [...(comment.replies || []), enrichedComment]
                            }
                            : comment
                    )
                }));
            } else {
                set(state => ({
                    comments: [...state.comments, enrichedComment]
                }));
            }

            return enrichedComment;
        } catch (error) {
            console.error('Error adding comment:', error);
            set({ error: 'Failed to add comment' });
            return null;
        }
    },

    updateComment: async (commentId: string, content: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', commentId);

            if (error) throw error;

            // Update local state
            set(state => ({
                comments: state.comments.map(comment =>
                    comment.id === commentId
                        ? { ...comment, content }
                        : {
                            ...comment,
                            replies: comment.replies?.map(reply =>
                                reply.id === commentId ? { ...reply, content } : reply
                            )
                        }
                )
            }));
        } catch (error) {
            console.error('Error updating comment:', error);
            set({ error: 'Failed to update comment' });
        }
    },

    deleteComment: async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            // Update local state
            set(state => ({
                comments: state.comments
                    .filter(comment => comment.id !== commentId)
                    .map(comment => ({
                        ...comment,
                        replies: comment.replies?.filter(reply => reply.id !== commentId)
                    }))
            }));
        } catch (error) {
            console.error('Error deleting comment:', error);
            set({ error: 'Failed to delete comment' });
        }
    },

    addReaction: async (commentId: string, emoji: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('comment_reactions')
                .insert({
                    comment_id: commentId,
                    user_id: user.id,
                    emoji
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            set(state => ({
                comments: state.comments.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            reactions: [...(comment.reactions || []), data]
                        }
                        : {
                            ...comment,
                            replies: comment.replies?.map(reply =>
                                reply.id === commentId
                                    ? {
                                        ...reply,
                                        reactions: [...(reply.reactions || []), data]
                                    }
                                    : reply
                            )
                        }
                )
            }));
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    },

    removeReaction: async (commentId: string, emoji: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const { error } = await supabase
                .from('comment_reactions')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
                .eq('emoji', emoji);

            if (error) throw error;

            // Update local state
            set(state => ({
                comments: state.comments.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            reactions: comment.reactions?.filter(r =>
                                !(r.user_id === user.id && r.emoji === emoji)
                            )
                        }
                        : {
                            ...comment,
                            replies: comment.replies?.map(reply =>
                                reply.id === commentId
                                    ? {
                                        ...reply,
                                        reactions: reply.reactions?.filter(r =>
                                            !(r.user_id === user.id && r.emoji === emoji)
                                        )
                                    }
                                    : reply
                            )
                        }
                )
            }));
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    },

    subscribeToComments: (meetingId: string) => {
        // Clean up existing subscription
        get().unsubscribeFromComments();

        const channel = supabase
            .channel(`comments:${meetingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `meeting_id=eq.${meetingId}`
                },
                async (payload) => {
                    const newId = (payload.new as any).id;
                    const newUserId = (payload.new as any).user_id;

                    // Skip if already in local state (added by addComment)
                    const existing = get().comments;
                    const alreadyExists = existing.some(c => c.id === newId) ||
                        existing.some(c => c.replies?.some(r => r.id === newId));
                    if (alreadyExists) return;

                    // Fetch profile for this user
                    const profileMap = await fetchProfileMap([newUserId]);

                    const data = {
                        ...(payload.new as any),
                        user: profileMap.get(newUserId) || null,
                        reactions: [],
                        replies: []
                    } as Comment;

                    if (data.parent_id) {
                        set(state => ({
                            comments: state.comments.map(comment =>
                                comment.id === data.parent_id
                                    ? {
                                        ...comment,
                                        replies: [...(comment.replies || []), data]
                                    }
                                    : comment
                            )
                        }));
                    } else {
                        set(state => ({
                            comments: [...state.comments, data]
                        }));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'comments',
                    filter: `meeting_id=eq.${meetingId}`
                },
                (payload) => {
                    const deletedId = (payload.old as any).id;
                    set(state => ({
                        comments: state.comments
                            .filter(c => c.id !== deletedId)
                            .map(c => ({
                                ...c,
                                replies: c.replies?.filter(r => r.id !== deletedId)
                            }))
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'comments',
                    filter: `meeting_id=eq.${meetingId}`
                },
                (payload) => {
                    const updated = payload.new as any;
                    set(state => ({
                        comments: state.comments.map(c =>
                            c.id === updated.id
                                ? { ...c, content: updated.content, updated_at: updated.updated_at }
                                : {
                                    ...c,
                                    replies: c.replies?.map(r =>
                                        r.id === updated.id
                                            ? { ...r, content: updated.content, updated_at: updated.updated_at }
                                            : r
                                    )
                                }
                        )
                    }));
                }
            )
            .subscribe();

        set({ realtimeChannel: channel });
    },

    unsubscribeFromComments: () => {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            set({ realtimeChannel: null });
        }
    },

    clearError: () => set({ error: null })
}));