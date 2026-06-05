import Link from "next/link";
import { switches, SWITCH_TYPE_META, type SwitchType } from "@/data/switches";
import SwitchCard from "@/components/SwitchCard";

const types = Object.keys(SWITCH_TYPE_META) as SwitchType[];

export default function Home() {
  const featured = switches.slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-16 sm:py-20">
        <p className="mb-3 text-sm font-medium text-accent">
          기계식 키보드 커뮤니티
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          축의 이름·색상·특성을 한눈에,
          <br />
          타건음은 귀로 직접.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          적축·갈축·청축·저소음까지 — 각 축의 스펙과 키감을 정리하고, 유튜브와
          인스타그램 해시태그로 실제 타건음을 들어볼 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/switches"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            축 도감 둘러보기
          </Link>
          <Link
            href="/community"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-medium transition-colors hover:bg-surface-2"
          >
            커뮤니티
          </Link>
        </div>
      </section>

      {/* 축 종류 소개 */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {types.map((t) => {
          const meta = SWITCH_TYPE_META[t];
          return (
            <Link
              key={t}
              href={`/switches?type=${t}`}
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
              <p className="mt-2 text-sm text-muted line-clamp-3">{meta.desc}</p>
            </Link>
          );
        })}
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
    </div>
  );
}
