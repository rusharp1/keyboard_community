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
-- [Phase 3] reports + 자동숨김, [Phase 2] post_views(조회수),
-- [Phase 4] notifications / notification_prefs 는 이후 단계에서 추가.
-- =============================================================
