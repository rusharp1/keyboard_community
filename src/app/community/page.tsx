import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBestPosts, getCategories, listPosts } from "@/lib/community/queries";
import PostRow from "@/components/community/PostRow";
import SearchBox from "@/components/community/SearchBox";
import CategorySidebar from "@/components/community/CategorySidebar";

export const metadata: Metadata = {
  title: "커뮤니티 — 키보드 커뮤니티",
};

type SP = { category?: string; sort?: string; q?: string };

// 현재 파라미터를 유지하며 일부만 바꾼 쿼리스트링을 만든다.
function qs(base: SP, patch: Partial<SP>): string {
  const merged = { ...base, ...patch };
  const p = new URLSearchParams();
  if (merged.category) p.set("category", merged.category);
  if (merged.sort) p.set("sort", merged.sort);
  if (merged.q) p.set("q", merged.q);
  const s = p.toString();
  return s ? `/community?${s}` : "/community";
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const categories = await getCategories();
  const activeCat = sp.category
    ? categories.find((c) => c.slug === sp.category)
    : null;
  const sort = sp.sort === "popular" ? "popular" : "latest";
  const posts = await listPosts({
    categoryId: activeCat?.id,
    sort,
    search: sp.q,
  });
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  // 인기글은 필터/검색이 없는 기본 화면에서만 노출.
  const showBest = !sp.q && !activeCat;
  const best = showBest ? await getBestPosts(5) : [];

  // 운영진이면 "운영" 링크 노출.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isStaff = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isStaff = prof?.role === "admin" || prof?.role === "moderator";
  }

  // 카테고리 SNB 링크(현재 정렬/검색 파라미터 유지). 첫 항목은 "전체".
  const catItems = [
    { key: "all", name: "전체", href: qs(sp, { category: undefined }), active: !activeCat },
    ...categories.map((c) => ({
      key: c.slug,
      name: c.name,
      href: qs(sp, { category: c.slug }),
      active: activeCat?.slug === c.slug,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <div className="flex items-center gap-2">
          {isStaff && (
            <Link
              href="/community/admin"
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              운영
            </Link>
          )}
          <Link
            href="/community/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            글쓰기
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-6 md:flex-row">
        {/* 카테고리 SNB */}
        <CategorySidebar items={catItems} />

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          {/* 인기글(Best) */}
          {best.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">🔥 인기글</h2>
              <div className="space-y-2">
                {best.map((p) => (
                  <PostRow
                    key={p.id}
                    post={p}
                    categoryName={catName.get(p.category_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 정렬 + 검색 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 text-sm">
              <Link
                href={qs(sp, { sort: undefined })}
                className={`rounded-md px-2.5 py-1 ${sort === "latest" ? "text-foreground" : "text-muted hover:text-foreground"}`}
              >
                최신순
              </Link>
              <Link
                href={qs(sp, { sort: "popular" })}
                className={`rounded-md px-2.5 py-1 ${sort === "popular" ? "text-foreground" : "text-muted hover:text-foreground"}`}
              >
                인기순
              </Link>
            </div>
            <div className="sm:w-72">
              <SearchBox />
            </div>
          </div>

          {/* 목록 */}
          <div className="mt-4 space-y-2">
            {posts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
                {sp.q ? "검색 결과가 없습니다." : "아직 글이 없습니다. 첫 글을 써보세요!"}
              </p>
            ) : (
              posts.map((p) => (
                <PostRow
                  key={p.id}
                  post={p}
                  categoryName={catName.get(p.category_id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
