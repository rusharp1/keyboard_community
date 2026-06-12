import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그인 필수. 비로그인은 /login 으로.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type CurrentProfile = {
  id: string;
  nickname: string;
  role: "user" | "moderator" | "admin";
  activity_score: number;
  penalty_points: number;
  suspended_until: string | null;
  is_banned: boolean;
};

// 제재 상태(영구정지 또는 정지기간 미만료)인지. 쓰기 가드에서 사용.
export function isSanctioned(profile: CurrentProfile): boolean {
  if (profile.is_banned) return true;
  return (
    profile.suspended_until != null &&
    new Date(profile.suspended_until).getTime() > Date.now()
  );
}

// 글·댓글 작성 등 "커뮤니티 참여" 가드.
// 로그인했지만 프로필(닉네임)이 없는 소셜 신규 유저는 /onboarding 으로.
export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, nickname, role, activity_score, penalty_points, suspended_until, is_banned",
    )
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  return { supabase, user, profile: profile as CurrentProfile };
}

// 쓰기(글·댓글·좋아요·신고) 가드. 제재 중이면 /community/me(제재 배너)로 보낸다.
// 읽기는 requireProfile로 충분 — 정지 유저도 자기 페이지·글 열람은 가능.
export async function requireWriteAccess() {
  const ctx = await requireProfile();
  if (isSanctioned(ctx.profile)) redirect("/community/me");
  return ctx;
}

// 운영진(admin/moderator) 전용. 권한 없으면 /community 로.
export async function requireStaff() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "admin" && ctx.profile.role !== "moderator")
    redirect("/community");
  return ctx;
}

// admin 전용(역할 변경 등). 권한 없으면 /community 로.
export async function requireAdmin() {
  const ctx = await requireProfile();
  if (ctx.profile.role !== "admin") redirect("/community");
  return ctx;
}
