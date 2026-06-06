import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정 — 키보드 커뮤니티",
};

export default function ResetPage() {
  return <ResetPasswordForm />;
}
