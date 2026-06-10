import AuthorBadge from "./AuthorBadge";
import ReplyToggle from "./ReplyToggle";
import EditableCommentBody from "./EditableCommentBody";
import ConfirmSubmitButton from "./ConfirmSubmitButton";
import ReportButton from "./ReportButton";
import { formatDate } from "@/lib/community/format";
import { deleteComment } from "@/app/community/actions";
import type { Comment } from "@/lib/community/types";

export default function CommentView({
  comment,
  isReply = false,
  canManage,
  canReport = false,
  allowReply = false,
}: {
  comment: Comment;
  isReply?: boolean;
  canManage: boolean;
  canReport?: boolean;
  allowReply?: boolean;
}) {
  return (
    <div className={isReply ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <AuthorBadge author={comment.author} />
          <span>·</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>
        {canManage && (
          <form action={deleteComment}>
            <input type="hidden" name="id" value={comment.id} />
            <input type="hidden" name="post_id" value={comment.post_id} />
            <ConfirmSubmitButton
              message="이 댓글을 삭제하시겠습니까?"
              className="hover:text-accent"
            >
              삭제
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      <EditableCommentBody
        commentId={comment.id}
        postId={comment.post_id}
        body={comment.body}
        isHidden={comment.is_hidden}
        canManage={canManage}
      />

      {allowReply && <ReplyToggle postId={comment.post_id} parentId={comment.id} />}

      {canReport && !comment.is_hidden && (
        <div className="mt-1 text-right">
          <ReportButton targetType="comment" targetId={comment.id} />
        </div>
      )}
    </div>
  );
}
