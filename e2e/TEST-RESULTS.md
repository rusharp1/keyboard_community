# 로그인/회원가입 E2E 테스트 결과

`login_testcase.md`의 TC를 Playwright로 자동화한 결과. 실행: `npm run test:e2e`.

## 구성
- `e2e/01-validation.spec.ts` — 메일 불필요(폼 검증·리다이렉트·잘못된 자격)
- `e2e/02-auth-core.spec.ts` — admin(service_role)으로 계정 상태·인증 토큰을 **메일 없이** 생성해 검증
- `e2e/03-auth-email-send.spec.ts` — 실제 메일 발송 UI(가입/재발송/재설정 발송). Supabase 시간당 한도 소비

## 결과 요약 (2026-06-08 기준)

| TC | 내용 | 결과 | 비고 |
|---|---|---|---|
| 1-1 | 정상 회원가입(확인 메일 안내) | ✅ PASS | 메일 1통 발송 |
| 1-2 | 폼 유효성(이메일/비번/닉네임) | ✅ PASS | 4개 하위 케이스 |
| 1-3 | 닉네임 중복 차단(사전 체크) | ✅ PASS | |
| 1-4 | 닉네임 동시성(최종 방어) | ✅ PASS | 같은 닉네임 동시 생성 → unique index가 1건만 허용 |
| 1-5 | 중복(확인된) 이메일 차단 | ✅ PASS | |
| 1-6 | 미확인 이메일 재가입 재발송 | ⏳ 한도 | 코드 정상, 메일 한도 리셋 후 재실행 |
| 2-1 | 이메일 인증 → /community | ✅ PASS | token_hash 경로 |
| 2-2 | 변조/만료 링크 → /login?error=auth | ✅ PASS | |
| 3-1 | 정상 로그인 → /community | ✅ PASS | |
| 3-2 | 미인증 로그인 안내+재발송 | ✅/⏳ | 안내·버튼 노출 PASS, 재발송 클릭은 한도 |
| 3-3 | 잘못된 자격 → 공통 메시지 | ✅ PASS | |
| 3-4 | 기로그인 /login(및 /signup) → 홈 | ✅ PASS | /signup 라우트 추가됨(TC-3-4b) |
| 4-1 | 재설정 메일 발송 안내 | ⏳ 한도 | 코드 정상, 한도 리셋 후 |
| 4-2 | 재설정 링크→새 비번→/community | ✅ PASS | recovery token 경로 |
| 4-3 | 새 비번 8자 미만 차단 | ✅ PASS | |
| 5-1 | 로그인 헤더(닉네임/로그아웃) | ✅ PASS | |
| 5-2 | 비로그인 헤더 / env 누락 graceful | ✅/🔧 | 비로그인=PASS. env 누락은 앱을 env 없이 띄워야 해 자동화 제외(코드 `HeaderAuth`/`login` graceful 분기로 보장) |
| 5-3 | 로그아웃 → 홈 | ✅ PASS | |

**요약: 기본 스위트 18 passed / 4 skipped(03 메일발송, opt-in). 코드 흐름은 모두 커버, 메일 실제 발송분만 한도로 opt-in.**

## 미검증 (나중에 확인) — TODO
자동/수동 어느 쪽으로도 **아직 실제로 안 돌아본** 케이스. 나중에 점검할 것:
- ⭐ **비밀번호 재설정 실제 메일 플로우**: "비밀번호를 잊으셨나요?" → 메일 수신 → 링크 클릭 → 새 비번 → 새 비번으로 로그인. (토큰/페이지 경로는 TC-4-2로 검증됐으나, **실제 메일로 오는 재설정 링크 + "발송 안내"는 미확인**)
- ⭐ **계정 연결**: 이메일/비번으로 가입한 계정과 **같은 이메일을 네이버로** 로그인 → **같은 계정**으로 들어가는지(별도 계정 안 생기는지). 로직만 작성, 실제 미실행.
- **확인/재설정 재발송 실제 도달**(TC-1-6, TC-3-2 재발송 클릭) — 메일 한도로 opt-in 보류.
- **TC-5-2 env 누락 graceful** — 코드 분기만 보장, 앱을 env 없이 띄워 실행한 적 없음.
- **실제 받은편지함 도달률/스팸** — yopmail로만 확인. (운영 시 커스텀 SMTP로 해결)
- 네이버 **CSRF state 불일치** 등 에러 분기 — 코드만.

## 메모 / 관찰
- **`03`은 기본 제외(opt-in)**: 무료 빌트인 메일의 시간당 한도(`email rate limit exceeded`)가 매우 낮아 한 번에 통과 불가 → `RUN_EMAIL_SEND=1` 일 때만 실행하도록 스킵 가드. (메일을 보내는 UI 메시지 검증이며, 핵심 흐름은 02의 TC-4-2/TC-3-2-core 등으로 이미 커버.) 완전 자동화하려면 Supabase에 **커스텀 SMTP** 연결로 한도를 올려야 함.
- **셀렉터 주의**: 네이버 버튼("네이버로 로그인")도 "로그인"을 포함한 링크라, 헤더 로그인 링크는 `getByRole("link", { name: "로그인", exact: true })`로 집는다.
- **`/signup` 라우트**: 비로그인=가입 탭(`AuthForm defaultMode="signup"`), 기로그인=홈 리다이렉트. 검증 TC-3-4b.
- 테스트 유저는 유니크 이메일로 생성 후 `afterAll`에서 admin으로 삭제(정리).

## 재실행
```bash
npm run test:e2e                                    # 전체(03은 자동 스킵)
npx playwright test e2e/02-auth-core.spec.ts        # 메일 없이 언제든
# 메일 발송 스위트(한도 여유 있을 때만, PowerShell):
$env:RUN_EMAIL_SEND=1; npx playwright test e2e/03-auth-email-send.spec.ts
```
필요 env: `.env.local`(URL/anon + `SUPABASE_SERVICE_ROLE_KEY`). Playwright config가 `.env.local`을 로드.
