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

-- 1) 카테고리 ----------------------------------------------------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  admin_only  boolean not null default false, -- 공지처럼 admin만 글쓰기
  position    int not null default 0
);

insert into public.categories (slug, name, admin_only, position) values
  ('notice', '공지',  true,  0),
  ('free',   '자유',  false, 1),
  ('qna',    '질문',  false, 2),
  ('review', '후기',  false, 3)
on conflict (slug) do nothing;

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

-- 댓글 수 + 작성자 활동점수
create or replace function public.on_comment_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    perform public.bump_score(new.user_id, 1);
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

-- 글 작성자 활동점수(글 +3) + updated_at
create or replace function public.on_post_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.bump_score(new.user_id, 3);
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
create or replace function public.on_report_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cnt int;
begin
  select count(distinct reporter_id) into cnt
  from public.reports
  where target_type = new.target_type and target_id = new.target_id;

  if cnt >= 5 then
    if new.target_type = 'post' then
      update public.posts set is_hidden = true where id = new.target_id;
    else
      update public.comments set is_hidden = true where id = new.target_id;
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
-- [Phase 4] notifications / notification_prefs 는 이후 단계.
-- =============================================================
