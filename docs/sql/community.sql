-- =============================================================
-- 커뮤니티 게시판 (3단계) — Phase 1 스키마 + RLS + 트리거
-- Supabase 대시보드 → SQL Editor에서 실행하세요. (참조용 스냅샷)
-- 선행: profiles.sql 이 먼저 적용돼 있어야 함.
-- 범위: profiles(role/activity_score), categories, posts, comments, post_likes.
--        신고/조회수/알림 테이블은 Phase 3·4에서 이 파일 하단에 추가.
-- =============================================================

-- 0) profiles 확장 ------------------------------------------------
-- 역할(권한)과 활동점수(표시용 등급의 근거)를 추가.
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'moderator', 'admin'));

alter table public.profiles
  add column if not exists activity_score int not null default 0;

-- 운영/모더레이터 여부(권한 검사용). security definer로 RLS 재귀 회피.
create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'moderator')
  );
$$;

-- admin 여부(역할 변경 등 운영 최상위 권한). security definer로 RLS 재귀 회피.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

-- profiles update: 본인 행은 profiles.sql 정책이 허용. 여기선 admin이 남의 행
-- (= moderator 승격/해제 등 role 변경)을 고칠 수 있도록 별도 정책을 추가한다.
-- 본인 admin 행을 스스로 못 내리도록 막진 않음(setRole 액션이 self/admin 변경을 차단).
drop policy if exists "admins can update any profile" on public.profiles;
create policy "admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- 1) 카테고리 ----------------------------------------------------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  admin_only  boolean not null default false, -- 공지처럼 admin만 글쓰기
  position    int not null default 0
);

-- 키보드 커뮤니티에 맞춘 카테고리. 재실행 시 name/position/admin_only까지 동기화.
insert into public.categories (slug, name, admin_only, position) values
  ('notice',   '공지',   true,  0),
  ('free',     '자유',   false, 1),
  ('qna',      '질문',   false, 2),
  ('show',     '자랑',   false, 3),
  ('keyboard', '키보드', false, 4),
  ('switch',   '키축',   false, 5),
  ('keycap',   '키캡',   false, 6),
  ('build',    '커스텀', false, 7),
  ('review',   '후기',   false, 8),
  ('info',     '정보',   false, 9)
on conflict (slug) do update
  set name = excluded.name,
      admin_only = excluded.admin_only,
      position = excluded.position;

alter table public.categories enable row level security;
drop policy if exists "categories readable by everyone" on public.categories;
create policy "categories readable by everyone"
  on public.categories for select using (true);

-- 2) 게시글 ------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  -- 작성자는 항상 profiles 보유(requireProfile 가드) → profiles 참조로 임베드 조인 가능.
  user_id       uuid not null references public.profiles (id) on delete cascade,
  category_id   bigint not null references public.categories (id),
  title         text not null,
  body          text not null,
  tags          text[] not null default '{}',
  view_count    int not null default 0,
  like_count    int not null default 0,
  comment_count int not null default 0,
  is_hidden     boolean not null default false, -- 신고 누적 자동숨김(Phase 3)
  pinned        boolean not null default false, -- 공지 상단 고정
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_category_created_idx
  on public.posts (category_id, created_at desc);
create index if not exists posts_created_idx
  on public.posts (created_at desc);
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

alter table public.posts enable row level security;

-- 읽기: 숨김 글은 작성자·운영진만. 그 외 공개.
drop policy if exists "posts readable" on public.posts;
create policy "posts readable"
  on public.posts for select
  using (not is_hidden or auth.uid() = user_id or public.is_staff());

-- 쓰기: 본인 글만. admin_only 카테고리(공지)는 운영진만.
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own"
  on public.posts for insert
  with check (
    auth.uid() = user_id
    and (
      not (select c.admin_only from public.categories c where c.id = category_id)
      or public.is_staff()
    )
  );

-- 수정/삭제: 본인 또는 운영진.
drop policy if exists "posts update own or staff" on public.posts;
create policy "posts update own or staff"
  on public.posts for update
  using (auth.uid() = user_id or public.is_staff())
  with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "posts delete own or staff" on public.posts;
create policy "posts delete own or staff"
  on public.posts for delete
  using (auth.uid() = user_id or public.is_staff());

-- 3) 댓글(대댓글 1단계) ------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  body        text not null,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_idx
  on public.comments (post_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
  on public.comments for select
  using (not is_hidden or auth.uid() = user_id or public.is_staff());

drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "comments update own or staff" on public.comments;
create policy "comments update own or staff"
  on public.comments for update
  using (auth.uid() = user_id or public.is_staff())
  with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "comments delete own or staff" on public.comments;
create policy "comments delete own or staff"
  on public.comments for delete
  using (auth.uid() = user_id or public.is_staff());

-- 4) 좋아요(글) --------------------------------------------------
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

drop policy if exists "likes readable by everyone" on public.post_likes;
create policy "likes readable by everyone"
  on public.post_likes for select using (true);

drop policy if exists "likes insert own" on public.post_likes;
create policy "likes insert own"
  on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "likes delete own" on public.post_likes;
create policy "likes delete own"
  on public.post_likes for delete using (auth.uid() = user_id);

-- 5) denorm 카운터 + 활동점수 트리거 -----------------------------
-- 활동점수 가중: 글 +3, 댓글 +1, (내 글이) 받은 좋아요 +2.
create or replace function public.bump_score(uid uuid, delta int)
returns void language sql security definer set search_path = '' as $$
  update public.profiles set activity_score = greatest(0, activity_score + delta)
  where id = uid;
$$;

-- 댓글 수 + 작성자 활동점수 + 알림(글 작성자=댓글, 상위 댓글 작성자=대댓글)
-- public.notify는 Phase 4 섹션에서 정의(plpgsql 본문은 호출 시점에 해석되어 forward ref 안전).
create or replace function public.on_comment_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id
      returning user_id into post_author;
    perform public.bump_score(new.user_id, 1);
    if new.parent_id is not null then
      -- 대댓글: 상위 댓글 작성자에게만 'reply'.
      select user_id into parent_author from public.comments where id = new.parent_id;
      perform public.notify(parent_author, 'reply', new.user_id, new.post_id, new.id);
    else
      -- 최상위 댓글: 글 작성자에게 'comment'.
      perform public.notify(post_author, 'comment', new.user_id, new.post_id, new.id);
    end if;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    perform public.bump_score(old.user_id, -1);
  end if;
  return null;
end;
$$;

drop trigger if exists comments_after_change on public.comments;
create trigger comments_after_change
  after insert or delete on public.comments
  for each row execute function public.on_comment_change();

-- 좋아요 수 + 글 작성자(받은 좋아요) 활동점수
create or replace function public.on_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id
      returning user_id into author;
    perform public.bump_score(author, 2);
    perform public.notify(author, 'like', new.user_id, new.post_id, null);
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id
      returning user_id into author;
    perform public.bump_score(author, -2);
  end if;
  return null;
end;
$$;

drop trigger if exists likes_after_change on public.post_likes;
create trigger likes_after_change
  after insert or delete on public.post_likes
  for each row execute function public.on_like_change();

-- 글 작성자 활동점수(글 +3) + 공지면 전체 알림 fan-out
create or replace function public.on_post_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  is_notice boolean;
begin
  if tg_op = 'INSERT' then
    perform public.bump_score(new.user_id, 3);
    -- 공지(admin_only 카테고리) 글이면 작성자 제외 전체에게 'notice'(소규모 fan-out).
    select admin_only into is_notice from public.categories where id = new.category_id;
    if is_notice then
      perform public.notify(p.id, 'notice', new.user_id, new.id, null)
      from public.profiles p
      where p.id <> new.user_id;
    end if;
  elsif tg_op = 'DELETE' then
    perform public.bump_score(old.user_id, -3);
  end if;
  return null;
end;
$$;

drop trigger if exists posts_after_change on public.posts;
create trigger posts_after_change
  after insert or delete on public.posts
  for each row execute function public.on_post_change();

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at(); -- profiles.sql 정의 재사용

-- =============================================================
-- Phase 2 — 이미지 / 조회수
-- =============================================================

-- 6) 글 이미지(공개 URL 배열) ------------------------------------
alter table public.posts
  add column if not exists images text[] not null default '{}';

-- 7) 조회수 중복방지 집계 ----------------------------------------
-- (post_id, viewer_key, day) 단위로 하루 1회만 카운트.
-- viewer_key = 로그인 유저 id 또는 익명 쿠키 값.
create table if not exists public.post_views (
  post_id     uuid not null references public.posts (id) on delete cascade,
  viewer_key  text not null,
  day         date not null default current_date,
  primary key (post_id, viewer_key, day)
);

alter table public.post_views enable row level security;
-- 집계용 insert만 허용(누구나). view_count는 posts에 denorm되므로 select 불필요.
drop policy if exists "views insert anyone" on public.post_views;
create policy "views insert anyone"
  on public.post_views for insert with check (true);

create or replace function public.on_view_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.posts set view_count = view_count + 1 where id = new.post_id;
  return null;
end;
$$;

drop trigger if exists post_views_after_insert on public.post_views;
create trigger post_views_after_insert
  after insert on public.post_views
  for each row execute function public.on_view_insert();

-- 8) Storage 버킷(post-images, 공개) + 정책 ----------------------
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

drop policy if exists "post-images public read" on storage.objects;
create policy "post-images public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- 업로드는 로그인 유저가 본인 폴더(<uid>/...)에만.
drop policy if exists "post-images auth upload" on storage.objects;
create policy "post-images auth upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post-images owner delete" on storage.objects;
create policy "post-images owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================
-- Phase 3 — 신고 / 자동숨김 / 모더레이션
-- =============================================================

-- 9) 신고 --------------------------------------------------------
-- 글·댓글 공통(target_id는 둘 다 uuid). 한 사람이 같은 대상 1회만(unique).
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  target_type  text not null check (target_type in ('post', 'comment')),
  target_id    uuid not null,
  reason       text not null
    check (reason in ('spam', 'abuse', 'offtopic', 'sexual', 'etc')),
  detail       text,
  status       text not null default 'open' check (status in ('open', 'resolved')),
  created_at   timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_target_idx
  on public.reports (target_type, target_id);
create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- 등록: 로그인 본인만(중복은 unique 제약으로 차단).
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- 열람/처리: 운영진만.
drop policy if exists "reports staff read" on public.reports;
create policy "reports staff read"
  on public.reports for select using (public.is_staff());

drop policy if exists "reports staff update" on public.reports;
create policy "reports staff update"
  on public.reports for update
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "reports staff delete" on public.reports;
create policy "reports staff delete"
  on public.reports for delete using (public.is_staff());

-- 자동숨김: 서로 다른 신고자 5명 이상이면 대상 글/댓글 is_hidden=true.
-- open 신고만 카운트한다. 운영자가 복원하면 신고가 resolved 처리되어 카운트가
-- 0으로 리셋되고(=사면), 다시 숨기려면 새 신고 5명이 필요하다.
-- 숨김으로 "처음 전환되는 순간"에만 작성자에게 'locked' 인앱 알림(시스템 통보 →
-- prefs/매트릭스 비대상, 항상 발송). where is_hidden=false + RETURNING으로 전환 감지해
-- 6번째 이후 신고에는 중복 알림이 가지 않도록 한다. (public.notifications는 아래에서 정의)
create or replace function public.on_report_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cnt int;
  author uuid;
  c_post uuid;
begin
  select count(distinct reporter_id) into cnt
  from public.reports
  where target_type = new.target_type and target_id = new.target_id
    and status = 'open';

  if cnt >= 5 then
    if new.target_type = 'post' then
      update public.posts set is_hidden = true
        where id = new.target_id and is_hidden = false
        returning user_id into author;
      if author is not null then
        insert into public.notifications (user_id, type, post_id)
        values (author, 'locked', new.target_id);
      end if;
    else
      update public.comments set is_hidden = true
        where id = new.target_id and is_hidden = false
        returning user_id, post_id into author, c_post;
      if author is not null then
        insert into public.notifications (user_id, type, post_id, comment_id)
        values (author, 'locked', c_post, new.target_id);
      end if;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists reports_after_insert on public.reports;
create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.on_report_insert();

-- =============================================================
-- Phase 4 — 인앱 알림 / 알림 설정
-- =============================================================

-- 9) 알림 ---------------------------------------------------------
-- 수신자(user_id) 기준. 트리거(security definer)만 insert. 본인만 읽고 갱신.
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('comment', 'reply', 'like', 'notice', 'locked')),
  actor_id    uuid references public.profiles (id) on delete set null,
  post_id     uuid references public.posts (id) on delete cascade,
  comment_id  uuid references public.comments (id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications select own" on public.notifications;
create policy "notifications select own"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own"
  on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own"
  on public.notifications for delete using (auth.uid() = user_id);
-- insert 정책 없음: notify() 트리거만 행을 만든다.

-- 10) 알림 설정(이벤트×채널 토글) --------------------------------
-- bell=인앱, email=이메일(저장만, 실제 발송은 SMTP 연결 후). 행이 없으면 기본값 사용.
create table if not exists public.notification_prefs (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  comment_bell   boolean not null default true,
  comment_email  boolean not null default false,
  reply_bell     boolean not null default true,
  reply_email    boolean not null default false,
  like_bell      boolean not null default false, -- 좋아요 알림은 기본 OFF
  like_email     boolean not null default false,
  notice_bell    boolean not null default true,
  notice_email   boolean not null default false,
  updated_at     timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists "prefs select own" on public.notification_prefs;
create policy "prefs select own"
  on public.notification_prefs for select using (auth.uid() = user_id);

drop policy if exists "prefs insert own" on public.notification_prefs;
create policy "prefs insert own"
  on public.notification_prefs for insert with check (auth.uid() = user_id);

drop policy if exists "prefs update own" on public.notification_prefs;
create policy "prefs update own"
  on public.notification_prefs for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 11) 알림 생성 헬퍼 ----------------------------------------------
-- 수신자=actor(본인 행위)거나 수신자 null이면 skip. 해당 이벤트의 bell 토글이
-- 켜져 있으면(행 없으면 기본값) notifications에 insert. email은 저장만, 여기선 미발송.
create or replace function public.notify(
  p_recipient uuid,
  p_type      text,
  p_actor     uuid,
  p_post      uuid,
  p_comment   uuid
) returns void language plpgsql security definer set search_path = '' as $$
declare
  allowed boolean;
begin
  if p_recipient is null or p_recipient = p_actor then
    return;
  end if;

  select case p_type
    when 'comment' then coalesce(np.comment_bell, true)
    when 'reply'   then coalesce(np.reply_bell, true)
    when 'like'    then coalesce(np.like_bell, false)
    when 'notice'  then coalesce(np.notice_bell, true)
    else false
  end
  into allowed
  from (select p_recipient as uid) r
  left join public.notification_prefs np on np.user_id = r.uid;

  if allowed then
    insert into public.notifications (user_id, type, actor_id, post_id, comment_id)
    values (p_recipient, p_type, p_actor, p_post, p_comment);
  end if;
end;
$$;

-- =============================================================
-- Phase 5 — 댓글 좋아요
-- =============================================================

-- 12) 댓글 좋아요 -------------------------------------------------
-- 글 좋아요(post_likes)와 동일 패턴: denorm 카운터 + 활동점수 + 알림.
alter table public.comments
  add column if not exists like_count int not null default 0;

create table if not exists public.comment_likes (
  comment_id  uuid not null references public.comments (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

drop policy if exists "comment likes readable by everyone" on public.comment_likes;
create policy "comment likes readable by everyone"
  on public.comment_likes for select using (true);

drop policy if exists "comment likes insert own" on public.comment_likes;
create policy "comment likes insert own"
  on public.comment_likes for insert with check (auth.uid() = user_id);

drop policy if exists "comment likes delete own" on public.comment_likes;
create policy "comment likes delete own"
  on public.comment_likes for delete using (auth.uid() = user_id);

-- 좋아요 수 + 댓글 작성자(받은 좋아요) 활동점수 + 'like' 알림(like_bell 존중).
-- comment_id가 채워진 'like' 알림은 글 좋아요와 구분(앱 포맷터가 "댓글"로 표시).
create or replace function public.on_comment_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
  c_post uuid;
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id
      returning user_id, post_id into author, c_post;
    perform public.bump_score(author, 2);
    perform public.notify(author, 'like', new.user_id, c_post, new.comment_id);
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(0, like_count - 1) where id = old.comment_id
      returning user_id into author;
    perform public.bump_score(author, -2);
  end if;
  return null;
end;
$$;

drop trigger if exists comment_likes_after_change on public.comment_likes;
create trigger comment_likes_after_change
  after insert or delete on public.comment_likes
  for each row execute function public.on_comment_like_change();

-- =============================================================
-- Phase 6 — 북마크/스크랩
-- =============================================================

-- 13) 북마크 -----------------------------------------------------
-- 비공개(본인만). 카운터·활동점수·알림 없음(좋아요와 달리 순수 개인 저장).
create table if not exists public.post_bookmarks (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_bookmarks enable row level security;

-- 읽기/쓰기 모두 본인 행만(좋아요와 달리 공개 카운트가 없음).
drop policy if exists "bookmarks select own" on public.post_bookmarks;
create policy "bookmarks select own"
  on public.post_bookmarks for select using (auth.uid() = user_id);

drop policy if exists "bookmarks insert own" on public.post_bookmarks;
create policy "bookmarks insert own"
  on public.post_bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "bookmarks delete own" on public.post_bookmarks;
create policy "bookmarks delete own"
  on public.post_bookmarks for delete using (auth.uid() = user_id);
