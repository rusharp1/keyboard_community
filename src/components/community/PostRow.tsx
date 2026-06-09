import Link from "next/link";
import AuthorBadge from "./AuthorBadge";
import { formatDate } from "@/lib/community/format";
import type { PostListItem } from "@/lib/community/types";

// 목록의 글 한 줄.
export default function PostRow({
  post,
  categoryName,
}: {
  post: PostListItem;
  categoryName?: string;
}) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="block rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/60"
    >
      <div className="flex items-center gap-2 text-xs text-muted">
        {post.pinned && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
            공지
          </span>
        )}
        {categoryName && <span>{categoryName}</span>}
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
      </div>

      <div className="mt-1 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{post.title}</h3>
          {post.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {post.tags.map((t) => (
                <span key={t} className="text-xs text-muted">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        {post.images.length > 0 && (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.images[0]}
              alt=""
              className="h-14 w-14 rounded-md border border-border object-cover"
            />
            {post.images.length > 1 && (
              <span className="absolute bottom-0 right-0 rounded-tl bg-background/80 px-1 text-[10px] text-muted">
                +{post.images.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <AuthorBadge author={post.author} />
        <div className="flex items-center gap-3">
          <span>♥ {post.like_count}</span>
          <span>💬 {post.comment_count}</span>
          <span>👁 {post.view_count}</span>
        </div>
      </div>
    </Link>
  );
}
