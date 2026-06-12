"use client";

import { useMemo, useState } from "react";
import {
  keycaps,
  getMakers,
  getProfiles,
  getMaterials,
} from "@/data/keycaps";
import KeycapCard from "./KeycapCard";
import SearchableSelect from "./SearchableSelect";
import type { ReviewStats } from "@/lib/community/types";

export default function KeycapExplorer({
  statsBySlug = {},
}: {
  statsBySlug?: Record<string, ReviewStats>;
}) {
  const [query, setQuery] = useState("");
  const [maker, setMaker] = useState<string>("all");
  const [profile, setProfile] = useState<string>("all");
  const [material, setMaterial] = useState<string>("all");
  const [sort, setSort] = useState<"default" | "rating">("default");

  const makers = useMemo(() => getMakers(), []);
  const profiles = useMemo(() => getProfiles(), []);
  const materials = useMemo(() => getMaterials(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = keycaps.filter((k) => {
      if (maker !== "all" && k.maker !== maker) return false;
      if (profile !== "all" && k.profile !== profile) return false;
      if (material !== "all" && k.material !== material) return false;
      if (!q) return true;
      return (
        k.nameKo.toLowerCase().includes(q) ||
        (k.nameEn?.toLowerCase().includes(q) ?? false) ||
        k.theme.toLowerCase().includes(q) ||
        (k.maker?.toLowerCase().includes(q) ?? false)
      );
    });
    if (sort === "rating") {
      return [...list].sort(
        (a, b) =>
          (statsBySlug[b.slug]?.overall ?? -1) - (statsBySlug[a.slug]?.overall ?? -1),
      );
    }
    return list;
  }, [query, maker, profile, material, sort, statsBySlug]);

  return (
    <div>
      {/* 검색 */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="키캡 이름, 테마, 제조사로 검색 (예: 버블검, JTK, AKKO)"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />

      {/* 필터: 제조사 · 프로파일 · 재질 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {makers.length > 0 && (
          <SearchableSelect
            value={maker}
            onChange={setMaker}
            options={makers}
            allLabel="모든 제조사"
            searchPlaceholder="제조사 검색..."
          />
        )}
        {profiles.length > 0 && (
          <SearchableSelect
            value={profile}
            onChange={setProfile}
            options={profiles}
            allLabel="모든 프로파일"
            searchPlaceholder="프로파일 검색..."
          />
        )}
        {materials.length > 0 && (
          <SearchableSelect
            value={material}
            onChange={setMaterial}
            options={materials}
            allLabel="모든 재질"
            searchPlaceholder="재질 검색..."
          />
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "default" | "rating")}
          aria-label="정렬"
          className="ml-auto rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-muted outline-none focus:border-accent"
        >
          <option value="default">기본순</option>
          <option value="rating">평점순</option>
        </select>
      </div>

      {/* 결과 */}
      <p className="mt-4 text-sm text-muted">{filtered.length}개의 키캡</p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">조건에 맞는 키캡이 없습니다.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((kc) => (
            <KeycapCard key={kc.slug} kc={kc} rating={statsBySlug[kc.slug]} />
          ))}
        </div>
      )}
    </div>
  );
}
