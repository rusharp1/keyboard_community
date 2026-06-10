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
  images: string[];
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

// 신고 사유(글·댓글 공통). value는 DB check 제약과 일치해야 함.
export const REPORT_REASONS = [
  { value: "spam", label: "스팸/광고" },
  { value: "abuse", label: "욕설/비방" },
  { value: "offtopic", label: "주제 이탈" },
  { value: "sexual", label: "음란/불법" },
  { value: "etc", label: "기타" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
export const REASON_LABEL: Record<ReportReason, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ReportReason, string>;

// 자동숨김 임계값(서로 다른 신고자 수). DB 트리거와 일치.
export const REPORT_HIDE_THRESHOLD = 5;

export type ModerationItem = {
  target_type: "post" | "comment";
  target_id: string;
  report_count: number;
  reasons: ReportReason[];
  is_hidden: boolean;
  preview: string; // 글 제목 또는 댓글 본문 일부
  post_id: string; // 링크용(글이면 자기 자신, 댓글이면 소속 글)
  missing: boolean; // 대상이 이미 삭제됨
};

export type AdminProfile = {
  id: string;
  nickname: string;
  role: Author["role"];
  activity_score: number;
};
