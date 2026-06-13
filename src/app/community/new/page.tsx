import type { Metadata } from "next";
import Link from "next/link";
import { requireWriteAccess } from "@/lib/auth/guards";
import { getCategories } from "@/lib/community/queries";
import { createPost } from "@/app/community/actions";
import { parseItemRef } from "@/data/items";
import PostForm from "@/components/community/PostForm";

export const metadata: Metadata = {
  title: "글쓰기 — 커뮤니티",
};

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; category?: string }>;
}) {
  // 로그인·프로필·쓰기 가드(미로그인→/login, 프로필 없음→/onboarding, 제재 중→/community/me).
  const { profile } = await requireWriteAccess();
  const isStaff = profile.role !== "user";
  const sp = await searchParams;
  const all = await getCategories();
  const categories = all
    .filter((c) => !c.admin_only || isStaff)
    .map((c) => ({ id: c.id, name: c.name }));

  // 도감 상세 "후기 작성하기"에서 넘어온 사전 태깅·카테고리(?item=type:slug&category=review).
  const item = parseItemRef(sp.item ?? "");
  const presetCategory = sp.category
    ? all.find((c) => c.slug === sp.category && (!c.admin_only || isStaff))?.id
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">글쓰기</h1>
        <Link href="/community" className="text-sm text-muted hover:text-foreground">
          ← 목록
        </Link>
      </div>
      <PostForm
        action={createPost}
        categories={categories}
        initial={{
          item: item ? `${item.type}:${item.slug}` : undefined,
          category_id: presetCategory,
        }}
      />
    </div>
  );
}
