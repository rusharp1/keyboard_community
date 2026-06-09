"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addComment } from "@/app/community/actions";
import { COMMENT_MAX } from "@/lib/community/limits";

export default function CommentForm({
  postId,
  parentId,
  placeholder = "댓글을 입력하세요",
  onDone,
}: {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(addComment, {});
  const [len, setLen] = useState(0);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // 제출 성공 시 폼/카운터 초기화(서버 액션 결과에 대한 동기화).
    if (state.ok) {
      ref.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLen(0);
      onDone?.();
    }
  }, [state.ok, onDone]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <div className="relative">
        <textarea
          name="body"
          rows={parentId ? 2 : 3}
          required
          maxLength={COMMENT_MAX}
          onChange={(e) => setLen(e.target.value.length)}
          placeholder={placeholder}
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
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
