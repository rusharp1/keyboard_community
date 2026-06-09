import Link from "next/link";
import CommentForm from "./CommentForm";
import CommentView from "./CommentView";
import type { Comment } from "@/lib/community/types";

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  isStaff,
}: {
  postId: string;
  comments: Comment[];
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const tops = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => comments.filter((c) => c.parent_id === id);
  const canManage = (c: Comment) => isStaff || c.user_id === currentUserId;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-foreground">
        댓글 {comments.length}
      </h2>

      <div className="mt-3">
        {currentUserId ? (
          <CommentForm postId={postId} />
        ) : (
          <p className="rounded-lg border border-border bg-surface px-3 py-3 text-sm text-muted">
            댓글을 쓰려면{" "}
            <Link href="/login" className="text-accent hover:underline">
              로그인
            </Link>
            하세요.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {tops.length === 0 && (
          <p className="text-sm text-muted">첫 댓글을 남겨보세요.</p>
        )}
        {tops.map((c) => (
          <div key={c.id} className="space-y-3">
            <CommentView
              comment={c}
              canManage={canManage(c)}
              allowReply={!!currentUserId}
            />
            {childrenOf(c.id).map((child) => (
              <CommentView
                key={child.id}
                comment={child}
                isReply
                canManage={canManage(child)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
