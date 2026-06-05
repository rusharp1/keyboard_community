import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 — 키보드 커뮤니티",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="mt-3 text-muted">
        로그인/회원가입은 준비 중입니다. (이메일 + 구글 로그인 예정)
      </p>
    </div>
  );
}
