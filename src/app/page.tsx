import Link from "next/link";
import {
  switches,
  SWITCH_TYPE_META,
  SILENT_META,
  MAGNETIC_META,
  type SwitchType,
} from "@/data/switches";
import { keycaps } from "@/data/keycaps";
import { keyboards } from "@/data/keyboards";
import SwitchCard from "@/components/SwitchCard";
import KeycapCard from "@/components/KeycapCard";
import KeyboardCard from "@/components/KeyboardCard";

const types = Object.keys(SWITCH_TYPE_META) as SwitchType[];

// 종류 카드: 방식 3종 + 별개 속성인 저소음(저소음만 필터로 이동)
const categoryCards = [
  ...types.map((t) => ({
    href: `/switches?type=${t}`,
    ...SWITCH_TYPE_META[t],
  })),
  { href: "/switches?silent=1", ...SILENT_META },
  { href: "/switches?magnetic=1", ...MAGNETIC_META },
];

export default function Home() {
  const featured = switches.slice(0, 6);
  const featuredKeycaps = keycaps.slice(0, 6);
  const featuredKeyboards = keyboards.slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-16 sm:py-20">
        <p className="mb-3 text-sm font-medium text-accent">
          기계식 키보드 커뮤니티
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          키보드·축·키캡을 한눈에,
          <br />
          내게 맞는 키보드 찾기.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          완성형 키보드부터 축·키캡까지 — 배열·스위치·색감으로 모아 보고,
          유튜브 리뷰·타건음으로 확인하세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/keyboards"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            키보드 도감 둘러보기
          </Link>
          <Link
            href="/switches"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-medium transition-colors hover:bg-surface-2"
          >
            축 도감
          </Link>
          <Link
            href="/keycaps"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-medium transition-colors hover:bg-surface-2"
          >
            키캡 도감
          </Link>
          <Link
            href="/community"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-medium transition-colors hover:bg-surface-2"
          >
            커뮤니티
          </Link>
        </div>
      </section>

      {/* 추천 키보드 */}
      <section className="mt-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">키보드 둘러보기</h2>
          <Link href="/keyboards" className="text-sm text-muted hover:text-foreground">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredKeyboards.map((kb) => (
            <KeyboardCard key={kb.slug} kb={kb} />
          ))}
        </div>
      </section>

      {/* 축 종류 소개 (1행: 방식 3종, 2행: 저소음·자석축) */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">축 종류로 찾기</h2>
          <Link href="/switches" className="text-sm text-muted hover:text-foreground">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {categoryCards.map((meta) => (
            <Link
              key={meta.href}
              href={meta.href}
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.accent }}
                />
                <span className="font-semibold">{meta.labelKo}</span>
                <span className="text-xs text-muted">{meta.labelEn}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted line-clamp-3">
                {meta.desc.replace("축. ", "축.\n")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 축 */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">대표 축</h2>
          <Link href="/switches" className="text-sm text-muted hover:text-foreground">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((sw) => (
            <SwitchCard key={sw.slug} sw={sw} />
          ))}
        </div>
      </section>

      {/* 추천 키캡 */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">키캡 둘러보기</h2>
          <Link href="/keycaps" className="text-sm text-muted hover:text-foreground">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredKeycaps.map((kc) => (
            <KeycapCard key={kc.slug} kc={kc} />
          ))}
        </div>
      </section>

      {/* 커뮤니티 */}
      <section className="mt-12 mb-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">커뮤니티</h2>
        </div>
        <Link
          href="/community"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60 hover:bg-surface-2"
        >
          <span>
            <span className="font-medium">키보드 이야기를 나눠보세요</span>
            <span className="block text-sm text-muted">
              빌드 자랑·질문·정보 공유 공간 (준비 중)
            </span>
          </span>
          <span aria-hidden className="text-muted">
            →
          </span>
        </Link>
      </section>
    </div>
  );
}
