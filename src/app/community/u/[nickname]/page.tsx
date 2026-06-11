import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getActivitySummary,
  getCategories,
  getProfileByNickname,
  getUserPosts,
} from "@/lib/community/queries";
import { levelFor, ROLE_LABEL } from "@/lib/community/types";
import PostRow from "@/components/community/PostRow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string }>;
}): Promise<Metadata> {
  const { nickname } = await params;
  return { title: `${decodeURIComponent(nickname)} — 커뮤니티` };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname: raw } = await params;
  const nickname = decodeURIComponent(raw);
  const profile = await getProfileByNickname(nickname);
  // 없는 유저면 목록으로(404 대신).
  if (!profile) redirect("/community");

  const [summary, posts, categories] = await Promise.all([
    getActivitySummary(profile.id),
    getUserPosts(profile.id),
    getCategories(),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const level = levelFor(profile.activity_score);
  const role = ROLE_LABEL[profile.role];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/community" className="text-sm text-muted hover:text-foreground">
        ← 커뮤니티
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">{profile.nickname}</h1>
        <span
          className="text-sm text-muted"
          title={`활동점수 ${profile.activity_score}`}
        >
          {level.emoji}
          {level.name}
        </span>
        {role && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
            {role}
          </span>
        )}
      </div>

      {/* 활동 요약 */}
      <dl className="mt-4 flex gap-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
        <div>
          <dt className="text-muted">글</dt>
          <dd className="font-semibold text-foreground">{summary.posts}</dd>
        </div>
        <div>
          <dt className="text-muted">댓글</dt>
          <dd className="font-semibold text-foreground">{summary.comments}</dd>
        </div>
        <div>
          <dt className="text-muted">받은 좋아요</dt>
          <dd className="font-semibold text-foreground">{summary.receivedLikes}</dd>
        </div>
      </dl>

      <h2 className="mt-6 text-sm font-semibold text-foreground">작성한 글</h2>
      <div className="mt-2 space-y-2">
        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
            아직 작성한 글이 없어요.
          </p>
        ) : (
          posts.map((p) => (
            <PostRow key={p.id} post={p} categoryName={catName.get(p.category_id)} />
          ))
        )}
      </div>
    </div>
  );
}
