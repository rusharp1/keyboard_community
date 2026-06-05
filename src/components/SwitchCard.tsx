import Link from "next/link";
import { type Keyswitch } from "@/data/switches";
import TypeBadge, { SilentBadge } from "./TypeBadge";

export default function SwitchCard({ sw }: { sw: Keyswitch }) {
  return (
    <Link
      href={`/switches/${sw.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-9 w-9 shrink-0 rounded-lg border border-border"
            style={{ backgroundColor: sw.colorHex }}
          />
          <div>
            <div className="font-semibold leading-tight">{sw.nameKo}</div>
            <div className="text-xs text-muted">{sw.nameEn}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <TypeBadge type={sw.type} />
          {sw.silent && <SilentBadge />}
        </div>
      </div>

      <p className="text-sm text-muted line-clamp-2">{sw.feelSummary}</p>

      <div className="mt-auto flex items-center gap-4 text-xs text-muted">
        <span>작동 {sw.actuationForce}g</span>
        <span>바닥 {sw.bottomOutForce}g</span>
        <span>{sw.totalTravel}mm</span>
      </div>
    </Link>
  );
}
