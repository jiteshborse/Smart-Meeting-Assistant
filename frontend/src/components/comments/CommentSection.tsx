import React, { useState, useEffect, useRef } from 'react';
import { useCommentStore } from '../../stores/commentStore';
import { useAuthStore } from '../../stores/authStore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import {
    MoreVertical,
    Edit,
    Trash2,
    Reply,
    Smile,
    Send
} from 'lucide-react';
import type { Comment } from '../../stores/commentStore';
import { EmojiPicker } from './EmojiPicker';

interface CommentSectionProps {
    meetingId: string;
    audioPlayerRef?: React.RefObject<HTMLAudioElement | null>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
    meetingId,
    audioPlayerRef
}) => {
    const {
        comments,
        isLoading,
        fetchComments,
        addComment,
        updateComment,
        deleteComment,
        addReaction,
        removeReaction,
        subscribeToComments,
        unsubscribeFromComments
    } = useCommentStore();

    const { user } = useAuthStore();
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchComments(meetingId);
        subscribeToComments(meetingId);

        return () => {
            unsubscribeFromComments();
        };
    }, [meetingId]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        const comment = await addComment(meetingId, newComment, replyingTo || undefined);
        if (comment) {
            setNewComment('');
            setReplyingTo(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    const handleReaction = async (commentId: string, emoji: string) => {
        const comment = comments.find(c => c.id === commentId) ||
            comments.flatMap(c => c.replies || []).find(r => r.id === commentId);

        const existingReaction = comment?.reactions?.find(
            r => r.user_id === user?.id && r.emoji === emoji
        );

        if (existingReaction) {
            await removeReaction(commentId, emoji);
        } else {
            await addReaction(commentId, emoji);
        }
    };

    const renderComment = (comment: Comment, isReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mb-4'}`}>
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        {comment.user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {comment.user?.full_name || comment.user?.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                                {comment.timestamp_offset !== undefined && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => {
                                            if (audioPlayerRef?.current) {
                                                audioPlayerRef.current.currentTime = comment.timestamp_offset!;
                                                audioPlayerRef.current.play();
                                            }
                                        }}
                                    >
                                        Jump to {Math.floor(comment.timestamp_offset / 60)}:
                                        {(comment.timestamp_offset % 60).toString().padStart(2, '0')}
                                    </Button>
                                )}
                            </div>

                            {comment.user_id === user?.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setEditingComment(comment.id);
                                            setEditContent(comment.content);
                                        }}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => deleteComment(comment.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {editingComment === comment.id ? (
                            <div className="mt-2">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="min-h-[60px]"
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            await updateComment(comment.id, editContent);
                                            setEditingComment(null);
                                        }}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingComment(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        )}

                        {/* Reactions */}
                        <div className="flex items-center gap-2 mt-2">
                            {comment.reactions?.reduce((unique, reaction) => {
                                if (!unique.find(r => r.emoji === reaction.emoji)) {
                                    unique.push({
                                        emoji: reaction.emoji,
                                        count: comment.reactions!.filter(r => r.emoji === reaction.emoji).length,
                                        userReacted: comment.reactions!.some(
                                            r => r.emoji === reaction.emoji && r.user_id === user?.id
                                        )
                                    });
                                }
                                return unique;
                            }, [] as any[]).map(({ emoji, count, userReacted }) => (
                                <Button
                                    key={emoji}
                                    variant="outline"
                                    size="sm"
                                    className={`h-7 px-2 ${userReacted ? 'bg-primary/10' : ''}`}
                                    onClick={() => handleReaction(comment.id, emoji)}
                                >
                                    <span className="mr-1">{emoji}</span>
                                    <span className="text-xs">{count}</span>
                                </Button>
                            ))}

                            <DropdownMenu
                                open={showEmojiPicker === comment.id}
                                onOpenChange={(open) => setShowEmojiPicker(open ? comment.id : null)}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <EmojiPicker onSelect={(emoji) => {
                                        handleReaction(comment.id, emoji);
                                        setShowEmojiPicker(null);
                                    }} />
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {!isReply && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => {
                                        setReplyingTo(comment.id);
                                        commentInputRef.current?.focus();
                                    }}
                                >
                                    <Reply className="h-3 w-3 mr-1" />
                                    Reply
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3">
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Comment input */}
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Textarea
                        ref={commentInputRef}
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px]"
                    />
                    {replyingTo && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-muted-foreground">
                                Replying to a comment
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-end mt-2">
                        <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                            <Send className="h-4 w-4 mr-2" />
                            {replyingTo ? 'Post Reply' : 'Post Comment'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to comment</p>
                    </div>
                ) : (
                    comments.map(comment => renderComment(comment))
                )}
            </div>
        </div>
    );
};