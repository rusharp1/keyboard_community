import Link from "next/link";
import { type Keyboard } from "@/data/keyboards";

export default function KeyboardCard({ kb }: { kb: Keyboard }) {
  const chips = [
    kb.layout,
    kb.connections[0],
    kb.switchKind,
    kb.material,
  ].filter(Boolean) as string[];

  const switchCount = kb.availableSwitchSlugs?.length ?? 0;
  const firstHex = kb.colors[0]?.hex ?? "var(--surface-2)";

  return (
    <Link
      href={`/keyboards/${kb.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-2"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: firstHex }}
        />
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{kb.nameKo}</div>
          {kb.nameEn && <div className="text-xs text-muted">{kb.nameEn}</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted"
          >
            {c}
          </span>
        ))}
        {kb.hotswap && (
          <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium">
            핫스왑
          </span>
        )}
        {kb.hasLCD && (
          <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium">
            LCD
          </span>
        )}
      </div>

      {/* 색상 스와치 + 축 옵션 수 */}
      {(kb.colors.length > 0 || switchCount > 0) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {kb.colors.slice(0, 6).map((c) => (
              <span
                key={c.name}
                title={c.name + (c.upcoming ? " (출시예정)" : "")}
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          {switchCount > 0 && (
            <span className="shrink-0 text-xs text-muted">축 {switchCount}종</span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted">
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5">
          {kb.brand}
        </span>
        {kb.priceFromKrw != null && (
          <span className="font-medium text-foreground">
            약 {kb.priceFromKrw.toLocaleString("ko-KR")}원부터
          </span>
        )}
      </div>
    </Link>
  );
}
