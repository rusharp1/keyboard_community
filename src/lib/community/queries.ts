import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AdminProfile,
  Category,
  Comment,
  ActivitySummary,
  ModerationItem,
  MyCommentItem,
  Post,
  PostListItem,
  ReportReason,
} from "./types";

// FK 컬럼(user_id) 힌트로 관계를 명시 — 안 그러면 PostgREST가
// posts/comments ↔ profiles 관계를 모호하다고 보고 임베드를 거부한다.
const AUTHOR = "author:profiles!user_id(nickname, activity_score, role)";
const LIST_COLS = `id, category_id, title, tags, images, view_count, like_count, comment_count, pinned, created_at, ${AUTHOR}`;
const POST_COLS = `id, user_id, category_id, title, body, tags, images, view_count, like_count, comment_count, pinned, is_hidden, created_at, updated_at, ${AUTHOR}`;

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, admin_only, position")
    .order("position");
  return (data as Category[]) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, admin_only, position")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category | null) ?? null;
}

type ListOpts = {
  categoryId?: number;
  sort?: "latest" | "popular";
  search?: string;
  tag?: string;
  limit?: number;
};

export async function listPosts(opts: ListOpts = {}): Promise<PostListItem[]> {
  const { categoryId, sort = "latest", search, tag, limit = 30 } = opts;
  const supabase = await createClient();
  // 숨김글(신고 누적·운영자 숨김)은 목록에 노출하지 않는다. 운영진/작성자라도
  // RLS상 보일 뿐, 목록에는 띄우지 않고 상세 직링크/검토큐로만 접근.
  let q = supabase.from("posts").select(LIST_COLS).eq("is_hidden", false).limit(limit);

  if (categoryId) q = q.eq("category_id", categoryId);
  if (tag?.trim()) q = q.contains("tags", [tag.trim()]); // tags text[] GIN 인덱스 활용
  if (search?.trim()) {
    const term = search.trim().replace(/[%,]/g, " ");
    q = q.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  }

  // 공지(pinned) 먼저, 그다음 정렬 기준.
  q = q.order("pinned", { ascending: false });
  if (sort === "popular") {
    q = q.order("like_count", { ascending: false }).order("comment_count", {
      ascending: false,
    });
  }
  q = q.order("created_at", { ascending: false });

  const { data } = await q;
  // forward FK 임베드라 author는 런타임상 단일 객체지만 supabase-js는 배열로 추론.
  return (data as unknown as PostListItem[]) ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_COLS)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Post | null) ?? null;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(
      `id, post_id, user_id, parent_id, body, is_hidden, like_count, created_at, ${AUTHOR}`,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data as unknown as Comment[]) ?? [];
}

// 현재 유저가 이 글의 댓글 중 좋아요한 comment_id 집합.
export async function getLikedCommentIds(
  postId: string,
  userId: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  // comment_likes엔 post_id가 없으므로 이 글의 댓글 id로 한정해 조회.
  const { data: ids } = await supabase
    .from("comments")
    .select("id")
    .eq("post_id", postId);
  const commentIds = (ids ?? []).map((c) => c.id as string);
  if (commentIds.length === 0) return new Set();

  const { data } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", userId)
    .in("comment_id", commentIds);
  return new Set((data ?? []).map((r) => r.comment_id as string));
}

// 인기글(Best) — 최근 7일 내 글 중 (좋아요*2 + 댓글) 가중점수 상위.
// 저볼륨 기준 후보를 넉넉히 가져와 JS에서 가중 정렬(별도 RPC 불필요).
export async function getBestPosts(limit = 5): Promise<PostListItem[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("posts")
    .select(LIST_COLS)
    .eq("is_hidden", false)
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .limit(50);
  const items = (data as unknown as PostListItem[]) ?? [];
  return items
    .map((p) => ({ p, score: p.like_count * 2 + p.comment_count }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

// 관리자 검토큐 — 미처리(open) 신고를 대상별로 묶고 글/댓글 미리보기를 붙인다.
// (reports select는 RLS상 운영진만 가능 → 호출 전에 requireStaff 가드 필요.)
export async function getModerationQueue(): Promise<ModerationItem[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("target_type, target_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const rows = (reports ?? []) as {
    target_type: "post" | "comment";
    target_id: string;
    reason: ReportReason;
  }[];
  if (rows.length === 0) return [];

  // 대상별 집계(신고 수 = 행 수, 사유 중복제거).
  const groups = new Map<
    string,
    { type: "post" | "comment"; id: string; count: number; reasons: Set<ReportReason> }
  >();
  for (const r of rows) {
    const key = `${r.target_type}:${r.target_id}`;
    const g = groups.get(key) ?? {
      type: r.target_type,
      id: r.target_id,
      count: 0,
      reasons: new Set<ReportReason>(),
    };
    g.count += 1;
    g.reasons.add(r.reason);
    groups.set(key, g);
  }

  const postIds = [...groups.values()].filter((g) => g.type === "post").map((g) => g.id);
  const commentIds = [...groups.values()]
    .filter((g) => g.type === "comment")
    .map((g) => g.id);

  const [postsRes, commentsRes] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id, title, is_hidden").in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; title: string; is_hidden: boolean }[] }),
    commentIds.length
      ? supabase
          .from("comments")
          .select("id, body, is_hidden, post_id")
          .in("id", commentIds)
      : Promise.resolve({
          data: [] as { id: string; body: string; is_hidden: boolean; post_id: string }[],
        }),
  ]);

  const postMap = new Map((postsRes.data ?? []).map((p) => [p.id, p]));
  const commentMap = new Map((commentsRes.data ?? []).map((c) => [c.id, c]));

  return [...groups.values()].map((g) => {
    if (g.type === "post") {
      const p = postMap.get(g.id);
      return {
        target_type: "post" as const,
        target_id: g.id,
        report_count: g.count,
        reasons: [...g.reasons],
        is_hidden: p?.is_hidden ?? false,
        preview: p?.title ?? "(삭제된 글)",
        post_id: g.id,
        missing: !p,
      };
    }
    const c = commentMap.get(g.id);
    return {
      target_type: "comment" as const,
      target_id: g.id,
      report_count: g.count,
      reasons: [...g.reasons],
      is_hidden: c?.is_hidden ?? false,
      preview: c ? c.body.slice(0, 80) : "(삭제된 댓글)",
      post_id: c?.post_id ?? "",
      missing: !c,
    };
  });
}

// 역할 관리용 유저 목록: 현재 운영진 + 활동 상위 후보.
export async function getStaffAndCandidates(): Promise<{
  staff: AdminProfile[];
  candidates: AdminProfile[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, role, activity_score")
    .order("activity_score", { ascending: false })
    .limit(100);
  const all = (data as AdminProfile[]) ?? [];
  return {
    staff: all.filter((p) => p.role === "admin" || p.role === "moderator"),
    candidates: all.filter((p) => p.role === "user").slice(0, 30),
  };
}

// ── 마이페이지(내 글 / 내 댓글 / 좋아요한 글) ──

// 내가 쓴 글(숨김 포함 — 본인은 자기 숨김글을 볼 수 있어 상태를 알려준다).
export async function getMyPosts(
  userId: string,
): Promise<(PostListItem & { is_hidden: boolean })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`${LIST_COLS}, is_hidden`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as unknown as (PostListItem & { is_hidden: boolean })[]) ?? [];
}

// 내가 쓴 댓글 — 소속 글 제목을 임베드해 목록·링크에 쓴다.
export async function getMyComments(userId: string): Promise<MyCommentItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, post_id, body, is_hidden, like_count, created_at, post:posts!post_id(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    post_id: string;
    body: string;
    is_hidden: boolean;
    like_count: number;
    created_at: string;
    post: { title: string } | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    post_id: r.post_id,
    body: r.body,
    is_hidden: r.is_hidden,
    like_count: r.like_count,
    created_at: r.created_at,
    post_title: r.post?.title ?? null,
  }));
}

// 내가 좋아요한 글(최근 좋아요순). 숨김 처리된 글은 제외.
export async function getLikedPosts(userId: string): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_likes")
    .select(`created_at, post:posts!post_id(${LIST_COLS}, is_hidden)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as unknown as Array<{
    post: (PostListItem & { is_hidden: boolean }) | null;
  }>;
  return rows
    .map((r) => r.post)
    .filter((p): p is PostListItem & { is_hidden: boolean } => !!p && !p.is_hidden);
}

// 현재 유저가 이 글을 좋아요 했는지.
export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// 현재 유저가 이 글을 북마크 했는지.
export async function isBookmarked(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_bookmarks")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ── 공개 프로필 + 활동 요약 ──

// 닉네임으로 프로필 조회(공개 프로필 페이지용).
export async function getProfileByNickname(
  nickname: string,
): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, role, activity_score")
    .eq("nickname", nickname)
    .maybeSingle();
  return (data as AdminProfile | null) ?? null;
}

// 특정 유저의 공개(비숨김) 글 목록.
export async function getUserPosts(userId: string): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(LIST_COLS)
    .eq("user_id", userId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as unknown as PostListItem[]) ?? [];
}

// 활동 요약(글 수·댓글 수·받은 좋아요 합). 마이페이지·공개 프로필 공용.
export async function getActivitySummary(
  userId: string,
): Promise<ActivitySummary> {
  const supabase = await createClient();
  const [postCount, commentCount, postLikes, commentLikes] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_hidden", false),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_hidden", false),
    supabase.from("posts").select("like_count").eq("user_id", userId).eq("is_hidden", false),
    supabase.from("comments").select("like_count").eq("user_id", userId).eq("is_hidden", false),
  ]);
  const sum = (rows: { like_count: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.like_count ?? 0), 0);
  return {
    posts: postCount.count ?? 0,
    comments: commentCount.count ?? 0,
    receivedLikes: sum(postLikes.data) + sum(commentLikes.data),
  };
}

// 내가 북마크한 글(최근 저장순). 숨김 처리된 글은 제외.
export async function getBookmarkedPosts(userId: string): Promise<PostListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_bookmarks")
    .select(`created_at, post:posts!post_id(${LIST_COLS}, is_hidden)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as unknown as Array<{
    post: (PostListItem & { is_hidden: boolean }) | null;
  }>;
  return rows
    .map((r) => r.post)
    .filter((p): p is PostListItem & { is_hidden: boolean } => !!p && !p.is_hidden);
}
