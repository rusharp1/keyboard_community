import { levelFor, ROLE_LABEL, type Author } from "@/lib/community/types";

// 작성자 표시: 닉네임 + 활동등급(표시 전용) + 운영진 라벨.
export default function AuthorBadge({
  author,
  className = "",
}: {
  author: Author | null;
  className?: string;
}) {
  if (!author)
    return <span className={`text-muted ${className}`}>알 수 없음</span>;

  const level = levelFor(author.activity_score);
  const role = ROLE_LABEL[author.role];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-medium text-foreground">{author.nickname}</span>
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
