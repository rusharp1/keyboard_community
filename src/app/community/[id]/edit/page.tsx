import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireWriteAccess } from "@/lib/auth/guards";
import { getPost } from "@/lib/community/queries";
import { updatePost } from "@/app/community/actions";
import PostForm from "@/components/community/PostForm";

export const metadata: Metadata = {
  title: "글 수정 — 커뮤니티",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireWriteAccess();
  const post = await getPost(id);
  if (!post) notFound();

  const isStaff = profile.role !== "user";
  if (post.user_id !== user.id && !isStaff) redirect(`/community/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">글 수정</h1>
        <Link
          href={`/community/${id}`}
          className="text-sm text-muted hover:text-foreground"
        >
          ← 취소
        </Link>
      </div>
      <PostForm
        action={updatePost}
        mode="edit"
        categories={[]}
        initial={{
          id: post.id,
          title: post.title,
          body: post.body,
          tags: post.tags,
          images: post.images,
          item:
            post.item_type && post.item_slug
              ? `${post.item_type}:${post.item_slug}`
              : "",
        }}
      />
    </div>
  );
}
