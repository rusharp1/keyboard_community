import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSwitchBySlug,
  getAllSlugs,
  youtubeSearchUrl,
  instagramTagUrl,
  naverShopSearchUrl,
  SWITCH_TYPE_META,
} from "@/data/switches";
import TypeBadge, { SilentBadge, MagneticBadge } from "@/components/TypeBadge";
import ReviewSection from "@/components/reviews/ReviewSection";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sw = getSwitchBySlug(slug);
  if (!sw) return { title: "축을 찾을 수 없음" };
  const desc =
    sw.feelSummary ??
    sw.soundProfile ??
    `${SWITCH_TYPE_META[sw.type].labelKo} 스위치`;
  return {
    title: `${sw.nameKo}${sw.nameEn ? ` (${sw.nameEn})` : ""} — 키보드 커뮤니티`,
    description: desc,
  };
}

export default async function SwitchDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sw = getSwitchBySlug(slug);
  if (!sw) notFound();

  const typeMeta = SWITCH_TYPE_META[sw.type];
  const tags: string[] = [];
  if (sw.magnetic) tags.push("자석축");
  if (sw.silent) tags.push("저소음");

  const specs = [
    {
      label: "종류",
      value:
        `${typeMeta.labelKo} (${typeMeta.labelEn})` +
        (tags.length ? ` · ${tags.join(" · ")}` : ""),
    },
    { label: "제조사", value: sw.brand },
    sw.color && { label: "색상", value: sw.color },
    sw.actuationForce != null && {
      label: "작동 압력",
      value: `${sw.actuationForce} g`,
    },
    sw.bottomOutForce != null && {
      label: "바닥압",
      value: `${sw.bottomOutForce} g`,
    },
    sw.totalTravel != null && {
      label: "총 이동거리",
      value: `${sw.totalTravel} mm`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const hasYoutube = (sw.youtubeVideoIds?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/switches" className="text-sm text-muted hover:text-foreground">
        ← 축 도감으로
      </Link>

      {/* 헤더 */}
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="h-14 w-14 shrink-0 rounded-xl border border-border"
          style={{ backgroundColor: sw.colorHex ?? "var(--surface-2)" }}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{sw.nameKo}</h1>
            <TypeBadge type={sw.type} />
            {sw.magnetic && <MagneticBadge />}
            {sw.silent && <SilentBadge />}
          </div>
          {sw.nameEn && <p className="text-muted">{sw.nameEn}</p>}
        </div>
      </div>

      {sw.description && <p className="mt-6 leading-relaxed">{sw.description}</p>}

      {sw.needsInfo && (
        <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
          ℹ️ 신생/니치 축이라 공개 스펙이 제한적입니다. 일부 정보는 추정이거나
          비어 있을 수 있어요. 정확한 압력·키감을 알려주시면 채워 넣을게요.
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

      {/* 키감 / 소리 요약 */}
      {(sw.feelSummary || sw.soundProfile) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sw.feelSummary && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-muted">키감</div>
              <div className="mt-1">{sw.feelSummary}</div>
            </div>
          )}
          {sw.soundProfile && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-muted">소리 성향</div>
              <div className="mt-1">{sw.soundProfile}</div>
            </div>
          )}
        </div>
      )}

      {/* 타건음 듣기 */}
      <h2 className="mt-8 mb-3 text-lg font-bold">🔊 타건음 들어보기</h2>

      {hasYoutube ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sw.youtubeVideoIds!.map((id) => (
            <div
              key={id}
              className="aspect-video overflow-hidden rounded-xl border border-border"
            >
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={`${sw.nameKo} 타건음`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      ) : (
        <a
          href={youtubeSearchUrl(sw)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span>
            <span className="font-medium">유튜브에서 타건음 검색</span>
            <span className="block text-sm text-muted">
              “{sw.nameEn ?? sw.nameKo} sound test” 결과 보기
            </span>
          </span>
          <span aria-hidden className="text-muted">
            ↗
          </span>
        </a>
      )}

      {/* 네이버 검색 링크 (구매처·정보·사진) — 모든 축에 표시 */}
      <a
        href={naverShopSearchUrl(sw.nameKo)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
      >
        <span>
          <span className="font-medium">네이버에서 구매처·정보 보기</span>
          <span className="block text-sm text-muted">
            “{sw.nameKo} 스위치” 쇼핑 검색
          </span>
        </span>
        <span aria-hidden className="text-muted">
          ↗
        </span>
      </a>

      {/* 인스타그램 해시태그 */}
      <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">
        인스타그램 해시태그
      </h3>
      <div className="flex flex-wrap gap-2">
        {sw.instagramTags.map((tag) => (
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

      <p className="mt-6 text-xs text-muted">
        ※ 타건음은 키캡·보강판·기판 등 환경에 따라 크게 달라질 수 있습니다.
      </p>

      <ReviewSection itemType="switch" slug={sw.slug} />
    </div>
  );
}
