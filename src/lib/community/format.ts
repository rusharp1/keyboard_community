// 클라이언트·서버 공용 포맷 유틸(서버 전용 아님).

import type { NotificationType } from "./types";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000; // 초
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 알림 문구. 좋아요/댓글/답글은 행위자 닉네임, 공지는 행위자 무관.
export function notificationText(
  type: NotificationType,
  actorNickname: string | null,
  isComment = false, // 'like'가 댓글 좋아요면 true(글/댓글 문구 구분)
): string {
  const who = actorNickname ?? "누군가";
  switch (type) {
    case "comment":
      return `${who}님이 회원님의 글에 댓글을 남겼어요`;
    case "reply":
      return `${who}님이 회원님의 댓글에 답글을 남겼어요`;
    case "like":
      return isComment
        ? `${who}님이 회원님의 댓글을 좋아합니다`
        : `${who}님이 회원님의 글을 좋아합니다`;
    case "notice":
      return "새 공지가 등록되었어요";
    case "locked":
      return "신고가 누적되어 회원님의 게시물이 숨김 처리되었어요";
  }
}
