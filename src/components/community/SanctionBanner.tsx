import { formatDate } from "@/lib/community/format";

type Penalty = {
  points: number;
  memo: string | null;
  created_at: string;
  post_id: string | null;
};

// 제재 상태 안내 배너(마이페이지·글쓰기 차단 화면). 받을 게 없으면 렌더 안 함.
export default function SanctionBanner({
  penaltyPoints,
  suspendedUntil,
  isBanned,
  penalties = [],
}: {
  penaltyPoints: number;
  suspendedUntil: string | null;
  isBanned: boolean;
  penalties?: Penalty[];
}) {
  const suspendedActive =
    suspendedUntil != null && new Date(suspendedUntil).getTime() > Date.now();
  if (!isBanned && !suspendedActive && penaltyPoints <= 0) return null;

  const tone = isBanned || suspendedActive ? "danger" : "warn";
  const headline = isBanned
    ? "영구 이용정지 상태입니다"
    : suspendedActive
      ? `활동정지 중 — ${suspendedUntilLabel(suspendedUntil!)}`
      : `누적 벌점 ${penaltyPoints}점`;
  const body = isBanned
    ? "글·댓글·좋아요 등 모든 작성 활동이 차단됩니다. 이의가 있으면 운영진에게 문의하세요."
    : suspendedActive
      ? "정지 기간 동안 글·댓글·좋아요 등 작성 활동이 차단됩니다. 읽기는 가능합니다."
      : "신고 누적·운영진 판단으로 벌점이 부과되었습니다. 5점부터 활동이 정지됩니다.";

  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
        tone === "danger"
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-amber-500/40 bg-amber-500/10 text-amber-200"
      }`}
    >
      <p className="font-semibold">{headline}</p>
      <p className="mt-1 opacity-90">{body}</p>
      {penalties.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs opacity-90">
          {penalties.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="font-medium">+{p.points}점</span>
              <span>{formatDate(p.created_at)}</span>
              {p.memo && <span className="opacity-80">— {p.memo}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function suspendedUntilLabel(iso: string): string {
  const until = new Date(iso);
  const days = Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000));
  return `${until.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })}까지 (약 ${days}일 남음)`;
}
