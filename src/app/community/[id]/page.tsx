import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCategories,
  getComments,
  getPost,
  hasLiked,
} from "@/lib/community/queries";
import { deletePost } from "@/app/community/actions";
import AuthorBadge from "@/components/community/AuthorBadge";
import LikeButton from "@/components/community/LikeButton";
import CommentSection from "@/components/community/CommentSection";
import ConfirmSubmitButton from "@/components/community/ConfirmSubmitButton";
import { formatDate } from "@/lib/community/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post ? `${post.title} — 커뮤니티` : "글을 찾을 수 없음" };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  let liked = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isStaff = prof?.role === "admin" || prof?.role === "moderator";
    liked = await hasLiked(id, user.id);
  }
  const canEdit = !!user && (user.id === post.user_id || isStaff);

  const categories = await getCategories();
  const categoryName = categories.find((c) => c.id === post.category_id)?.name;
  const comments = await getComments(id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/community" className="text-sm text-muted hover:text-foreground">
        ← 목록
      </Link>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        {post.pinned && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
            공지
          </span>
        )}
        {categoryName && <span>{categoryName}</span>}
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
      </div>

      <h1 className="mt-1 break-words text-2xl font-bold text-foreground">
        {post.title}
      </h1>

      <div className="mt-3 flex items-center justify-between">
        <AuthorBadge author={post.author} />
        {canEdit && (
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/community/${post.id}/edit`}
              className="text-muted hover:text-foreground"
            >
              수정
            </Link>
            <form action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <ConfirmSubmitButton
                message="이 글을 삭제하시겠습니까?"
                className="text-muted hover:text-accent"
              >
                삭제
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </div>

      {post.body.trim() && (
        <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
          {post.body}
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <LikeButton postId={post.id} liked={liked} count={post.like_count} />
        <span className="text-sm text-muted">👁 {post.view_count}</span>
      </div>

      <CommentSection
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        isStaff={isStaff}
      />
    </article>
  );
}
