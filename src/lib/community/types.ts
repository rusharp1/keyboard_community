// 커뮤니티 도메인 타입 + 활동등급(표시 전용) 계산.

export type Category = {
  id: number;
  slug: string;
  name: string;
  admin_only: boolean;
  position: number;
};

export type Author = {
  nickname: string;
  activity_score: number;
  role: "user" | "moderator" | "admin";
};

export type PostListItem = {
  id: string;
  category_id: number;
  title: string;
  tags: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  pinned: boolean;
  created_at: string;
  author: Author | null;
};

export type Post = PostListItem & {
  user_id: string;
  body: string;
  is_hidden: boolean;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  created_at: string;
  author: Author | null;
};

// 활동등급 — activity_score 임계값 기반(표시 전용, 권한과 무관).
// 임계값은 2차에서 운영 데이터 보고 조정 가능.
export const LEVELS = [
  { name: "고수", min: 150, emoji: "🏆" },
  { name: "열심", min: 50, emoji: "🔥" },
  { name: "일반", min: 10, emoji: "🌿" },
  { name: "새싹", min: 0, emoji: "🌱" },
] as const;

export type Level = (typeof LEVELS)[number];

export function levelFor(score: number): Level {
  return LEVELS.find((l) => score >= l.min) ?? LEVELS[LEVELS.length - 1];
}

export const ROLE_LABEL: Record<Author["role"], string | null> = {
  admin: "운영자",
  moderator: "운영진",
  user: null,
};
