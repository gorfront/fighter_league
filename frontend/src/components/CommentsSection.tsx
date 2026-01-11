import { useState, useEffect } from "react";
import apiClient from "@/api/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface CommentAuthor {
    id: number;
    name: string;
    avatar: string | null;
    country: string;
    user_type: string;
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    author: CommentAuthor;
}

interface CommentsSectionProps {
    fightId: string;
}

const CommentsSection = ({ fightId }: CommentsSectionProps) => {
    const { t } = useTranslation();
    const { token, userType, currentUser } = useAuthStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await apiClient.get<Comment[]>(`/comments/${fightId}`);
                setComments(res.data);
            } catch (err) {
                console.error("Failed to fetch comments", err);
            } finally {
                setLoading(false);
            }
        };
        if (fightId) fetchComments();
    }, [fightId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        if (userType === "GUEST") {
            toast.error(t("guest_comment_error", "Guest users cannot comment"));
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient.post<Comment>("/comments", {
                fight_id: parseInt(fightId),
                content: newComment,
            });
            setComments([res.data, ...comments]);
            setNewComment("");
            toast.success(t("comment_posted_success", "Comment posted!"));
        } catch (err) {
            console.error("Failed to post comment", err);
            toast.error(t("comment_post_error", "Failed to post comment"));
        } finally {
            setSubmitting(false);
        }
    };

    const getUserAvatar = (avatar: string | null) => {
        if (!avatar) return undefined;
        if (avatar.startsWith("http")) return avatar;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_FIGHTER_IMAGES as string;
        return supabaseAnonKey ? supabaseAnonKey + avatar : avatar;
    };

    return (
        <Card className="mt-6 md:mt-8 shadow-md border-primary/10">
            <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                    {t("comments_title", "Comments")}
                    <span className="text-muted-foreground ml-1 text-sm md:text-base">({comments.length})</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                <div className="mb-6 md:mb-8">
                    {!token ? (
                        <div className="p-4 bg-muted/50 rounded-lg text-center text-sm md:text-base text-muted-foreground">
                            {t("login_to_comment", "Please log in to write a comment.")}
                        </div>
                    ) : userType === "GUEST" ? (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center text-sm md:text-base text-yellow-600 dark:text-yellow-400">
                            {t("guest_comment_restriction", "Guest users cannot post comments.")}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                            <div className="hidden md:block">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={getUserAvatar(currentUser?.avatar || null)} />
                                    <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    placeholder={t("write_comment_placeholder", "Write a comment...")}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[80px] md:min-h-[100px] resize-none text-sm md:text-base"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handlePostComment}
                                        disabled={submitting || !newComment.trim()}
                                        className="w-full md:w-auto gap-2"
                                        size="sm"
                                    >
                                        {submitting ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <Send className="h-3 w-3 md:h-4 md:w-4" />}
                                        {t("post_comment_btn", "Post Comment")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="mb-4 md:mb-6" />

                {loading ? (
                    <div className="flex justify-center p-6 md:p-8">
                        <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-sm md:text-base text-muted-foreground">
                        {t("no_comments_yet", "No comments yet. Be the first to share your thoughts!")}
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] md:h-[500px] pr-3 md:pr-4">
                        <div className="space-y-4 md:space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 md:gap-4 group items-start">
                                    <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-border mt-1">
                                        <AvatarImage src={getUserAvatar(comment.author.avatar)} />
                                        <AvatarFallback className="text-xs md:text-sm">{comment.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1 bg-muted/30 p-3 rounded-lg md:bg-transparent md:p-0">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-sm md:text-base">{comment.author.name}</span>
                                                {comment.author.user_type === "ADMIN" && (
                                                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                                                )}
                                                {comment.author.user_type === "FIGHTER" && (
                                                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">FIGHTER</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] md:text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs md:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};

export default CommentsSection;