import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getKeycapBySlug,
  getAllKeycapSlugs,
  naverShopSearchUrl,
  instagramTagUrl,
} from "@/data/keycaps";
import Palette from "@/components/Palette";

export function generateStaticParams() {
  return getAllKeycapSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kc = getKeycapBySlug(slug);
  if (!kc) return { title: "키캡을 찾을 수 없음" };
  return {
    title: `${kc.nameKo}${kc.nameEn ? ` (${kc.nameEn})` : ""} — 키보드 커뮤니티`,
    description: `${kc.theme}. ${kc.description ?? ""}`.trim(),
  };
}

export default async function KeycapDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kc = getKeycapBySlug(slug);
  if (!kc) notFound();

  const info = [
    kc.maker && { label: "제조사", value: kc.maker },
    kc.profile && { label: "프로파일", value: kc.profile },
    kc.material && { label: "재질", value: kc.material },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/keycaps" className="text-sm text-muted hover:text-foreground">
        ← 키캡 도감으로
      </Link>

      {/* 색 미리보기 */}
      <div className="mt-4 flex h-28 overflow-hidden rounded-2xl border border-border">
        {kc.palette.map((c, i) => (
          <span key={`${c}-${i}`} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      {/* 헤더 */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{kc.nameKo}</h1>
        {kc.maker && (
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
            {kc.maker}
          </span>
        )}
      </div>
      {kc.nameEn && <p className="text-muted">{kc.nameEn}</p>}

      <p className="mt-4 text-lg">{kc.theme}</p>
      {kc.description && (
        <p className="mt-2 leading-relaxed text-muted">{kc.description}</p>
      )}

      {/* 색 팔레트 */}
      <h2 className="mt-8 mb-3 text-lg font-bold">대표 색감</h2>
      <Palette colors={kc.palette} />
      <p className="mt-2 text-xs text-muted">
        ※ 색 팔레트는 테마에서 추정한 참고용입니다. 실제 색은 아래 링크에서 확인하세요.
      </p>

      {/* 정보 */}
      {info.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold">정보</h2>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {info.map((s) => (
              <div key={s.label} className="bg-surface p-3">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="mt-0.5 font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {/* 실제 모습 보기 */}
      <h2 className="mt-8 mb-3 text-lg font-bold">👀 실제 모습 보기</h2>
      <a
        href={naverShopSearchUrl(kc.nameKo)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
      >
        <span>
          <span className="font-medium">네이버에서 구매처·사진 보기</span>
          <span className="block text-sm text-muted">
            “{kc.nameKo} 키캡” 쇼핑 검색
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
        {kc.instagramTags.map((tag) => (
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

      {kc.needsInfo && (
        <p className="mt-6 rounded-lg border border-border bg-surface p-3 text-xs text-muted">
          ℹ️ 이 키캡은 공개 자료가 적어 색감·테마가 추정치예요. 정확한 정보(제조사·프로파일·실제
          색)를 알려주시면 더 정확히 채워 넣을게요.
        </p>
      )}
    </div>
  );
}
