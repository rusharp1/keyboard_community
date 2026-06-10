import { toggleCommentLike } from "@/app/community/actions";

// 댓글 좋아요 토글(서버 액션). 비로그인 클릭 시 액션이 /login 으로 보냄.
export default function CommentLikeButton({
  commentId,
  postId,
  liked,
  count,
}: {
  commentId: string;
  postId: string;
  liked: boolean;
  count: number;
}) {
  return (
    <form action={toggleCommentLike} className="inline">
      <input type="hidden" name="comment_id" value={commentId} />
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors ${
          liked ? "text-accent" : "text-muted hover:text-foreground"
        }`}
      >
        <span aria-hidden>{liked ? "♥" : "♡"}</span>
        {count > 0 && <span>{count}</span>}
      </button>
    </form>
  );
}
