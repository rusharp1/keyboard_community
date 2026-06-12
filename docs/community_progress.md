# 커뮤니티 게시판 — 진행상황 (세션 핸드오프)

> 다음 세션이 맥락 없이 이어갈 수 있도록 정리한 문서. 상세 스펙·결정 근거는 플랜 파일
> (`~/.claude/plans/md-peppy-seahorse.md`)에, 전체 사이트 계획은 루트 `PLAN.md`에 있다.
> 최종 갱신: 2026-06-12, Phase 8(벌점제) 반영. **main 머지 + Vercel 배포 완료.**

## 한 줄 요약
키보드 커뮤니티의 **게시판(커뮤니티 3단계)**을 인터뷰 스펙대로 Phase 1~8까지 구현 완료,
**main 머지 + Vercel 자동배포까지 끝남.** `/community`가 실제 게시판으로 라이브 가동 중.

## 현재 단계 (Phase 1~8 완료 · 배포됨)
| Phase | 내용 | 커밋 |
|---|---|---|
| 1 | 스키마·RLS + 글/댓글/대댓글/좋아요 + 목록·상세 | `6cab823` |
| 2 | 이미지 업로드(Storage)·검색(ILIKE)·인기글(Best)·조회수 | `08c3103` |
| 3 | 신고·자동숨김(5명)·관리자 검토큐·moderator 승격 | `1a446e7`, 보정 `49e40b7` |
| 4 | 활동등급 표시·인앱 알림(헤더 종)·알림설정 매트릭스·자동잠금 통보 | `935057d` |
| — | 카테고리 키보드 특화 세분화(10종) + 좌측 SNB(모바일 햄버거) | `bf5fc9c`, `e856515` |
| 5 | 댓글 좋아요(카운터·활동점수·알림) | `14f8aaf` |
| 5 | 본문 마크다운(작성 미리보기·XSS-safe 렌더) | `86bff6f` |
| — | 마이페이지 `/community/me`(내 글·댓글·좋아요) | `fe536d6` |
| 6 | 퀵윈(태그 클릭 필터·관리자 글 고정·이미지 라이트박스) | `1299fba` |
| 6 | 북마크/스크랩(저장 버튼 + 마이페이지 '저장' 탭) | `11bd9bf` |
| 6 | 공개 프로필 `/community/u/[nickname]` + 활동 요약 | `6986c09` |
| 7 | 모바일 UX 정리·알림 Realtime화·운영자 등급 표시 | `263dcd9` |
| 8 | 벌점제(운영자 확인 후 부과 → 누적 경고/정지/영구 + 쓰기 차단 가드) | `24e585a` |

브랜치: **`main`** (= `feat/community-board`, fast-forward 머지). Vercel 자동배포됨.

## 작업 워크플로 (단계마다 동일)
1. **빌드/코드 작성** (dev는 `next dev --webpack` — Turbopack dev 크래시 회피, 빌드는 Turbopack 정상)
2. **사용자가 Supabase 대시보드 SQL Editor에서 `docs/sql/community.sql` 적용** (멱등 — 재실행 안전)
3. **`scripts/*.mjs`로 데이터 계층 검증** (service_role, self-clean)
4. **커밋** — 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## DB / 환경 제약 (중요)
- **이 머신에서 DDL 불가**: `.env.local`엔 키 5개뿐(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) — DB 비번/접속문자열 없음. supabase CLI·psql·pg 드라이버 없음. → **`create table/policy/function` 같은 DDL은 사용자가 SQL Editor에서 직접 실행**해야 함. service_role 클라이언트는 DML(insert/upsert/delete, auth admin)만 가능.
- **첫 admin 지정**: UI 밖에서만. `node scripts/set-role.mjs <email> admin`. 이후 admin이 `/community/admin`에서 moderator 승격.
- **이메일 알림**: SMTP(Resend) 연결 전까지 prefs에 **저장만**, 실제 발송 없음(설정 화면에 안내문 노출).
- **Supabase 프로젝트 1개**: 로컬 dev와 배포(Vercel)가 **같은 프로젝트**를 씀(별도 prod DB 없음). → SQL Editor에서 적용한 DDL이 운영에도 즉시 반영. 이번 Realtime publication도 적용 완료.
- **알림 Realtime**: `notifications`가 `supabase_realtime` publication에 추가됨(멱등 SQL, `community.sql` 하단). 안 되면 대시보드 Database→Replication에서 확인.
- **Phase 8 적용 완료**: `community.sql` 하단 Phase 8(profiles 제재컬럼·`penalties`·트리거·notifications type 확장) SQL Editor 적용됨(verify-phase8 8/8). ⚠️ **`requireProfile`가 제재컬럼을 select**하므로 이 DDL 미적용 시 커뮤니티 쓰기 경로 전체가 깨진다 — 코드와 SQL은 함께 배포해야 함.

## 아키텍처 핵심 (코드만 봐선 모르는 결정)
- **카테고리는 DB-driven** (`categories` 테이블, 현재 10종: 공지·자유·질문·자랑·키보드·키축·키캡·커스텀·후기·정보). 행을 추가/수정하면 **코드 변경 없이** 탭·SNB·작성 폼에 자동 반영. 공지(`notice`)는 `admin_only`.
- **역할 vs 등급 분리**: `profiles.role`(user/moderator/admin = 권한) ↔ `activity_score` 기반 **표시 전용** 활동등급(`levelFor` → 새싹/일반/열심/고수). 점수 가중: 글 +3, 댓글 +1, 받은 좋아요 +2(글·댓글 공통).
- **신고 자동숨김**: 서로 다른 신고자 **5명(중복제거)** → 대상 `is_hidden=true`. **open 신고만 카운트** → 운영자가 복원하면 신고가 `resolved`로 처리돼 카운트 0 리셋(=사면), 다시 숨기려면 새 5명 필요. 숨김 **첫 전환 순간에만** 작성자에게 `locked` 알림(6번째+ 중복 없음).
- **숨김글 노출**: RLS상 작성자·운영진은 볼 수 있으나 **목록(`listPosts`/`getBestPosts`)엔 `is_hidden=false` 필터로 미노출**. 상세 직링크/검토큐로만 접근. 삭제·접근불가 글은 404 대신 이전 페이지로 redirect(`backUrl()`).
- **인앱 알림**: SECURITY DEFINER `notify()` 헬퍼가 수신자=actor면 skip(자기알림 방지) + 이벤트별 `*_bell` 토글 확인 후 insert. `notifications` insert 정책 없음(트리거만). 이벤트×채널 매트릭스(`notification_prefs`, like_bell만 기본 OFF). `locked`는 시스템 통보라 매트릭스 비대상·항상 발송.
- **댓글 좋아요**: 글 좋아요와 동일 패턴(`comment_likes` + `comments.like_count` denorm + 트리거). 알림은 `like` 타입 재사용하되 **comment_id가 채워지면** 포맷터가 "댓글을 좋아합니다"로 구분.
- **본문 마크다운**: `react-markdown` + `remark-gfm`. 원시 HTML 미렌더(rehype-raw 미사용) + URL sanitize 내장 → `dangerouslySetInnerHTML` 없이 **XSS-safe**. 본문은 마크다운 **소스 그대로 저장**(검색 ILIKE 영향 없음). 링크는 새 탭 + `rel="noopener noreferrer nofollow"`.
- **중첩 앵커 주의 (Phase 6)**: `PostRow`는 카드 전체가 `<Link>`라 그 안엔 링크(태그·작성자) 불가 → 태그/프로필 링크는 **상세 페이지·댓글 영역**(앵커 밖)에만. `AuthorBadge`의 `href` 옵션도 같은 이유로 PostRow엔 미적용.
- **북마크(Phase 6)**: `post_bookmarks`(비공개) — **트리거·카운터·활동점수 없음**. 좋아요 토글과 동일 구조의 `toggleBookmark`/`isBookmarked`/`getBookmarkedPosts`.
- **운영자 등급 표시 (Phase 7)**: `AuthorBadge`에서 **role 있으면 역할 칩(운영자/운영진)만, 없으면 활동등급**. → admin/moderator는 새싹/일반 대신 역할이 등급으로 보임. 모든 운영 계정에 자동 적용(목록·상세·댓글·프로필).
- **알림 Realtime (Phase 7)**: `BellMenu`(client)가 본인 `notifications` INSERT 구독 → `router.refresh()`(헤더=루트 레이아웃 재요청). **함정 ①** RLS 걸린 `postgres_changes`는 `realtime.setAuth(토큰)` **후 subscribe**해야 수신(getSession→setAuth→subscribe 순서). **함정 ②** "모두 읽음"을 `<form action>`+낙관적 `unread=0`으로 하면 `{unread>0 && <form>}`가 폼을 언마운트해 **액션 취소** → `startTransition(()=>markAllNotificationsRead())`로 직접 호출. 안전망: 종 열 때·창 focus 시 `router.refresh()`. mark 액션은 `revalidatePath("/","layout")`.
- **벌점제 (Phase 8)**: 자동숨김(콘텐츠)과 분리된 **작성자 누적 제재**. 신고 자동숨김 패턴(`on_report_insert`)을 복제 — 운영자 액션 `penalizeAuthor`는 `penalties`에 INSERT만, **SECURITY DEFINER 트리거 `on_penalty_insert`**가 누적·제재·`'penalty'` 알림 처리. **누적은 `profiles.penalty_points`에 증분 가산(sum 재계산 아님)** → admin `adminSetSanction`이 점수를 0으로 내리는 '해제'가 이후 부과에도 유지됨. 임계값: 3 경고 / 5 → 7일 / 8 → 30일 / 10 → 영구(`is_banned`). 정지기간은 `greatest`로 **에스컬레이트 전용**(단축 안 함). 콘텐츠당 1회(`penalties unique(target_type,target_id)`). **쓰기 차단**은 `requireWriteAccess()`(=requireProfile + `isSanctioned` 체크 → `/community/me` redirect)로, 글/댓글/좋아요/신고 액션에만 적용(삭제·북마크는 허용, 읽기는 requireProfile 유지). ⚠️ **임계값/심각도(+1/+2/+3)는 SQL 트리거와 `types.ts`의 `PENALTY_THRESHOLDS`/`PENALTY_SEVERITIES` 양쪽에 있어 변경 시 동기화 필요.**

## 파일 지도
- **라우트** `src/app/community/*`: `page.tsx`(홈: SNB·목록·Best·검색·태그필터), `[id]/page.tsx`(상세), `[id]/edit/page.tsx`, `new/page.tsx`, `admin/page.tsx`(검토큐·역할), `settings/page.tsx`(알림설정), **`me/page.tsx`**(마이페이지: 글·댓글·좋아요·저장 탭+활동요약), **`u/[nickname]/page.tsx`**(공개 프로필)
- **서버 액션** `src/app/community/actions.ts`: createPost/updatePost/deletePost, addComment/updateComment/deleteComment, toggleLike, toggleCommentLike, **toggleBookmark**, **togglePin**, recordView, reportTarget, moderateHide/moderateDelete, setRole, **penalizeAuthor**(운영진 벌점 부과)/**adminSetSanction**(admin 제재 해제), markNotificationRead/markAllNotificationsRead, updateNotificationPrefs
- **컴포넌트** `src/components/community/*`: PostForm(쓰기/미리보기 탭), PostRow, CommentSection/CommentView/CommentForm/EditableCommentBody, LikeButton/CommentLikeButton/**BookmarkButton**, Markdown, **PostImages**(라이트박스), BellMenu(Realtime 구독), NotificationSettingsForm, CategorySidebar(모바일 좌측 드로어), ImageUploader, SearchBox(X→해제), ReportButton, AuthorBadge(운영자 등급), ReplyToggle, ConfirmSubmitButton, ViewTracker, **PenaltyButton**(검토큐 벌점 부과)/**SanctionBanner**(마이페이지 제재 안내) · 그리고 `src/components/MobileNav.tsx`(상단 모바일 햄버거)
- **lib** `src/lib/community/*`: `queries.ts`(server-only 조회 — getModerationQueue에 작성자 벌점 노출, **getMyPenalties**), `types.ts`(도메인 타입·LEVELS·REPORT_REASONS·알림 타입·**PENALTY_THRESHOLDS/SEVERITIES**), `format.ts`(formatDate·notificationText), `notifications.ts`, `limits.ts`
- **가드** `src/lib/auth/guards.ts`: requireUser/requireProfile/requireStaff/requireAdmin/**requireWriteAccess**(제재 차단)·**isSanctioned**
- **SQL** `docs/sql/community.sql` (Phase별 섹션, 멱등) — 적용 주체는 사용자
- **검증 스크립트** `scripts/`: `check-community-schema.mjs`, `verify-phase2~5.mjs`, **`verify-phase8.mjs`**, `set-role.mjs`, `diag-user.mjs`, `delete-user.mjs`

## 검증 명령 (라이브 Supabase, 모두 self-clean)
```bash
node scripts/check-community-schema.mjs   # 전 스키마 적용 probe
node scripts/verify-phase2.mjs            # 글 CRUD·카운터·임베드·인기글·조회수
node scripts/verify-phase3.mjs            # 신고·자동숨김·검토큐
node scripts/verify-phase4.mjs            # 인앱 알림·자기알림 방지·자동잠금
node scripts/verify-phase5.mjs            # 댓글 좋아요·점수·알림
node scripts/verify-phase8.mjs            # 벌점 누적·제재 에스컬레이션·중복차단·알림
npm run build                             # 컴파일(마크다운 RSC 포함)
```
> 셸 주의: 이 환경의 PowerShell 파이프(`Select-Object`)에서 도구 결과 전달이 깨진 사례가 있어 **Bash 도구**로 실행하는 게 안전.

### 최근 검증 결과 (2026-06-12)
- check-community-schema: **14/14 ✅** (post_bookmarks 포함, 10 카테고리 시드 확인)
- verify-phase2: **8/8 ✅** · phase3: **5/5 ✅** · phase4: **10/10 ✅** · phase5: **7/7 ✅** · **phase8: 8/8 ✅**(벌점 2/3/5→7일/8→30일/10→영구·알림 5건·중복차단·범위 check)
- `npm run build`: **green** (190 페이지, exit 0)
- **Playwright E2E `e2e/04-community.spec.ts`: 9/9 ✅** (태그 1건 webpack 첫 컴파일로 flaky→retry 통과) — 글 작성→상세, 댓글, 좋아요 토글, 마크다운+XSS(브라우저에서 `window.__xss` 미정의·`<script>` DOM 미주입·`javascript:` 링크 0개 확인), 마이페이지 내 글, **북마크 토글→저장 탭, 상세 태그 클릭→필터, 공개 프로필+활동요약**, 비로그인 글쓰기→/login. 실행: `npx playwright test e2e/04-community.spec.ts`(dev 서버 webpack 자동 기동, 긴 명령은 로그파일+백그라운드 권장).

### 자동화로 커버됨(재확인 불필요)
글 작성·상세, 댓글 작성, 좋아요 토글, 마크다운 렌더 & XSS 무력화, 마이페이지 "내 글", 북마크 토글, 태그 필터, 공개 프로필, 비로그인 글쓰기 가드 → 위 E2E가 검증.

### 사용자가 직접 검토할 항목 (자동화 밖 — 시각·다계정·운영 판단 필요)
> 로컬 확인: `npm run dev` → http://localhost:3000 (로그인 후). E2E가 동작은 검증했으니 아래는 **눈으로 보는 모양/UX**와 **다계정 시나리오** 위주.

**혼자(단일 계정) — 시각·UX**
- [ ] **마이페이지 나머지 탭**: "내 댓글"(글 제목 링크 이동), "좋아요한 글", "저장"(북마크), 숨김글 "숨김" 뱃지 / 상단 **활동 요약**(글·댓글·받은 좋아요 수) 정확한지
- [ ] **마크다운 시각 점검**: 표·중첩 목록·코드블록·이미지·인용 렌더 모양, 작성 **미리보기 탭** 토글, 긴 글/줄바꿈
- [ ] **태그 필터**: 상세에서 `#태그` 클릭 → `/community?tag=…` 필터 + 칩 `✕` 해제
- [ ] **이미지 라이트박스**: 상세 이미지 클릭 → 전체화면 확대, 바깥클릭/ESC 닫기, 배경 스크롤 잠금
- [ ] **북마크**: 상세 "저장" 버튼 토글(저장↔저장됨)
- [ ] **공개 프로필**: 작성자 닉네임 클릭 → `/community/u/[닉네임]` 활동요약·작성글
- [ ] **카테고리 SNB**: 데스크탑 좌측 사이드바 / 모바일 햄버거 토글, 카테고리 필터·정렬·검색
- [ ] **이미지 업로드**: 글당 5장·5MB 제한, 상세 갤러리 표시
- [ ] **모바일 반응형** 전반 + 헤더 종/닉네임/로그아웃 레이아웃
- [ ] **활동등급**: 점수 누적 시 뱃지 변화(새싹→일반→열심→고수)

**다계정/운영 권한 필요**
- [ ] **알림(종)**: 남이 내 글에 댓글/좋아요/공지 → 종 배지 증가, 드롭다운 클릭→읽음→글 이동, "모두 읽음", `/community/settings` 토글 저장·재방문 유지(특히 좋아요 기본 OFF)
- [ ] **신고·모더레이션**: 서로 다른 5명 신고 → 자동숨김·목록에서 사라짐, `/community/admin` 검토큐 복원/삭제, moderator 승격(`scripts/set-role.mjs`로 첫 admin)
- [ ] **관리자 글 고정(pin)**: staff 계정으로 상세에서 "고정" → 목록 상단 고정 / "고정 해제"
- [ ] **권한**: 일반유저 글쓰기 폼에 "공지" 카테고리 안 보임, 공지 작성은 운영진만, 남의 글/댓글 수정·삭제 불가
- [ ] **벌점제(Phase 8)**: 운영진이 `/community/admin` 검토큐에서 "벌점 부과"(심각도+메모) → 대상 계정에 (a)종 알림 (b)`/community/me` 제재 배너 (c)글쓰기/댓글/좋아요 시도 차단(→/community/me) → 누적 5점 정지·10점 영구정지 표시 / admin 제재 해제 후 다시 쓰기 가능 / 같은 글 중복 "벌점 부과됨" 표시. (데이터 계층은 verify-phase8 8/8로 검증됨, UI·다계정 흐름만 수동.)

**Phase 7 — 라이브(Vercel) 점검 대기 (배포됨, 사용자 확인 필요)**
- [ ] **모바일 카테고리**: 좌측 슬라이드 드로어(오버레이·ESC·바깥클릭 닫기·스크롤락)
- [ ] **모바일 헤더**: 햄버거(도감/커뮤니티 링크) + 로고 아이콘화 + 종 항상 노출, 줄바꿈 없음
- [ ] **종 드롭다운**: 모바일에서 좌측 안 잘리고 화면 안에 표시
- [ ] **검색**: 버튼 가로 유지 + 입력 X(또는 비우기) → 전체 목록 복귀
- [ ] **댓글 액션**: 좋아요·답글·신고·삭제 한 줄, 밑선 정렬
- [ ] **알림 Realtime**: 2계정 — 댓글/좋아요 시 새로고침 없이 종 배지 증가, "모두 읽음"→배지 즉시 0 + 재방문해도 유지(취소 안 됨)
- [ ] **운영자 등급**: admin/moderator 글·댓글에 "운영자/운영진" 표시(활동등급 대신)

**막힘 / 나중**
- [ ] **이메일 알림**: 현재 **저장만, 발송 없음** — SMTP(Resend) 연결 전까지 검증 불가(설정 화면 안내문만 확인)

## 남은 일
**Phase 5 후속 (별도 작업)**
- 이메일 알림 활성화: 커스텀 SMTP(Resend) 연결 → 매트릭스 email 채널 실제 발송 + `locked` 게시글 잠금 메일.
- 장터(마켓플레이스): 가격·상태·판매여부 등 전용 필드 → 별도 스펙 인터뷰 필요(작업량 큼).
- 앱 푸시: 모바일 앱 단계.

**2차 결정 (운영 데이터 보고 확정)**
- 활동점수 가중치/4등급 임계값 튜닝 (현재 글3·댓글1·좋아요2, 임계 0/10/50/150).
- 벌점 임계값/심각도 튜닝 (현재 3 경고·5→7일·8→30일·10→영구, 심각도 +1/+2/+3). 변경 시 SQL 트리거 + `types.ts` 상수 동기화.
- 공지 알림 fan-out → broadcast 전환 시점(유저 수 증가 시).
- 익명(비로그인) 조회수 dedupe 키(현재 쿠키 `cv`).

**검증 보강**
- ✅ Playwright E2E 핵심 흐름(`e2e/04-community.spec.ts`, **9/9**). 신고→자동숨김·알림 종은 다계정 시나리오라 미자동화 → 위 "직접 검토할 항목"의 다계정 케이스로 남김. Phase 7(모바일·Realtime)은 시각/다계정이라 수동 점검.

**검증용 seed 스크립트 (삭제됨 — 필요 시 재생성)**
다계정 수동 검토용 픽스처 3종은 검증 후 삭제함. 재검토가 필요하면 아래 사양으로 재생성 요청:
- admin 계정 1개(role=admin 표시 검증).
- 활동점수 9/49/149(등급 경계 새싹→일반→열심→고수 검증).
- 신고 4건 달린 글(5번째 신고 시 자동숨김 검증).
> 첫 admin 지정은 `node scripts/set-role.mjs <email> admin`으로도 가능(이 스크립트는 유지됨).

**별도 보류 (커뮤니티 무관)**
- `shop2930@naver.com` 인증 클린 재검증(이메일 가입→확인→네이버 로그인 연결). 상세는 `e2e/TEST-RESULTS.md`.
