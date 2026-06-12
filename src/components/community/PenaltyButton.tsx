"use client";

import { penalizeAuthor } from "@/app/community/actions";
import { PENALTY_SEVERITIES } from "@/lib/community/types";

// 검토큐에서 대상 작성자에게 벌점을 부과하는 폼. 콘텐츠당 1회(이미 부과 시 표시만).
export default function PenaltyButton({
  targetType,
  targetId,
  authorNickname,
  alreadyPenalized,
}: {
  targetType: "post" | "comment" | "review";
  targetId: string;
  authorNickname: string | null;
  alreadyPenalized: boolean;
}) {
  if (alreadyPenalized) {
    return (
      <span className="rounded-md bg-accent/15 px-2.5 py-1 text-accent">벌점 부과됨</span>
    );
  }
  return (
    <form
      action={penalizeAuthor}
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        if (
          !window.confirm(
            `${authorNickname ?? "작성자"}님에게 벌점을 부과할까요? 누적에 따라 활동정지·영구정지될 수 있습니다.`,
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <select
        name="points"
        defaultValue="1"
        aria-label="벌점 심각도"
        className="rounded-md border border-border bg-surface px-1.5 py-1 text-muted"
      >
        {PENALTY_SEVERITIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <input
        name="memo"
        placeholder="사유 메모(선택)"
        maxLength={500}
        className="w-32 rounded-md border border-border bg-surface px-2 py-1 text-foreground placeholder:text-muted"
      />
      <button
        type="submit"
        className="rounded-md border border-border px-2.5 py-1 text-muted hover:text-accent"
      >
        벌점 부과
      </button>
    </form>
  );
}
