// 테스트 데이터 생성기. 재실행 시 계정 충돌을 피하려고 유니크 값을 만든다.
export const PASSWORD = "test123!"; // 8자 — 공통 테스트 비밀번호

function suffix(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// yopmail은 임의 localpart로 공개 받은편지함을 자동 생성한다.
// keyboard_<유니크>@yopmail.com → 매 실행 새 inbox(이전 실행 계정과 격리).
export function newEmail(tag: string): { email: string; inbox: string } {
  const inbox = `keyboard_${tag}_${suffix()}`;
  return { email: `${inbox}@yopmail.com`, inbox };
}

// 닉네임 규칙: 2~20자, [a-zA-Z0-9가-힣_]
export function newNickname(prefix = "tester"): string {
  return `${prefix}_${suffix()}`.slice(0, 20);
}
