"use client";

import { upsertReview } from "@/app/community/actions";
import type { ItemType } from "@/data/items";
import StarRating from "./StarRating";

// 다축 별점 + 한줄 평 작성/수정. 본인 기존 리뷰가 있으면 프리필(수정 모드).
// 별점을 모두 선택해야 저장됨(서버에서 1~5 검증, 미선택 시 무시).
export default function ReviewForm({
  itemType,
  itemSlug,
  axes,
  initial,
}: {
  itemType: ItemType;
  itemSlug: string;
  axes: [string, string, string];
  initial?: { axis1: number; axis2: number; axis3: number; body: string | null } | null;
}) {
  const initialAxes = initial ? [initial.axis1, initial.axis2, initial.axis3] : [0, 0, 0];

  return (
    <form
      action={upsertReview}
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
      <input type="hidden" name="item" value={`${itemType}:${itemSlug}`} />
      <p className="text-sm font-semibold text-foreground">
        {initial ? "내 평가 수정" : "평가 남기기"}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {axes.map((label, i) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="text-sm text-muted">{label}</span>
            <StarRating name={`axis${i + 1}`} label={label} value={initialAxes[i]} />
          </div>
        ))}
      </div>
      <textarea
        name="body"
        rows={2}
        maxLength={1000}
        defaultValue={initial?.body ?? ""}
        placeholder="한 줄 평(선택)"
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">별점을 모두 선택해 주세요</span>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {initial ? "수정" : "등록"}
        </button>
      </div>
    </form>
  );
}
