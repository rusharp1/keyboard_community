import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getKeyboardBySlug,
  getAllKeyboardSlugs,
  getKeyboardSwitches,
  naverShopSearchUrl,
  youtubeReviewUrl,
  instagramTagUrl,
} from "@/data/keyboards";

export function generateStaticParams() {
  return getAllKeyboardSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kb = getKeyboardBySlug(slug);
  if (!kb) return { title: "키보드를 찾을 수 없음" };
  return {
    title: `${kb.nameKo}${kb.nameEn ? ` (${kb.nameEn})` : ""} — 키보드 커뮤니티`,
    description: `${kb.brand} · ${kb.layout} · ${kb.connections.join("/")}. ${kb.description ?? ""}`.trim(),
  };
}

export default async function KeyboardDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kb = getKeyboardBySlug(slug);
  if (!kb) notFound();

  const switchList = getKeyboardSwitches(kb);

  const specs = [
    { label: "브랜드", value: kb.brand },
    { label: "배열", value: kb.layout },
    { label: "연결", value: kb.connections.join(" / ") },
    { label: "종류", value: kb.switchKind },
    { label: "핫스왑", value: kb.hotswap ? "지원" : "미지원" },
    kb.hasLCD && { label: "디스플레이", value: "LCD 탑재" },
    { label: "재질", value: kb.material },
    kb.priceFromKrw != null && {
      label: "가격(대략)",
      value: `약 ${kb.priceFromKrw.toLocaleString("ko-KR")}원부터`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/keyboards" className="text-sm text-muted hover:text-foreground">
        ← 키보드 도감으로
      </Link>

      {/* 헤더 */}
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="h-14 w-14 shrink-0 rounded-xl border border-border"
          style={{ backgroundColor: kb.colors[0]?.hex ?? "var(--surface-2)" }}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{kb.nameKo}</h1>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {kb.brand}
            </span>
          </div>
          {kb.nameEn && <p className="text-muted">{kb.nameEn}</p>}
        </div>
      </div>

      {kb.description && <p className="mt-6 leading-relaxed">{kb.description}</p>}

      {kb.needsInfo && (
        <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
          ℹ️ 리비전·판매처에 따라 스펙이 달라질 수 있어 일부 정보는 추정입니다. 정확한
          스펙을 알려주시면 채워 넣을게요.
        </p>
      )}

      {/* 스펙 */}
      <h2 className="mt-8 mb-3 text-lg font-bold">스펙</h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {specs.map((s) => (
          <div key={s.label} className="bg-surface p-3">
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="mt-0.5 font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* 색상 옵션 */}
      {kb.colors.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold">색상 옵션</h2>
          <div className="flex flex-wrap gap-3">
            {kb.colors.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-6 w-6 rounded-md border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm">
                  {c.name}
                  {c.upcoming && (
                    <span className="ml-1 rounded border border-border bg-surface-2 px-1 py-0.5 text-[10px] text-muted">
                      출시예정
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 제공 축 (축 도감 링크) */}
      {switchList.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold">제공 축</h2>
          <p className="mb-2 text-xs text-muted">
            핫스왑이라 다른 축으로 교체할 수 있어요. 아래는 기본 제공/선택 옵션입니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {switchList.map((sw) => (
              <Link
                key={sw.slug}
                href={`/switches/${sw.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent/60 hover:bg-surface-2"
              >
                {sw.nameKo} ↗
              </Link>
            ))}
          </div>
        </>
      )}

      {/* 구매처 / 리뷰 */}
      <h2 className="mt-8 mb-3 text-lg font-bold">👀 더 알아보기</h2>
      <div className="flex flex-col gap-2">
        {kb.buyUrl && (
          <a
            href={kb.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
          >
            <span>
              <span className="font-medium">{kb.brand} 판매 페이지에서 보기</span>
              <span className="block text-sm text-muted">제품 페이지로 이동</span>
            </span>
            <span aria-hidden className="text-muted">
              ↗
            </span>
          </a>
        )}
        <a
          href={naverShopSearchUrl(kb.nameKo)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span>
            <span className="font-medium">네이버에서 구매처·정보 보기</span>
            <span className="block text-sm text-muted">“{kb.nameKo}” 쇼핑 검색</span>
          </span>
          <span aria-hidden className="text-muted">
            ↗
          </span>
        </a>
        <a
          href={youtubeReviewUrl(kb)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span>
            <span className="font-medium">유튜브에서 리뷰 검색</span>
            <span className="block text-sm text-muted">
              “{kb.nameEn ?? kb.nameKo} 키보드 리뷰” 결과 보기
            </span>
          </span>
          <span aria-hidden className="text-muted">
            ↗
          </span>
        </a>
      </div>

      {/* 인스타그램 해시태그 */}
      {kb.instagramTags && kb.instagramTags.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">
            인스타그램 해시태그
          </h3>
          <div className="flex flex-wrap gap-2">
            {kb.instagramTags.map((tag) => (
              <a
                key={tag}
                href={instagramTagUrl(tag)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent/60 hover:bg-surface-2"
              >
                #{tag}
              </a>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        ※ 가격·스펙은 시점·판매처·리비전에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}
