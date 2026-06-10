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
};

// 글·댓글 작성 등 "커뮤니티 참여" 가드.
// 로그인했지만 프로필(닉네임)이 없는 소셜 신규 유저는 /onboarding 으로.
export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, role, activity_score")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  return { supabase, user, profile: profile as CurrentProfile };
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
