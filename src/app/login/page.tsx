import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "로그인 — 키보드 커뮤니티",
};

export default async function LoginPage() {
  // 이미 로그인한 사용자가 /login에 오면 홈으로 보낸다.
  // (다른 탭에서 이메일 인증 후 이 탭을 새로고침했을 때 로그인 폼이 계속 보이던 문제 해결)
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return <AuthForm />;
}
