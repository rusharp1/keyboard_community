// 글자수 제한 — 서버(zod)와 클라이언트(maxLength/카운터)가 같은 값을 쓰도록 공용.
// 이미지는 별도(Phase 2)라 본문은 텍스트 기준 적정선.
export const TITLE_MAX = 100;
export const BODY_MAX = 10000;
export const COMMENT_MAX = 1000;

// 도배 방지 쿨다운(초) — 같은 유저의 직전 작성 이후 최소 간격. created_at 기반(신규 테이블 불필요).
export const POST_COOLDOWN_SEC = 30;
export const COMMENT_COOLDOWN_SEC = 10;
export const REVIEW_COOLDOWN_SEC = 30;
