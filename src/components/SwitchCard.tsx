import Link from "next/link";
import { type Keyswitch } from "@/data/switches";
import TypeBadge, { SilentBadge, MagneticBadge } from "./TypeBadge";
import RatingBadge from "./reviews/RatingBadge";
import type { ReviewStats } from "@/lib/community/types";

export default function SwitchCard({
  sw,
  rating,
}: {
  sw: Keyswitch;
  rating?: ReviewStats;
}) {
  const stats = [
    sw.actuationForce != null && `작동 ${sw.actuationForce}g`,
    sw.bottomOutForce != null && `바닥 ${sw.bottomOutForce}g`,
    sw.totalTravel != null && `${sw.totalTravel}mm`,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/switches/${sw.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-2"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{
            backgroundColor: sw.colorHex ?? "var(--surface-2)",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">{sw.nameKo}</div>
          {sw.nameEn && <div className="text-xs text-muted">{sw.nameEn}</div>}
        </div>
        <RatingBadge stats={rating} className="shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <TypeBadge type={sw.type} />
        {sw.magnetic && <MagneticBadge />}
        {sw.silent && <SilentBadge />}
      </div>

      {sw.feelSummary && (
        <p className="text-sm text-muted line-clamp-2">{sw.feelSummary}</p>
      )}

      {stats.length > 0 && (
        <div className="mt-auto flex items-center gap-4 text-xs text-muted">
          {stats.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
