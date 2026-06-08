import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "로그인 — 키보드 커뮤니티",
};

const NOTICES: Record<string, string> = {
  no_email: "네이버 이메일 제공에 동의해야 가입할 수 있어요.",
  state: "보안 검증에 실패했어요. 다시 시도해 주세요.",
  naver: "네이버 로그인 중 오류가 발생했어요. 다시 시도해 주세요.",
  auth: "인증에 실패했어요. 다시 시도해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // 이미 로그인한 사용자가 /login에 오면 홈으로 보낸다.
  // (다른 탭에서 이메일 인증 후 이 탭을 새로고침했을 때 로그인 폼이 계속 보이던 문제 해결)
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const { error } = await searchParams;
  return <AuthForm notice={error ? NOTICES[error] : undefined} />;
}
