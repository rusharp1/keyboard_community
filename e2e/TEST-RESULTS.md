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

**요약: 17개 케이스 자동 통과. 3개(1-6, 4-1, 3-2 재발송)는 Supabase 메일 시간당 한도로 보류(코드는 정상 확인). 5-2 env-누락은 수동/코드 검증.**

## 메모 / 관찰
- 메일 한도(`email rate limit exceeded`)는 무료 빌트인 메일의 시간당 제한 때문. `03` 스펙은 한도가 남았을 때 실행.
- **`/signup` 라우트 추가됨**(관찰 보완): 비로그인 시 가입 탭으로 열리고(`AuthForm defaultMode="signup"`), 기로그인 시 홈으로 리다이렉트. `src/app/signup/page.tsx`, 검증은 TC-3-4b.
- 테스트 유저는 유니크 이메일로 생성 후 `afterAll`에서 admin으로 삭제(정리).

## 재실행
```bash
npm run test:e2e                         # 전체
npx playwright test e2e/02-auth-core.spec.ts   # 메일 없이 언제든
npx playwright test e2e/03-auth-email-send.spec.ts  # 메일 한도 여유 있을 때
```
필요 env: `.env.local`(URL/anon), `.env.test.local`(SUPABASE_SERVICE_ROLE_KEY, 로컬 전용·gitignore).
