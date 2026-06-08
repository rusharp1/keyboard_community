import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "회원가입 — 키보드 커뮤니티",
};

export default async function SignupPage() {
  // 로그인 상태면 홈으로(/login과 동일 정책). 비로그인이면 가입 탭으로 연다.
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return <AuthForm defaultMode="signup" />;
}
