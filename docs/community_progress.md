# 커뮤니티 게시판 — 진행상황 (세션 핸드오프)

> 다음 세션이 맥락 없이 이어갈 수 있도록 정리한 문서. 상세 스펙·결정 근거는 플랜 파일
> (`~/.claude/plans/md-peppy-seahorse.md`)에, 전체 사이트 계획은 루트 `PLAN.md`에 있다.
> 최종 갱신: 2026-06-11, HEAD `86bff6f` 기준.

## 한 줄 요약
키보드 커뮤니티의 **게시판(커뮤니티 3단계)**을 인터뷰 스펙대로 Phase 1~5까지 구현·커밋 완료.
`/community`가 stub에서 실제 게시판으로 가동 중. 데이터 계층 검증(스크립트) 전부 통과.

## 현재 단계 (Phase 1~5 완료)
| Phase | 내용 | 커밋 |
|---|---|---|
| 1 | 스키마·RLS + 글/댓글/대댓글/좋아요 + 목록·상세 | `6cab823` |
| 2 | 이미지 업로드(Storage)·검색(ILIKE)·인기글(Best)·조회수 | `08c3103` |
| 3 | 신고·자동숨김(5명)·관리자 검토큐·moderator 승격 | `1a446e7`, 보정 `49e40b7` |
| 4 | 활동등급 표시·인앱 알림(헤더 종)·알림설정 매트릭스·자동잠금 통보 | `935057d` |
| — | 카테고리 키보드 특화 세분화(10종) + 좌측 SNB(모바일 햄버거) | `bf5fc9c`, `e856515` |
| 5 | 댓글 좋아요(카운터·활동점수·알림) | `14f8aaf` |
| 5 | 본문 마크다운(작성 미리보기·XSS-safe 렌더) | `86bff6f` |

브랜치: `feat/community-board` (main 미머지 — 머지/배포는 사용자 판단).

## 작업 워크플로 (단계마다 동일)
1. **빌드/코드 작성** (dev는 `next dev --webpack` — Turbopack dev 크래시 회피, 빌드는 Turbopack 정상)
2. **사용자가 Supabase 대시보드 SQL Editor에서 `docs/sql/community.sql` 적용** (멱등 — 재실행 안전)
3. **`scripts/*.mjs`로 데이터 계층 검증** (service_role, self-clean)
4. **커밋** — 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## DB / 환경 제약 (중요)
- **이 머신에서 DDL 불가**: `.env.local`엔 키 5개뿐(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) — DB 비번/접속문자열 없음. supabase CLI·psql·pg 드라이버 없음. → **`create table/policy/function` 같은 DDL은 사용자가 SQL Editor에서 직접 실행**해야 함. service_role 클라이언트는 DML(insert/upsert/delete, auth admin)만 가능.
- **첫 admin 지정**: UI 밖에서만. `node scripts/set-role.mjs <email> admin`. 이후 admin이 `/community/admin`에서 moderator 승격.
- **이메일 알림**: SMTP(Resend) 연결 전까지 prefs에 **저장만**, 실제 발송 없음(설정 화면에 안내문 노출).

## 아키텍처 핵심 (코드만 봐선 모르는 결정)
- **카테고리는 DB-driven** (`categories` 테이블, 현재 10종: 공지·자유·질문·자랑·키보드·키축·키캡·커스텀·후기·정보). 행을 추가/수정하면 **코드 변경 없이** 탭·SNB·작성 폼에 자동 반영. 공지(`notice`)는 `admin_only`.
- **역할 vs 등급 분리**: `profiles.role`(user/moderator/admin = 권한) ↔ `activity_score` 기반 **표시 전용** 활동등급(`levelFor` → 새싹/일반/열심/고수). 점수 가중: 글 +3, 댓글 +1, 받은 좋아요 +2(글·댓글 공통).
- **신고 자동숨김**: 서로 다른 신고자 **5명(중복제거)** → 대상 `is_hidden=true`. **open 신고만 카운트** → 운영자가 복원하면 신고가 `resolved`로 처리돼 카운트 0 리셋(=사면), 다시 숨기려면 새 5명 필요. 숨김 **첫 전환 순간에만** 작성자에게 `locked` 알림(6번째+ 중복 없음).
- **숨김글 노출**: RLS상 작성자·운영진은 볼 수 있으나 **목록(`listPosts`/`getBestPosts`)엔 `is_hidden=false` 필터로 미노출**. 상세 직링크/검토큐로만 접근. 삭제·접근불가 글은 404 대신 이전 페이지로 redirect(`backUrl()`).
- **인앱 알림**: SECURITY DEFINER `notify()` 헬퍼가 수신자=actor면 skip(자기알림 방지) + 이벤트별 `*_bell` 토글 확인 후 insert. `notifications` insert 정책 없음(트리거만). 이벤트×채널 매트릭스(`notification_prefs`, like_bell만 기본 OFF). `locked`는 시스템 통보라 매트릭스 비대상·항상 발송.
- **댓글 좋아요**: 글 좋아요와 동일 패턴(`comment_likes` + `comments.like_count` denorm + 트리거). 알림은 `like` 타입 재사용하되 **comment_id가 채워지면** 포맷터가 "댓글을 좋아합니다"로 구분.
- **본문 마크다운**: `react-markdown` + `remark-gfm`. 원시 HTML 미렌더(rehype-raw 미사용) + URL sanitize 내장 → `dangerouslySetInnerHTML` 없이 **XSS-safe**. 본문은 마크다운 **소스 그대로 저장**(검색 ILIKE 영향 없음). 링크는 새 탭 + `rel="noopener noreferrer nofollow"`.

## 파일 지도
- **라우트** `src/app/community/*`: `page.tsx`(홈: SNB·목록·Best·검색), `[id]/page.tsx`(상세), `[id]/edit/page.tsx`, `new/page.tsx`, `admin/page.tsx`(검토큐·역할), `settings/page.tsx`(알림설정·등급)
- **서버 액션** `src/app/community/actions.ts`: createPost/updatePost/deletePost, addComment/updateComment/deleteComment, toggleLike, **toggleCommentLike**, recordView, reportTarget, moderateHide/moderateDelete, setRole, markNotificationRead/markAllNotificationsRead, updateNotificationPrefs
- **컴포넌트** `src/components/community/*`: PostForm(쓰기/미리보기 탭), PostRow, CommentSection/CommentView/CommentForm/EditableCommentBody, LikeButton/**CommentLikeButton**, **Markdown**, BellMenu, NotificationSettingsForm, CategorySidebar, ImageUploader, SearchBox, ReportButton, AuthorBadge, ReplyToggle, ConfirmSubmitButton, ViewTracker
- **lib** `src/lib/community/*`: `queries.ts`(server-only 조회), `types.ts`(도메인 타입·LEVELS·REPORT_REASONS·알림 타입), `format.ts`(formatDate·notificationText), `notifications.ts`, `limits.ts`
- **가드** `src/lib/auth/guards.ts`: requireUser/requireProfile/requireStaff/requireAdmin
- **SQL** `docs/sql/community.sql` (Phase별 섹션, 멱등) — 적용 주체는 사용자
- **검증 스크립트** `scripts/`: `check-community-schema.mjs`, `verify-phase2~5.mjs`, `set-role.mjs`, `diag-user.mjs`, `delete-user.mjs`

## 검증 명령 (라이브 Supabase, 모두 self-clean)
```bash
node scripts/check-community-schema.mjs   # 전 스키마 적용 probe
node scripts/verify-phase2.mjs            # 글 CRUD·카운터·임베드·인기글·조회수
node scripts/verify-phase3.mjs            # 신고·자동숨김·검토큐
node scripts/verify-phase4.mjs            # 인앱 알림·자기알림 방지·자동잠금
node scripts/verify-phase5.mjs            # 댓글 좋아요·점수·알림
npm run build                             # 컴파일(마크다운 RSC 포함)
```
> 셸 주의: 이 환경의 PowerShell 파이프(`Select-Object`)에서 도구 결과 전달이 깨진 사례가 있어 **Bash 도구**로 실행하는 게 안전.

### 최근 검증 결과 (2026-06-11)
- check-community-schema: **13/13 ✅** (10 카테고리 시드 확인)
- verify-phase2: **8/8 ✅** · phase3: **5/5 ✅** · phase4: **10/10 ✅** · phase5: **7/7 ✅**
- `npm run build`: **green** (190 페이지, exit 0)
- **Playwright E2E `e2e/04-community.spec.ts`: 9/9 ✅** (태그 1건 webpack 첫 컴파일로 flaky→retry 통과) — 글 작성→상세, 댓글, 좋아요 토글, 마크다운+XSS(브라우저에서 `window.__xss` 미정의·`<script>` DOM 미주입·`javascript:` 링크 0개 확인), 마이페이지 내 글, **북마크 토글→저장 탭, 상세 태그 클릭→필터, 공개 프로필+활동요약**, 비로그인 글쓰기→/login. 실행: `npx playwright test e2e/04-community.spec.ts`(dev 서버 webpack 자동 기동, 긴 명령은 로그파일+백그라운드 권장).

### 자동화로 커버됨(재확인 불필요)
글 작성·상세, 댓글 작성, 좋아요 토글, 마크다운 렌더 & XSS 무력화, 마이페이지 "내 글", 북마크 토글, 태그 필터, 공개 프로필, 비로그인 글쓰기 가드 → 위 E2E가 검증.

### 사용자가 직접 검토할 항목 (자동화 밖 — 시각·다계정·운영 판단 필요)
- [ ] **마이페이지 나머지 탭**: "내 댓글"(글 제목 링크 이동), "좋아요한 글"(좋아요 후 실제 표시), 숨김글 "숨김" 뱃지
- [ ] **마크다운 시각 점검**: 표·중첩 목록·코드블록·이미지·인용 렌더 모양, 작성 미리보기 탭 토글, 긴 글/줄바꿈
- [ ] **알림(종)** — 다계정 필요: 남이 내 글에 댓글/좋아요/공지 → 종 배지 증가, 드롭다운 클릭→읽음→글 이동, "모두 읽음", `/community/settings` 토글 저장·재방문 유지(특히 좋아요 기본 OFF)
- [ ] **신고·모더레이션** — 5개 계정 필요: 서로 다른 5명 신고 → 자동숨김·목록에서 사라짐, `/community/admin` 검토큐 복원/삭제, moderator 승격(`scripts/set-role.mjs`로 첫 admin)
- [ ] **카테고리 SNB**: 데스크탑 좌측 사이드바 / 모바일 햄버거 토글, 카테고리 필터·정렬·검색
- [ ] **권한**: 일반유저 글쓰기 폼에 "공지" 카테고리 안 보임, 공지 작성은 운영진만, 남의 글/댓글 수정·삭제 불가
- [ ] **이미지 업로드**: 글당 5장·5MB 제한, 상세 갤러리 표시
- [ ] **모바일 반응형** 전반 + 헤더 종/닉네임/로그아웃 레이아웃
- [ ] **활동등급**: 점수 누적 시 뱃지 변화(새싹→일반→열심→고수)
- [ ] **이메일 알림**: 현재 **저장만, 발송 없음** — SMTP(Resend) 연결 전까지 검증 불가(설정 화면 안내문만 확인)
- [ ] **배포 후 재확인**: main 머지 → Vercel 운영(keyboard-community.vercel.app)에서 핵심 흐름 한 번 더

## 남은 일
**Phase 5 후속 (별도 작업)**
- 이메일 알림 활성화: 커스텀 SMTP(Resend) 연결 → 매트릭스 email 채널 실제 발송 + `locked` 게시글 잠금 메일.
- 장터(마켓플레이스): 가격·상태·판매여부 등 전용 필드 → 별도 스펙 인터뷰 필요(작업량 큼).
- 앱 푸시: 모바일 앱 단계.

**2차 결정 (운영 데이터 보고 확정)**
- 활동점수 가중치/4등급 임계값 튜닝 (현재 글3·댓글1·좋아요2, 임계 0/10/50/150).
- 공지 알림 fan-out → broadcast 전환 시점(유저 수 증가 시).
- 익명(비로그인) 조회수 dedupe 키(현재 쿠키 `cv`).

**검증 보강**
- ✅ Playwright E2E 핵심 흐름 추가 완료(`e2e/04-community.spec.ts`, 6/6). 향후 신고→자동숨김·알림 종은 다계정 시나리오라 미자동화 → 위 "직접 검토할 항목"의 다계정 케이스로 남김.

**별도 보류 (커뮤니티 무관)**
- `shop2930@naver.com` 인증 클린 재검증(이메일 가입→확인→네이버 로그인 연결). 상세는 `e2e/TEST-RESULTS.md`.
