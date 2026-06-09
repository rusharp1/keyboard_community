import { toggleLike } from "@/app/community/actions";

// 좋아요 토글(서버 액션). 비로그인 클릭 시 액션이 /login 으로 보냄.
export default function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  return (
    <form action={toggleLike}>
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm transition-colors ${
          liked
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-surface text-muted hover:text-foreground"
        }`}
      >
        <span>{liked ? "♥" : "♡"}</span>
        <span>{count}</span>
      </button>
    </form>
  );
}
