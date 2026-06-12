import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_AXES, type ItemType } from "@/data/items";
import {
  getMyReview,
  getRelatedPosts,
  getReviewStats,
  getReviewsForItem,
} from "@/lib/community/reviews";
import PostRow from "@/components/community/PostRow";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

// 도감 상세 하단 "평가" 섹션(서버 컴포넌트). 3개 도감 상세에서 공용.
// 평균(다축) + 작성/수정 폼(로그인 시) + 리뷰 목록 + 관련 후기 글.
export default async function ReviewSection({
  itemType,
  slug,
}: {
  itemType: ItemType;
  slug: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isStaff = p?.role === "admin" || p?.role === "moderator";
  }

  const axes = REVIEW_AXES[itemType];
  const [stats, reviews, myReview, related] = await Promise.all([
    getReviewStats(itemType, slug),
    getReviewsForItem(itemType, slug),
    user ? getMyReview(itemType, slug, user.id) : Promise.resolve(null),
    getRelatedPosts(itemType, slug),
  ]);
  const axisAvgs = stats ? [stats.avg1, stats.avg2, stats.avg3] : [0, 0, 0];

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-bold">평가</h2>

      {/* 평균 요약 */}
      <div className="rounded-xl border border-border bg-surface p-4">
        {stats && stats.n > 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                {stats.overall.toFixed(1)}
              </span>
              <div>
                <StarRating value={stats.overall} readOnly />
                <p className="text-xs text-muted">{stats.n}개의 평가</p>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {axes.map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="w-16 shrink-0 text-muted">{label}</span>
                  <StarRating value={axisAvgs[i]} readOnly size="text-sm" />
                  <span className="text-xs text-muted">{axisAvgs[i].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">아직 평가가 없어요.</p>
        )}
      </div>

      {/* 작성/수정 폼 (로그인 시) */}
      <div className="mt-4">
        {user ? (
          <ReviewForm
            itemType={itemType}
            itemSlug={slug}
            axes={axes}
            initial={myReview}
          />
        ) : (
          <Link
            href="/login"
            className="block rounded-xl border border-dashed border-border px-4 py-4 text-center text-sm text-muted hover:text-foreground"
          >
            로그인하고 평가 남기기
          </Link>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div className="mt-4">
        <ReviewList
          reviews={reviews}
          axes={axes}
          itemType={itemType}
          itemSlug={slug}
          currentUserId={user?.id ?? null}
          isStaff={isStaff}
        />
      </div>

      {/* 관련 후기 글(커뮤니티) */}
      {related.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold text-muted">관련 후기 글</h3>
          <div className="space-y-2">
            {related.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
