"use client";

import { useActionState, useEffect, useState } from "react";
import { updateComment } from "@/app/community/actions";
import { COMMENT_MAX } from "@/lib/community/limits";

export default function EditableCommentBody({
  commentId,
  postId,
  body,
  isHidden,
  canManage,
}: {
  commentId: string;
  postId: string;
  body: string;
  isHidden: boolean;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateComment, {});
  const [len, setLen] = useState(body.length);

  useEffect(() => {
    // 수정 성공 시 보기 모드로 복귀(서버 액션 결과에 대한 동기화).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setEditing(false);
  }, [state.ok]);

  if (isHidden) {
    return (
      <p className="mt-1 text-sm text-muted italic">신고로 숨겨진 댓글입니다.</p>
    );
  }

  if (!editing) {
    return (
      <div className="mt-1">
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {body}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setLen(body.length);
              setEditing(true);
            }}
            className="mt-1 text-xs text-muted hover:text-foreground"
          >
            수정
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-1 space-y-2">
      <input type="hidden" name="id" value={commentId} />
      <input type="hidden" name="post_id" value={postId} />
      <div className="relative">
        <textarea
          name="body"
          rows={3}
          required
          defaultValue={body}
          maxLength={COMMENT_MAX}
          onChange={(e) => setLen(e.target.value.length)}
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 pb-6 text-sm outline-none focus:border-accent"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-muted">
          {len}/{COMMENT_MAX}
        </span>
      </div>
      {state.fieldErrors?.body && (
        <p className="text-xs text-accent">{state.fieldErrors.body}</p>
      )}
      {state.error && <p className="text-xs text-accent">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
