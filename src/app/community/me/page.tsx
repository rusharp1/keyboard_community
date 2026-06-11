import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import {
  getBookmarkedPosts,
  getCategories,
  getLikedPosts,
  getMyComments,
  getMyPosts,
} from "@/lib/community/queries";
import { levelFor } from "@/lib/community/types";
import PostRow from "@/components/community/PostRow";
import { formatDate } from "@/lib/community/format";

export const metadata: Metadata = { title: "마이페이지 — 커뮤니티" };

type SP = { tab?: string };
type Tab = "posts" | "comments" | "likes" | "bookmarks";

const TABS: { key: Tab; label: string }[] = [
  { key: "posts", label: "내 글" },
  { key: "comments", label: "내 댓글" },
  { key: "likes", label: "좋아요한 글" },
  { key: "bookmarks", label: "저장" },
];

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { user, profile } = await requireProfile();
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "comments"
      ? "comments"
      : sp.tab === "likes"
        ? "likes"
        : sp.tab === "bookmarks"
          ? "bookmarks"
          : "posts";
  const level = levelFor(profile.activity_score);

  // 활성 탭만 조회.
  const [posts, comments, liked, bookmarks, categories] = await Promise.all([
    tab === "posts" ? getMyPosts(user.id) : Promise.resolve([]),
    tab === "comments" ? getMyComments(user.id) : Promise.resolve([]),
    tab === "likes" ? getLikedPosts(user.id) : Promise.resolve([]),
    tab === "bookmarks" ? getBookmarkedPosts(user.id) : Promise.resolve([]),
    getCategories(),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted hover:bg-surface hover:text-foreground"
    }`;

  const emptyText =
    tab === "posts"
      ? "아직 작성한 글이 없어요."
      : tab === "comments"
        ? "아직 작성한 댓글이 없어요."
        : tab === "likes"
          ? "아직 좋아요한 글이 없어요."
          : "아직 저장한 글이 없어요.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/community" className="text-sm text-muted hover:text-foreground">
        ← 커뮤니티
      </Link>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">마이페이지</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="font-medium text-foreground">{profile.nickname}</span>
            <span title={`활동점수 ${profile.activity_score}`}>
              {level.emoji}
              {level.name}
            </span>
          </div>
        </div>
        <Link
          href="/community/settings"
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          알림 설정
        </Link>
      </div>

      <nav className="mt-5 flex gap-1">
        {TABS.map((t) => (
          <Link key={t.key} href={`/community/me?tab=${t.key}`} className={tabClass(t.key === tab)}>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 space-y-2">
        {/* 내 글 */}
        {tab === "posts" &&
          (posts.length === 0 ? (
            <Empty text={emptyText} />
          ) : (
            posts.map((p) => (
              <div key={p.id} className="relative">
                {p.is_hidden && (
                  <span className="absolute right-3 top-3 z-10 rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                    숨김
                  </span>
                )}
                <PostRow post={p} categoryName={catName.get(p.category_id)} />
              </div>
            ))
          ))}

        {/* 내 댓글 */}
        {tab === "comments" &&
          (comments.length === 0 ? (
            <Empty text={emptyText} />
          ) : (
            comments.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.post_id}`}
                className="block rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/60"
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="truncate">{c.post_title ?? "(삭제된 글)"}</span>
                  <span>·</span>
                  <span className="shrink-0">{formatDate(c.created_at)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">
                  {c.is_hidden ? "🚫 신고 누적으로 숨김 처리된 댓글입니다." : c.body}
                </p>
                {c.like_count > 0 && (
                  <span className="mt-1 inline-block text-xs text-muted">♥ {c.like_count}</span>
                )}
              </Link>
            ))
          ))}

        {/* 좋아요한 글 */}
        {tab === "likes" &&
          (liked.length === 0 ? (
            <Empty text={emptyText} />
          ) : (
            liked.map((p) => (
              <PostRow key={p.id} post={p} categoryName={catName.get(p.category_id)} />
            ))
          ))}

        {/* 저장한 글(북마크) */}
        {tab === "bookmarks" &&
          (bookmarks.length === 0 ? (
            <Empty text={emptyText} />
          ) : (
            bookmarks.map((p) => (
              <PostRow key={p.id} post={p} categoryName={catName.get(p.category_id)} />
            ))
          ))}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
      {text}
    </p>
  );
}
