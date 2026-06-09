import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, Comment, Post, PostListItem } from "./types";

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
  limit?: number;
};

export async function listPosts(opts: ListOpts = {}): Promise<PostListItem[]> {
  const { categoryId, sort = "latest", search, limit = 30 } = opts;
  const supabase = await createClient();
  let q = supabase.from("posts").select(LIST_COLS).limit(limit);

  if (categoryId) q = q.eq("category_id", categoryId);
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
    .select(`id, post_id, user_id, parent_id, body, is_hidden, created_at, ${AUTHOR}`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data as unknown as Comment[]) ?? [];
}

// 인기글(Best) — 최근 7일 내 글 중 (좋아요*2 + 댓글) 가중점수 상위.
// 저볼륨 기준 후보를 넉넉히 가져와 JS에서 가중 정렬(별도 RPC 불필요).
export async function getBestPosts(limit = 5): Promise<PostListItem[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("posts")
    .select(LIST_COLS)
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
