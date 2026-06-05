"use client";

import { useMemo, useState } from "react";
import {
  switches,
  getBrands,
  SWITCH_TYPE_META,
  type SwitchType,
} from "@/data/switches";
import SwitchCard from "./SwitchCard";

const types = Object.keys(SWITCH_TYPE_META) as SwitchType[];

export default function SwitchExplorer({
  initialType,
}: {
  initialType?: SwitchType;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SwitchType | "all">(initialType ?? "all");
  const [brand, setBrand] = useState<string>("all");

  const brands = useMemo(() => getBrands(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return switches.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (brand !== "all" && s.brand !== brand) return false;
      if (!q) return true;
      return (
        s.nameKo.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q)
      );
    });
  }, [query, type, brand]);

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

        {/* 제조사 필터 */}
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="ml-auto rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        >
          <option value="all">모든 제조사</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
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
            <SwitchCard key={sw.slug} sw={sw} />
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
