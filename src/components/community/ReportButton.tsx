"use client";

import { useActionState, useState } from "react";
import { reportTarget } from "@/app/community/actions";
import { REPORT_REASONS } from "@/lib/community/types";

// 글·댓글 신고 버튼 + 펼침 패널(사유 선택 + 상세). 서버 액션으로 등록.
export default function ReportButton({
  targetType,
  targetId,
  className = "",
}: {
  targetType: "post" | "comment";
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportTarget, {});

  if (state.ok) {
    return <span className={`text-xs text-muted ${className}`}>신고 접수됨</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-muted hover:text-accent ${className}`}
      >
        신고
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-2 space-y-2 rounded-lg border border-border bg-surface p-3"
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <p className="text-xs font-medium text-foreground">신고 사유</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {REPORT_REASONS.map((r, i) => (
          <label key={r.value} className="flex items-center gap-1.5 text-xs text-foreground">
            <input
              type="radio"
              name="reason"
              value={r.value}
              defaultChecked={i === 0}
              className="accent-accent"
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        name="detail"
        rows={2}
        maxLength={500}
        placeholder="상세 내용(선택)"
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-accent"
      />
      {state.fieldErrors?.reason && (
        <p className="text-xs text-accent">{state.fieldErrors.reason}</p>
      )}
      {state.error && <p className="text-xs text-accent">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "접수 중…" : "신고하기"}
        </button>
      </div>
    </form>
  );
}
