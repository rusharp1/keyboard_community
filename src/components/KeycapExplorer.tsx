"use client";

import { useMemo, useState } from "react";
import { keycaps, getMakers } from "@/data/keycaps";
import KeycapCard from "./KeycapCard";

export default function KeycapExplorer() {
  const [query, setQuery] = useState("");
  const [maker, setMaker] = useState<string>("all");

  const makers = useMemo(() => getMakers(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keycaps.filter((k) => {
      if (maker !== "all" && k.maker !== maker) return false;
      if (!q) return true;
      return (
        k.nameKo.toLowerCase().includes(q) ||
        (k.nameEn?.toLowerCase().includes(q) ?? false) ||
        k.theme.toLowerCase().includes(q) ||
        (k.maker?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, maker]);

  return (
    <div>
      {/* 검색 */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="키캡 이름, 테마, 제조사로 검색 (예: 딸기케이크, JTK, 고양이)"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />

      {/* 제조사 필터 */}
      {makers.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterChip active={maker === "all"} onClick={() => setMaker("all")}>
            전체
          </FilterChip>
          {makers.map((m) => (
            <FilterChip
              key={m}
              active={maker === m}
              onClick={() => setMaker(m)}
            >
              {m}
            </FilterChip>
          ))}
        </div>
      )}

      {/* 결과 */}
      <p className="mt-4 text-sm text-muted">{filtered.length}개의 키캡</p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">조건에 맞는 키캡이 없습니다.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((kc) => (
            <KeycapCard key={kc.slug} kc={kc} />
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
      {children}
    </button>
  );
}
