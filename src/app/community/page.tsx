import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 — 키보드 커뮤니티",
};

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">커뮤니티</h1>
      <p className="mt-3 text-muted">
        게시판·댓글 기능은 준비 중입니다. 회원가입과 함께 곧 열려요.
      </p>
      <p className="mt-1 text-sm text-muted">
        (다음 단계: Supabase 인증 + 게시판/댓글)
      </p>
      <Link
        href="/switches"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        먼저 축 도감 보기
      </Link>
    </div>
  );
}
