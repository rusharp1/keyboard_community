import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
import ViewTracker from "@/components/community/ViewTracker";
import ReportButton from "@/components/community/ReportButton";
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

// 이전 페이지 경로를 referer로 추정. 같은 호스트일 때만 사용(오픈 리다이렉트 방지),
// 자기 자신이면 루프 방지로 목록으로. 그 외엔 커뮤니티 목록으로 폴백.
async function backUrl(id: string): Promise<string> {
  const h = await headers();
  const referer = h.get("referer");
  const host = h.get("host");
  if (referer && host) {
    try {
      const u = new URL(referer);
      if (u.host === host && u.pathname !== `/community/${id}`) {
        return u.pathname + u.search;
      }
    } catch {
      // 잘못된 referer는 무시.
    }
  }
  return "/community";
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  // 삭제됐거나(또는 숨김글에 권한 없는 접근) 글이 없으면 404 대신 이전 페이지로.
  if (!post) redirect(await backUrl(id));

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
  const canReport = !!user && user.id !== post.user_id;

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

      {post.is_hidden && (
        <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          신고 누적으로 숨김 처리된 글입니다. 작성자와 운영진에게만 보입니다.
        </p>
      )}

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

      {post.images.length > 0 && (
        <div className="mt-6 space-y-3">
          {post.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="w-full rounded-lg border border-border"
            />
          ))}
        </div>
      )}

      <ViewTracker postId={post.id} />

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

      {canReport && (
        <div className="mt-3 text-right">
          <ReportButton targetType="post" targetId={post.id} />
        </div>
      )}

      <CommentSection
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        isStaff={isStaff}
      />
    </article>
  );
}
