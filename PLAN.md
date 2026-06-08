# 키보드 커뮤니티 사이트 — 계획/진행

기계식 키보드 **축·키캡 도감 + 타건음 링크** 사이트. 최종 목표는 로그인·게시판이 있는 커뮤니티.
스택: Next.js 16 (App Router, TS) + Tailwind v4 + Vercel. (커뮤니티 단계에서 Supabase 예정)

작업 디렉토리: `C:\Users\owner\Documents\AI\keyboard-community` (모든 작업은 이 경로 안에서 진행)

---

## 현재 상태

- **배포**: https://keyboard-community.vercel.app/ — GitHub `rusharp1/keyboard_community`(Public), `main` push마다 Vercel 자동 재배포. 로컬 dev 서버는 검증용으로 켜둠.
- **로컬 dev는 `next dev --webpack`** (package.json). Turbopack dev 워커가 키캡 동적 라우트 렌더 중 크래시("Jest worker ... child process exceptions")해서 webpack으로 회피. `next build`(프로덕션)는 Turbopack 정상.
- **축 도감 `/switches`** — 약 118종(큐레이션·스토어 ~105 + AULA 독거미 번들축 13종: 세이야·경해·회목V4·황축V3·저소음 바다/솜사탕/피치V2/로즈 + HE 자석축 블랙킹/드래곤킹/제이드킹/실버/스피릿퍼플).
- **키캡 도감 `/keycaps`** — 38종(JTK 1 + AKKO 37). 제조사 식별 세트만 수록. 카드/상세에 프로파일·재질·대표 색감 표시, **제조사·프로파일·재질 드롭다운 필터**(`SearchableSelect`, 검색 가능), 상세에 공식 구매처(buyUrl) 링크.
- **키보드 도감 `/keyboards`** — 15종(AULA 독거미 11 + Swagkeys/Shortcut 4). **모델=항목 1개**, 색상·연결은 배열(변형), 번들 축은 축 도감과 slug 크로스링크(상세에서 `/switches/[slug]` 링크). 종류 필드(기계식/자석축(HE)/멤브레인), 색상 hex 스와치, LCD·핫스왑 배지. 필터: 브랜드·배열·연결·종류·세부 축·색상계열·재질 드롭다운 + 핫스왑 토글. 가격은 "약 ~원부터" 대략가.
- **공용 UI 패턴**: 검색 가능한 드롭다운은 `src/components/SearchableSelect.tsx` 재사용(축·키캡 공통). 카드(`SwitchCard`/`KeycapCard`)는 배지/칩을 헤더 아래 가로 줄(`flex flex-wrap`)로 두어 같은 행 카드 높이를 균일하게 유지.
- **인증 완료·배포**: 이메일+비밀번호(1단계) + 네이버 로그인(2단계). `/login`·`/signup`·`/onboarding` 동작. `/community`는 아직 stub(3단계에서 게시판).

---

## 알아둘 결정 (코드만 봐선 모르는 것)

- **데이터 출처**:
  - 축 — `docs/sources/switches-naver-list.txt`(geonlab 판매 목록) → `src/data/switches.ts`. 네이버 스토어는 봇 차단이라 사용자가 직접 붙여넣어 줌.
  - 키보드 — `src/data/keyboards.ts`. AULA 독거미는 펀키스 정본 목록(`Desktop/독거미키보드종류.txt`) 기준, 색상·축·연결 변형을 모델 단위로 취합. 번들 축은 `switches.ts`에 정식 추가 후 `availableSwitchSlugs`로 크로스링크. Swagkeys 등은 swagkey.kr·제조사 페이지 기반. 리비전·판매처에 따라 스펙/가격 변동 → 불확실 항목 `needsInfo`, 가격은 대략가.
  - 키캡 — **제조사 식별 세트만 수록**. AKKO 37종은 akkogear.kr(Shopify)에서 가져옴: 대표 색 팔레트는 실제 제품 이미지로 실측, 프로파일/재질은 제품 `tags`(예: "MOG Profile", "PBT Double-Shot"), 구매링크는 `<제품URL>` → `buyUrl`. 제품 데이터는 `https://akkogear.kr/products/<handle>.json` 으로 조회 가능. 기존 추정 키캡 목록(`docs/sources/keycaps-list.txt`)은 제조사 불명이라 도감에서 제외.
- **저소음/자석축은 방식과 별개 속성**(`silent`/`magnetic`) — "리니어+저소음", "리니어+자석축"처럼 동시 표현. 토글 필터로 분리.
- **데이터 정확도**: 축은 잘 알려진 것만 스펙/색 채움, 니치 항목은 `needsInfo`로 표기(추정·공란). AKKO 키캡은 공식 자료로 검증 완료라 `needsInfo` 없음. (AKKO 컬렉션엔 도자기/PC 재질 제품 없음 — 전부 PBT, 8주년 아티산만 티타늄 합금.) 사용자 제공 시 갱신.
- **브랜드 그룹핑**: 랩터/RAW 계열 → `Geon`, 제조사 불명확 → `기타`. (요청 시 조정)
- **인스타그램**: 공개 해시태그 API 폐지 → 임베드 불가. `explore/tags/{태그}` 외부 링크로만 연결.
- **기본값**: UI 한국어(축 이름 영문 병기), 미니멀 다크. 로그인은 이메일+구글 예정(카카오 이후).

---

## 남은 일

**데이터 보강**: 스토어 니치 축의 빈 스펙(압력/키감/색) 채우기. 유튜브 타건음 영상 ID(`youtubeVideoIds`)는 현재 전부 비어 검색 링크 폴백 상태 → 검증된 영상 채우면 임베드.

**인증 1단계 — 이메일+비밀번호 (✅ 완료·배포)**: Supabase Auth 통합. 스펙은 `login_spec.md`(통합본), DB는 `docs/sql/profiles.sql`.
- 핵심: `src/proxy.ts`(Next 16 — `middleware.ts` 아님), `src/lib/supabase/*`, `src/app/(auth)/actions.ts`, `/login`·`/signup`·`/auth/callback`·`/auth/reset`, Header 로그인상태(`HeaderAuth`).
- 결정: 확인 메일 필수 / 가입 시 닉네임(profiles unique) / 같은 이메일=한 계정 / 비번 재설정 포함 / 로그인 상태로 `/login`·`/signup` 접근 시 홈 리다이렉트 / 중복 이메일 가입 차단.
- env(`.env.local` + Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase: `profiles.sql` 실행, Auth Confirm email ON + Redirect URLs(`/auth/callback**`).

**인증 2단계 — 네이버 (✅ 완료·배포)**: 네이버는 Supabase 기본 미지원·비표준 OIDC라 **방법 B(수동 OAuth 라우트 핸들러 + Supabase Admin)**. 기존 `/auth/callback`(magiclink token_hash) 재사용해 세션 수립.
- 파일: `src/app/api/auth/naver/{start,callback}/route.ts`, `src/lib/auth/naver.ts`, `src/lib/supabase/admin.ts`(server-only), `/onboarding`+`OnboardingForm`, `completeOnboarding` 액션, AuthForm 네이버 버튼.
- 결정: 이메일 필수(네이버 동의에서 미제공 시 차단) / 같은 이메일=기존 계정 연결 / 닉네임은 온보딩 입력(트리거가 nickname null이면 profiles 생성 스킵 + 온보딩 insert 정책).
- env(서버 전용, `.env.local` + Vercel 서버): `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`. 네이버 앱: 이메일 동의 항목 필수, Callback URL(로컬+운영) 등록.

**로그인 E2E (Playwright)**: `e2e/`(`01-validation`/`02-auth-core`/`03-auth-email-send`), 결과 `e2e/TEST-RESULTS.md`, 실행 `npm run test:e2e`.
- `02`는 service_role admin으로 메일 없이 검증(`.env.test.local`은 삭제됨 — service_role은 `.env.local`에서 로드). `03`(메일발송 TC-1-6/4-1/3-2 재발송)은 **Supabase 시간당 메일 한도로 보류** → 한도 리셋 후 재실행.
- 알려진 무해 이슈: 온보딩 폼 하이드레이션 경고는 브라우저 확장(`data-listener-added`) 탓. 정리하려면 input에 `suppressHydrationWarning`.

**커뮤니티 3단계 (다음 작업, 미착수)**: `posts`(+ `comments`, `likes`). RLS는 읽기 공개·쓰기/수정/삭제는 본인만(`auth.uid()=user_id`). posts RLS 패턴은 `docs/sql/profiles.sql` 하단에 주석으로 있음. 게시판 UI·CRUD는 별도 인터뷰로 스펙 확정. (글 작성 가드는 `requireProfile` 패턴으로 profiles 없으면 `/onboarding`.)
