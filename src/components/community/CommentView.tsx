import AuthorBadge from "./AuthorBadge";
import ReplyToggle from "./ReplyToggle";
import EditableCommentBody from "./EditableCommentBody";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import ReportButton from "./ReportButton";
import CommentLikeButton from "./CommentLikeButton";
import { formatDate } from "@/lib/community/format";
import { deleteComment } from "@/app/community/actions";
import type { Comment } from "@/lib/community/types";

export default function CommentView({
  comment,
  isReply = false,
  canManage,
  canReport = false,
  allowReply = false,
  liked = false,
}: {
  comment: Comment;
  isReply?: boolean;
  canManage: boolean;
  canReport?: boolean;
  allowReply?: boolean;
  liked?: boolean;
}) {
  return (
    <div className={isReply ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
        <AuthorBadge
          author={comment.author}
          href={
            comment.author
              ? `/community/u/${encodeURIComponent(comment.author.nickname)}`
              : undefined
          }
        />
        <span>·</span>
        <span className="shrink-0">{formatDate(comment.created_at)}</span>
      </div>

      <EditableCommentBody
        commentId={comment.id}
        postId={comment.post_id}
        body={comment.body}
        isHidden={comment.is_hidden}
        canManage={canManage}
      />

      {/* 액션: 좋아요·답글·신고·삭제를 한 줄에 */}
      {(!comment.is_hidden || allowReply || canManage) && (
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {!comment.is_hidden && (
            <CommentLikeButton
              commentId={comment.id}
              postId={comment.post_id}
              liked={liked}
              count={comment.like_count}
            />
          )}
          {allowReply && (
            <ReplyToggle postId={comment.post_id} parentId={comment.id} />
          )}
          {canReport && !comment.is_hidden && (
            <ReportButton targetType="comment" targetId={comment.id} />
          )}
          {canManage && (
            <form action={deleteComment} className="shrink-0">
              <input type="hidden" name="id" value={comment.id} />
              <input type="hidden" name="post_id" value={comment.post_id} />
              <ConfirmSubmitButton
                message="이 댓글을 삭제하시겠습니까?"
                className="text-xs text-muted hover:text-accent"
              >
                삭제
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
