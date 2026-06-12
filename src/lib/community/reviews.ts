import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ItemType } from "@/data/items";
import type { PostListItem, Review, ReviewStats } from "./types";

const REVIEW_AUTHOR = "author:profiles!user_id(nickname, activity_score, role)";
const REVIEW_COLS = `id, user_id, item_type, item_slug, axis1, axis2, axis3, body, is_hidden, created_at, ${REVIEW_AUTHOR}`;
// 관련 후기 글 목록(community queries.ts의 LIST_COLS와 동일 형태).
const POST_LIST_COLS = `id, category_id, title, tags, images, view_count, like_count, comment_count, pinned, created_at, ${REVIEW_AUTHOR}`;

type RawStats = {
  item_slug?: string;
  n: number;
  avg1: number;
  avg2: number;
  avg3: number;
  avg_overall: number;
};

function toStats(d: RawStats): ReviewStats {
  // PostgREST가 numeric을 문자열로 줄 수 있어 Number로 강제.
  return {
    n: Number(d.n),
    avg1: Number(d.avg1),
    avg2: Number(d.avg2),
    avg3: Number(d.avg3),
    overall: Number(d.avg_overall),
  };
}

// 아이템의 공개 리뷰 목록(숨김 제외, 최신순).
export async function getReviewsForItem(
  type: ItemType,
  slug: string,
): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_COLS)
    .eq("item_type", type)
    .eq("item_slug", slug)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as unknown as Review[]) ?? [];
}

// 단일 아이템 집계(상세 요약).
export async function getReviewStats(
  type: ItemType,
  slug: string,
): Promise<ReviewStats | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_stats")
    .select("n, avg1, avg2, avg3, avg_overall")
    .eq("item_type", type)
    .eq("item_slug", slug)
    .maybeSingle();
  return data ? toStats(data as RawStats) : null;
}

// 타입 전체 집계 → slug 맵(목록 카드 배지·평점순 정렬).
export async function getReviewStatsBulk(
  type: ItemType,
): Promise<Record<string, ReviewStats>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_stats")
    .select("item_slug, n, avg1, avg2, avg3, avg_overall")
    .eq("item_type", type);
  const map: Record<string, ReviewStats> = {};
  for (const r of (data ?? []) as RawStats[]) {
    if (r.item_slug) map[r.item_slug] = toStats(r);
  }
  return map;
}

// 본인 기존 리뷰(폼 프리필). unique(user,type,slug)라 최대 1개.
export async function getMyReview(
  type: ItemType,
  slug: string,
  userId: string,
): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_COLS)
    .eq("item_type", type)
    .eq("item_slug", slug)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as unknown as Review | null) ?? null;
}

// 아이템에 태깅된 심층 후기 글(숨김 제외).
export async function getRelatedPosts(
  type: ItemType,
  slug: string,
): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_LIST_COLS)
    .eq("item_type", type)
    .eq("item_slug", slug)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as unknown as PostListItem[]) ?? [];
}
