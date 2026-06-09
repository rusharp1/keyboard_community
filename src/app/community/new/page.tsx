import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { getCategories } from "@/lib/community/queries";
import { createPost } from "@/app/community/actions";
import PostForm from "@/components/community/PostForm";

export const metadata: Metadata = {
  title: "글쓰기 — 커뮤니티",
};

export default async function NewPostPage() {
  // 로그인·프로필 가드(없으면 /login 또는 /onboarding).
  const { profile } = await requireProfile();
  const isStaff = profile.role !== "user";
  const categories = (await getCategories())
    .filter((c) => !c.admin_only || isStaff)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">글쓰기</h1>
        <Link href="/community" className="text-sm text-muted hover:text-foreground">
          ← 목록
        </Link>
      </div>
      <PostForm action={createPost} categories={categories} />
    </div>
  );
}
