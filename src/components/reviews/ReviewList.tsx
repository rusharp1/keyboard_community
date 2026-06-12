import { deleteReview } from "@/app/community/actions";
import AuthorBadge from "@/components/community/AuthorBadge";
import ConfirmSubmitButton from "@/components/community/ConfirmSubmitButton";
import ReportButton from "@/components/community/ReportButton";
import { formatDate } from "@/lib/community/format";
import type { ItemType } from "@/data/items";
import type { Review } from "@/lib/community/types";
import StarRating from "./StarRating";

// 도감 상세 리뷰 목록. 신고(ReportButton)·삭제(본인/운영진)는 커뮤니티 패턴 재사용.
export default function ReviewList({
  reviews,
  axes,
  itemType,
  itemSlug,
  currentUserId,
  isStaff,
}: {
  reviews: Review[];
  axes: [string, string, string];
  itemType: ItemType;
  itemSlug: string;
  currentUserId: string | null;
  isStaff: boolean;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        아직 평가가 없어요. 첫 평가를 남겨보세요.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const mine = !!currentUserId && r.user_id === currentUserId;
        const axisVals = [r.axis1, r.axis2, r.axis3];
        return (
          <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <AuthorBadge author={r.author} />
              <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {axes.map((label, i) => (
                <span key={label} className="inline-flex items-center gap-1 text-muted">
                  {label}
                  <StarRating value={axisVals[i]} readOnly size="text-sm" />
                </span>
              ))}
            </div>
            {r.body && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs">
              {currentUserId && !mine && (
                <ReportButton targetType="review" targetId={r.id} />
              )}
              {(mine || isStaff) && (
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="item" value={`${itemType}:${itemSlug}`} />
                  <ConfirmSubmitButton
                    message="이 평가를 삭제할까요?"
                    className="text-muted hover:text-accent"
                  >
                    삭제
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
