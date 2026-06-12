"use client";

import { useMemo, useState } from "react";
import {
  switches,
  getBrands,
  SWITCH_TYPE_META,
  SILENT_META,
  MAGNETIC_META,
  type SwitchType,
} from "@/data/switches";
import SwitchCard from "./SwitchCard";
import SearchableSelect from "./SearchableSelect";
import type { ReviewStats } from "@/lib/community/types";

const types = Object.keys(SWITCH_TYPE_META) as SwitchType[];

export default function SwitchExplorer({
  initialType,
  initialSilent = false,
  initialMagnetic = false,
  statsBySlug = {},
}: {
  initialType?: SwitchType;
  initialSilent?: boolean;
  initialMagnetic?: boolean;
  statsBySlug?: Record<string, ReviewStats>;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SwitchType | "all">(initialType ?? "all");
  const [silentOnly, setSilentOnly] = useState(initialSilent);
  const [magneticOnly, setMagneticOnly] = useState(initialMagnetic);
  const [brand, setBrand] = useState<string>("all");
  const [sort, setSort] = useState<"default" | "rating">("default");

  const brands = useMemo(() => getBrands(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = switches.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (silentOnly && !s.silent) return false;
      if (magneticOnly && !s.magnetic) return false;
      if (brand !== "all" && s.brand !== brand) return false;
      if (!q) return true;
      return (
        s.nameKo.toLowerCase().includes(q) ||
        (s.nameEn?.toLowerCase().includes(q) ?? false) ||
        s.brand.toLowerCase().includes(q) ||
        (s.color?.toLowerCase().includes(q) ?? false)
      );
    });
    if (sort === "rating") {
      // 평점순: 종합 평점 desc, 리뷰 없는 항목은 뒤로.
      return [...list].sort(
        (a, b) =>
          (statsBySlug[b.slug]?.overall ?? -1) - (statsBySlug[a.slug]?.overall ?? -1),
      );
    }
    return list;
  }, [query, type, silentOnly, magneticOnly, brand, sort, statsBySlug]);

  return (
    <div>
      {/* 검색 */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="축 이름, 제조사, 색상으로 검색 (예: 적축, Gateron, 레드)"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />

      {/* 종류 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChip active={type === "all"} onClick={() => setType("all")}>
          전체
        </FilterChip>
        {types.map((t) => (
          <FilterChip
            key={t}
            active={type === t}
            onClick={() => setType(t)}
            dot={SWITCH_TYPE_META[t].accent}
          >
            {SWITCH_TYPE_META[t].labelKo}
          </FilterChip>
        ))}

        {/* 저소음·자석축 토글 (방식과 별개 속성) */}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        <FilterChip
          active={silentOnly}
          onClick={() => setSilentOnly((v) => !v)}
          dot={SILENT_META.accent}
        >
          저소음
        </FilterChip>
        <FilterChip
          active={magneticOnly}
          onClick={() => setMagneticOnly((v) => !v)}
          dot={MAGNETIC_META.accent}
        >
          자석축
        </FilterChip>

        {/* 정렬 + 제조사 필터 */}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "default" | "rating")}
            aria-label="정렬"
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-muted outline-none focus:border-accent"
          >
            <option value="default">기본순</option>
            <option value="rating">평점순</option>
          </select>
          <SearchableSelect
            value={brand}
            onChange={setBrand}
            options={brands}
            allLabel="모든 제조사"
            searchPlaceholder="제조사 검색..."
            align="right"
          />
        </div>
      </div>

      {/* 결과 */}
      <p className="mt-4 text-sm text-muted">{filtered.length}개의 축</p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          조건에 맞는 축이 없습니다.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sw) => (
            <SwitchCard key={sw.slug} sw={sw} rating={statsBySlug[sw.slug]} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/15 text-foreground"
          : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      )}
      {children}
    </button>
  );
}
