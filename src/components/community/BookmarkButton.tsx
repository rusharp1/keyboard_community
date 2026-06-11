import { toggleBookmark } from "@/app/community/actions";

// 북마크(스크랩) 토글. 비로그인 클릭 시 액션이 /login 으로 보냄.
export default function BookmarkButton({
  postId,
  bookmarked,
}: {
  postId: string;
  bookmarked: boolean;
}) {
  return (
    <form action={toggleBookmark}>
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        title={bookmarked ? "북마크 해제" : "북마크"}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm transition-colors ${
          bookmarked
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-surface text-muted hover:text-foreground"
        }`}
      >
        <span aria-hidden>{bookmarked ? "🔖" : "🏷"}</span>
        <span>{bookmarked ? "저장됨" : "저장"}</span>
      </button>
    </form>
  );
}
