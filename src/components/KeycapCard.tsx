import Link from "next/link";
import { type Keycap } from "@/data/keycaps";

export default function KeycapCard({ kc }: { kc: Keycap }) {
  return (
    <Link
      href={`/keycaps/${kc.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-2"
    >
      {/* 색 미리보기 바 */}
      <div className="flex h-16 overflow-hidden rounded-lg border border-border">
        {kc.palette.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="flex-1"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold leading-tight">{kc.nameKo}</div>
          {kc.nameEn && <div className="text-xs text-muted">{kc.nameEn}</div>}
        </div>
        {kc.maker && (
          <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted">
            {kc.maker}
          </span>
        )}
      </div>

      <p className="text-sm text-muted line-clamp-2">{kc.theme}</p>
    </Link>
  );
}
