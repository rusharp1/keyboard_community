import type { ReviewStats } from "@/lib/community/types";

// 도감 카드/목록용 종합 평점 배지. 리뷰 없으면 렌더 안 함.
export default function RatingBadge({
  stats,
  className = "",
}: {
  stats?: ReviewStats;
  className?: string;
}) {
  if (!stats || stats.n === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
      <span className="text-amber-400">★</span>
      <span className="font-medium text-foreground">{stats.overall.toFixed(1)}</span>
      <span className="text-muted">· {stats.n}</span>
    </span>
  );
}
