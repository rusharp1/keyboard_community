# 스펙: 이메일+비밀번호 로그인 (Supabase Auth) — 1단계 (구현 완료)

키보드 커뮤니티의 인증 1단계. 커뮤니티(글쓰기는 로그인 사용자만)의 토대.
네이버 연동(2단계)과 게시판(3단계)은 이 위에 얹는다.

## 확정 결정
- **Supabase Auth 통합** (로그인·세션·DB 일원화, 권한은 RLS의 `auth.uid()`로 DB 레벨 강제)
- **이메일 + 비밀번호** 가입/로그인 (네이버는 2단계)
- **가입 시 이메일 확인 메일 필수**
- **가입 시 닉네임 입력** → `profiles` 테이블, 닉네임 unique(대소문자 무시). 커뮤니티 작성자 표시명
- **같은 이메일은 한 계정** (profiles를 `auth.users.id`로만 참조 → provider 무관)
- **비밀번호 재설정 포함**

## Next 16 주의 (구현에 반영됨)
- `middleware.ts` deprecated → **`src/proxy.ts`** (`proxy` 함수 + `config.matcher`). 세션 갱신만 담당.
- `cookies()`는 **async** → 서버 클라이언트에서 `await cookies()`.
- 인가는 proxy가 아니라 **RLS + Server Action 내부 `getUser()`** 로 강제.

## 구현 파일
| 파일 | 역할 |
|---|---|
| `src/lib/supabase/env.ts` | 환경변수 검증. `getSupabaseEnv()`(graceful null) / `requireSupabaseEnv()`(throw) |
| `src/lib/supabase/client.ts` | 브라우저 클라이언트(`createBrowserClient`) |
| `src/lib/supabase/server.ts` | 서버 클라이언트(`await cookies()` + getAll/setAll) |
| `src/proxy.ts` | 세션 쿠키 갱신. env 없으면 `NextResponse.next()`로 무동작 |
| `src/app/(auth)/actions.ts` | Server Actions: `signUp`/`signIn`/`signOut`/`resendConfirmation`/`requestPasswordReset`/`updatePassword`. Zod 검증, `FormState` |
| `src/app/auth/callback/route.ts` | 이메일 확인·재설정 콜백(PKCE code / OTP token_hash) → 세션 수립 |
| `src/app/auth/reset/page.tsx` + `src/components/auth/ResetPasswordForm.tsx` | 새 비밀번호 설정 |
| `src/app/login/page.tsx` + `src/components/auth/AuthForm.tsx` | 로그인/회원가입/비번찾기 탭 UI |
| `src/components/auth/HeaderAuth.tsx` | Header 로그인 상태(닉네임/로그아웃). env 없으면 로그인 링크로 graceful |
| `docs/sql/profiles.sql` | profiles 테이블·RLS·`handle_new_user` 트리거 (Supabase에서 실행) |

## 사용자가 직접 해야 하는 단계 (코드 외)
1. **Supabase 프로젝트 생성**.
2. **환경변수**: `.env.local.example`를 `.env.local`로 복사 후 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 채우기. **Vercel 환경변수에도 동일 등록**(없으면 프로덕션에서 비로그인으로만 동작).
3. **SQL 실행**: `docs/sql/profiles.sql`을 Supabase SQL Editor에 붙여 실행.
4. **Auth 설정**: Email provider ON, **Confirm email ON**, Redirect URLs에
   `http://localhost:3000/auth/callback`,
   `http://localhost:3000/auth/callback?next=/auth/reset`,
   `https://keyboard-community.vercel.app/auth/callback`,
   `https://keyboard-community.vercel.app/auth/callback?next=/auth/reset` 등록.

## 검증 (env·SQL 설정 후 end-to-end)
1. `/login` → 이메일+비번+닉네임 가입 → "확인 메일 발송" 안내.
2. 메일 링크 클릭 → `/auth/callback` → `/community`, Header에 닉네임 표시.
3. 로그아웃 → Header "로그인" 복귀.
4. 같은 닉네임 재가입 → "이미 사용 중" 에러.
5. 미확인 계정 로그인 → "확인 메일 다시 보내기" 노출.
6. "비밀번호를 잊으셨나요?" → 메일 → `/auth/reset` → 새 비번 → `/community`.
7. Supabase `profiles`에 닉네임 행 생성 확인.

검증 완료(코드): `npm run build`(Turbopack) 통과, `npm run lint` 클린, dev에서 `/login`·`/` 200 렌더(env 없는 graceful 경로).

## 다음 단계
- **2단계 네이버**: 커스텀 OAuth. 콜백/profiles 구조 재사용. Supabase "Link accounts with same email" 검토.
- **3단계 커뮤니티**: `posts`(+`comments`,`likes`) 테이블 + RLS(`select using(true)` / 본인만 insert·update·delete). `docs/sql/profiles.sql` 하단에 posts RLS 패턴 주석으로 둠. UI·CRUD는 별도 인터뷰로 스펙 확정.
