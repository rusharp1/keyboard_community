import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/auth/OnboardingForm";

export const metadata: Metadata = {
  title: "닉네임 설정 — 키보드 커뮤니티",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 이미 프로필(닉네임)이 있으면 온보딩 불필요.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect("/community");

  return <OnboardingForm />;
}
