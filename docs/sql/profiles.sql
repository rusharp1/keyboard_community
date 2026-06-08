-- =============================================================
-- profiles 테이블 + RLS + 신규 가입 트리거
-- Supabase 대시보드 → SQL Editor에서 실행하세요. (참조용 스냅샷)
-- =============================================================

-- 1) 프로필 테이블 ------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 닉네임 대소문자 무시 유니크(예: "Neo"와 "neo"를 동일 취급)
create unique index if not exists profiles_nickname_lower_idx
  on public.profiles (lower(nickname));

-- 2) RLS ---------------------------------------------------------
alter table public.profiles enable row level security;

-- 읽기: 공개(커뮤니티 작성자 표시명 노출용)
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 수정: 본인만
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- insert: 본인 행만(온보딩에서 네이버 신규 유저가 직접 닉네임을 넣어 생성).
-- 이메일/비번 가입은 트리거가 대신 생성하지만, 닉네임 없이 만들어지는
-- 소셜(네이버) 신규 유저는 온보딩이 본인 세션으로 insert 해야 한다.
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3) 신규 가입 시 프로필 자동 생성 트리거 -------------------------
-- signUp 시 options.data.nickname → raw_user_meta_data에 담기고,
-- 이 트리거가 그 값으로 profiles 행을 만든다.
-- 닉네임 unique 위반이 나면 트리거가 실패 → 가입 트랜잭션이 롤백된다.
-- 닉네임이 없으면(소셜/네이버 신규 유저) profiles 생성을 건너뛴다 → 온보딩에서 직접 insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'nickname' is not null then
    insert into public.profiles (id, nickname)
    values (new.id, new.raw_user_meta_data ->> 'nickname');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) updated_at 자동 갱신(선택) ----------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- =============================================================
-- [2단계 참고] 커뮤니티 글 테이블 RLS 패턴 (이번 단계에선 실행 안 함)
-- create table public.posts (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null references auth.users (id) on delete cascade,
--   title text not null,
--   body text not null,
--   created_at timestamptz not null default now()
-- );
-- alter table public.posts enable row level security;
-- create policy "posts readable by everyone" on public.posts for select using (true);
-- create policy "users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
-- create policy "users update own posts" on public.posts for update using (auth.uid() = user_id);
-- create policy "users delete own posts" on public.posts for delete using (auth.uid() = user_id);
-- =============================================================
