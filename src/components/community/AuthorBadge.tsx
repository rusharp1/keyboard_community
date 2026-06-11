import Link from "next/link";
import { levelFor, ROLE_LABEL, type Author } from "@/lib/community/types";

// 작성자 표시: 닉네임 + 활동등급(표시 전용) + 운영진 라벨.
// href가 있으면 닉네임을 공개 프로필 링크로(앵커 밖 영역에서만 사용 — PostRow 내부 X).
export default function AuthorBadge({
  author,
  className = "",
  href,
}: {
  author: Author | null;
  className?: string;
  href?: string;
}) {
  if (!author)
    return <span className={`text-muted ${className}`}>알 수 없음</span>;

  const level = levelFor(author.activity_score);
  const role = ROLE_LABEL[author.role];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {href ? (
        <Link href={href} className="font-medium text-foreground hover:underline">
          {author.nickname}
        </Link>
      ) : (
        <span className="font-medium text-foreground">{author.nickname}</span>
      )}
      <span
        className="text-xs text-muted"
        title={`활동등급: ${level.name} (점수 ${author.activity_score})`}
      >
        {level.emoji}
        {level.name}
      </span>
      {role && (
        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
          {role}
        </span>
      )}
    </span>
  );
}
