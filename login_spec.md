# 로그인 / 회원가입 스펙 (1단계 — 구현 완료)

키보드 커뮤니티의 인증 1단계. **이메일 + 비밀번호** 기반. Supabase Auth 통합 방식.
(네이버 연동은 2단계, 게시판은 3단계 — 이 문서 범위 밖)

---

## 1. 개요 / 설계 결정

| 항목 | 결정 |
|---|---|
| 인증 스택 | **Supabase Auth 통합** (로그인·세션·DB 일원화, 권한은 RLS의 `auth.uid()`로 DB 레벨 강제) |
| 가입 수단 | 이메일 + 비밀번호 |
| 이메일 확인 | **필수** (Supabase "Confirm email" ON) |
| 닉네임 | 가입 시 입력, `profiles` 테이블 저장, **중복 불가**(대소문자 무시) |
| 계정 통합 | 같은 이메일 = 한 계정 (`profiles`를 `auth.users.id`로만 참조, provider 비결합 → 네이버 추가 대비) |
| 비밀번호 재설정 | 포함 |
| 커뮤니티 권한 | 읽기 공개 / 쓰기는 로그인만 (RLS, posts는 3단계) |

### Next 16 주의 (구현에 반영됨)
- `middleware.ts` deprecated → **`src/proxy.ts`**(`proxy` 함수 + `config.matcher`). 세션 갱신만 담당.
- `cookies()`는 **async** → 서버 클라이언트에서 `await cookies()`.
- 인가는 proxy가 아니라 **RLS + Server Action 내부 `getUser()`** 로 강제(proxy는 쿠키 optimistic check만).

---

## 2. 기능별 동작 명세

### 2.1 회원가입 (signUp)
입력: **이메일 · 닉네임 · 비밀번호**

검증 규칙 (Zod, 서버):
- 이메일: 이메일 형식
- 비밀번호: **8자 이상**
- 닉네임: **2~20자**, `^[a-zA-Z0-9가-힣_]+$` (한글·영문·숫자·밑줄)

처리 순서:
1. 닉네임 **사전 중복 체크** (`profiles`에 동일 닉네임 조회) → 있으면 "이미 사용 중인 닉네임입니다."
2. `supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo } })`
3. **중복 이메일 차단**: 응답 `data.user.identities`가 빈 배열이면 이미 가입된 이메일 → "이미 가입된 이메일입니다. 로그인하거나 '비밀번호를 잊으셨나요?'를 이용하세요."
   - (Supabase 이메일 열거 방지가 기존 이메일에 error 없이 빈 identities로 응답하는 신호 활용)
4. 성공 → "확인 메일을 보냈습니다." 안내 (세션은 아직 안 생김)

닉네임 저장: `auth.users` insert 시 **DB 트리거**(`handle_new_user`)가 `raw_user_meta_data.nickname`을 읽어 `profiles` 행 자동 생성. 닉네임 unique 위반 시 트리거 실패 → 가입 롤백 → "이미 사용 중인 닉네임".

### 2.2 이메일 확인 (콜백)
- 메일의 링크 → `/auth/callback`
- PKCE(`code`) → `exchangeCodeForSession`, 또는 OTP(`token_hash`+`type`) → `verifyOtp`
- 세션 수립 후 `next`(기본 `/community`)로 리다이렉트. 실패 시 `/login?error=auth`.

### 2.3 로그인 (signIn)
- `supabase.auth.signInWithPassword({ email, password })`
- 성공 → `/community` 리다이렉트
- 실패:
  - "Email not confirmed" → "이메일 확인이 필요합니다." + **확인 메일 재발송** 버튼(`resend({ type: 'signup' })`)
  - 그 외 → "이메일 또는 비밀번호가 올바르지 않습니다." (열거 방지 위해 사유 뭉뚱그림)
- **이미 로그인한 사용자가 `/login` 접근 → 홈(`/`)으로 리다이렉트** (다른 탭 인증 후 새로고침 문제 해결)

### 2.4 비밀번호 재설정
1. "비밀번호를 잊으셨나요?" → 이메일 입력 → `resetPasswordForEmail(email, { redirectTo: /auth/callback?next=/auth/reset })`
2. 메일 링크 → 콜백에서 세션 수립 → `/auth/reset`
3. 새 비밀번호 입력(8자+) → `updateUser({ password })` → `/community`

### 2.5 로그아웃
- `supabase.auth.signOut()` → `/` 리다이렉트. Header의 `<form action={signOut}>` 버튼.

### 2.6 로그인 상태 표시 (Header)
- 서버에서 `getUser()` 확인 → 로그인 시 **닉네임 + 로그아웃 버튼**, 비로그인 시 "로그인" 링크.
- 환경변수 없으면 throw 대신 "로그인" 링크로 graceful degrade.

---

## 3. 데이터 모델

`public.profiles`
| 컬럼 | 설명 |
|---|---|
| `id uuid PK` | `auth.users(id)` 참조, `on delete cascade` |
| `nickname text` | not null, **`lower(nickname)` unique index** |
| `created_at`, `updated_at` | timestamptz |

RLS: select `using(true)`(공개) · update `using(auth.uid()=id)`(본인만) · insert는 트리거로.
비밀번호는 `auth.users`에 해시로 저장(앱·profiles에 평문 없음).

---

## 4. 엣지 케이스

- **닉네임 동시성**: 사전 체크 + `lower(nickname)` unique index(최종 방어).
- **확인 메일 미클릭**: 로그인 시 감지 → 재발송 버튼 제공.
- **중복(확인된) 이메일 가입**: 차단 + 안내 (열거 방지 약간 완화 트레이드오프 수용).
- **미확인 이메일 재가입**: 확인 메일 재발송(정상 흐름 유지).
- **환경변수 누락**: 도감은 인증 무관하게 동작, 인증 경로만 graceful 폴백.
- **세션 갱신**: `proxy.ts`(Next 16 — `middleware.ts` 아님)가 쿠키 갱신. 인가는 RLS + Server Action `getUser()`.

---

## 5. 파일 맵

| 파일 | 역할 |
|---|---|
| `src/lib/supabase/{env,client,server}.ts` | Supabase 클라이언트 3종 + env 검증 |
| `src/proxy.ts` | 세션 쿠키 갱신 (Next 16 proxy 규약) |
| `src/app/(auth)/actions.ts` | Server Actions: signUp/signIn/signOut/resend/requestPasswordReset/updatePassword |
| `src/app/auth/callback/route.ts` | 이메일 확인·재설정 콜백 |
| `src/app/auth/reset/page.tsx` + `src/components/auth/ResetPasswordForm.tsx` | 새 비밀번호 설정 |
| `src/app/login/page.tsx` + `src/components/auth/AuthForm.tsx` | 로그인/회원가입/비번찾기 UI |
| `src/components/auth/HeaderAuth.tsx` | Header 로그인 상태 |
| `docs/sql/profiles.sql` | profiles 테이블·RLS·트리거 (Supabase에서 실행) |

---

## 6. 사용자 설정 (코드 외)
- Supabase 프로젝트 + `.env.local`/Vercel env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `docs/sql/profiles.sql` 실행
- Auth: Email provider ON, **Confirm email ON**, Redirect URLs(`/auth/callback**`) 등록

배포: GitHub `main` → Vercel 자동 배포 완료(PR #1~#3).
