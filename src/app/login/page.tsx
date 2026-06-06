import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "로그인 — 키보드 커뮤니티",
};

export default function LoginPage() {
  return <AuthForm />;
}
