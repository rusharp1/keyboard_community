// 커뮤니티 도메인 타입 + 활동등급(표시 전용) 계산.

import type { ItemType } from "@/data/items";

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
  item_type: ItemType | null; // 태깅된 도감 항목(있으면)
  item_slug: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  like_count: number;
  created_at: string;
  author: Author | null;
};

// 활동 요약(마이페이지·공개 프로필 공용).
export type ActivitySummary = {
  posts: number;
  comments: number;
  receivedLikes: number;
};

// 마이페이지 "내 댓글" 행 — 소속 글 제목 포함.
export type MyCommentItem = {
  id: string;
  post_id: string;
  body: string;
  is_hidden: boolean;
  like_count: number;
  created_at: string;
  post_title: string | null;
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
  admin: "최고운영진",
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

// 벌점 심각도(운영자 선택). value는 DB penalties.points(1~3)와 일치.
export const PENALTY_SEVERITIES = [
  { value: 1, label: "경미 (+1)" },
  { value: 2, label: "보통 (+2)" },
  { value: 3, label: "중대 (+3)" },
] as const;

// 누적 벌점 → 제재 임계값. DB on_penalty_insert 트리거와 동기화해야 함.
export const PENALTY_THRESHOLDS = {
  warn: 3, // 경고 알림
  suspend7: 5, // 7일 활동정지
  suspend30: 8, // 30일 활동정지
  ban: 10, // 영구 이용정지
} as const;

// ── 도감 리뷰(Phase 9) ──
export type Review = {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_slug: string;
  axis1: number;
  axis2: number;
  axis3: number;
  body: string | null;
  is_hidden: boolean;
  created_at: string;
  author: Author | null;
};

// review_stats 뷰 결과(종합 평균·리뷰수). overall = avg_overall.
export type ReviewStats = {
  n: number;
  avg1: number;
  avg2: number;
  avg3: number;
  overall: number;
};

export type ModerationItem = {
  target_type: "post" | "comment" | "review";
  target_id: string;
  report_count: number;
  reasons: ReportReason[];
  is_hidden: boolean;
  preview: string; // 글 제목 또는 댓글 본문 일부
  post_id: string; // 링크용(글이면 자기 자신, 댓글이면 소속 글)
  missing: boolean; // 대상이 이미 삭제됨
  author_id: string | null; // 대상 작성자(벌점 부과 대상)
  author_nickname: string | null;
  author_penalty_points: number; // 작성자 누적 벌점
  author_penalized: boolean; // 이 콘텐츠로 이미 벌점 부과됨(중복 방지 표시)
};

export type AdminProfile = {
  id: string;
  nickname: string;
  role: Author["role"];
  activity_score: number;
};

// ── 알림(Phase 4) ──
export type NotificationType =
  | "comment"
  | "reply"
  | "like"
  | "notice"
  | "locked" // 신고 누적 자동숨김 통보(시스템, 설정 비대상)
  | "penalty"; // 운영자 벌점 부과 통보(시스템, 설정 비대상)

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actor_nickname: string | null;
  post_id: string | null;
  comment_id: string | null;
  post_title: string | null;
  is_read: boolean;
  created_at: string;
};

// 이벤트×채널 토글. 컬럼명은 DB notification_prefs와 1:1 일치.
export type NotificationPrefs = {
  comment_bell: boolean;
  comment_email: boolean;
  reply_bell: boolean;
  reply_email: boolean;
  like_bell: boolean;
  like_email: boolean;
  notice_bell: boolean;
  notice_email: boolean;
};

// DB 기본값과 일치(행이 없을 때 사용). 좋아요 알림만 기본 OFF.
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  comment_bell: true,
  comment_email: false,
  reply_bell: true,
  reply_email: false,
  like_bell: false,
  like_email: false,
  notice_bell: true,
  notice_email: false,
};

// 설정 매트릭스 행(이벤트). key는 DB type 및 prefs 컬럼 접두사와 일치.
export const NOTIFICATION_EVENTS = [
  { key: "comment", label: "내 글에 달린 댓글" },
  { key: "reply", label: "내 댓글에 달린 답글" },
  { key: "like", label: "내 글이 받은 좋아요" },
  { key: "notice", label: "새 공지 등록" },
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]["key"];
