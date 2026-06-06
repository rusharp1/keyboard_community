"use client";

import { useMemo, useState } from "react";
import {
  keyboards,
  getKbBrands,
  getLayouts,
  getConnections,
  getSwitchKinds,
  getKbMaterials,
  getColorFamilies,
  getKeyboardSwitchOptions,
  colorFamily,
} from "@/data/keyboards";
import KeyboardCard from "./KeyboardCard";
import SearchableSelect from "./SearchableSelect";

export default function KeyboardExplorer() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [layout, setLayout] = useState("all");
  const [connection, setConnection] = useState("all");
  const [kind, setKind] = useState("all");
  const [colorFam, setColorFam] = useState("all");
  const [material, setMaterial] = useState("all");
  const [switchSlug, setSwitchSlug] = useState("all");
  const [hotswapOnly, setHotswapOnly] = useState(false);

  const brands = useMemo(() => getKbBrands(), []);
  const layouts = useMemo(() => getLayouts(), []);
  const connections = useMemo(() => getConnections(), []);
  const kinds = useMemo(() => getSwitchKinds(), []);
  const families = useMemo(() => getColorFamilies(), []);
  const materials = useMemo(() => getKbMaterials(), []);
  const switchOptions = useMemo(() => getKeyboardSwitchOptions(), []);

  // 세부 축 드롭다운: 라벨(이름)로 고르고 slug로 매핑
  const switchNameToSlug = useMemo(
    () => new Map(switchOptions.map((o) => [o.nameKo, o.slug])),
    [switchOptions]
  );
  const switchNames = useMemo(
    () => switchOptions.map((o) => o.nameKo),
    [switchOptions]
  );
  const switchLabel =
    switchSlug === "all"
      ? "all"
      : switchOptions.find((o) => o.slug === switchSlug)?.nameKo ?? "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keyboards.filter((k) => {
      if (brand !== "all" && k.brand !== brand) return false;
      if (layout !== "all" && k.layout !== layout) return false;
      if (connection !== "all" && !k.connections.includes(connection)) return false;
      if (kind !== "all" && k.switchKind !== kind) return false;
      if (material !== "all" && k.material !== material) return false;
      if (
        colorFam !== "all" &&
        !k.colors.some((c) => colorFamily(c.name) === colorFam)
      )
        return false;
      if (
        switchSlug !== "all" &&
        !(k.availableSwitchSlugs ?? []).includes(switchSlug)
      )
        return false;
      if (hotswapOnly && !k.hotswap) return false;
      if (!q) return true;
      return (
        k.nameKo.toLowerCase().includes(q) ||
        (k.nameEn?.toLowerCase().includes(q) ?? false) ||
        k.brand.toLowerCase().includes(q) ||
        k.colors.some((c) => c.name.toLowerCase().includes(q))
      );
    });
  }, [
    query,
    brand,
    layout,
    connection,
    kind,
    material,
    colorFam,
    switchSlug,
    hotswapOnly,
  ]);

  return (
    <div>
      {/* 검색 */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="키보드 이름, 브랜드, 색상으로 검색 (예: F99, 독거미, 올리비아)"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />

      {/* 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SearchableSelect
          value={brand}
          onChange={setBrand}
          options={brands}
          allLabel="모든 브랜드"
          searchPlaceholder="브랜드 검색..."
        />
        <SearchableSelect
          value={layout}
          onChange={setLayout}
          options={layouts}
          allLabel="모든 배열"
          searchPlaceholder="배열 검색..."
        />
        <SearchableSelect
          value={connection}
          onChange={setConnection}
          options={connections}
          allLabel="모든 연결"
          searchPlaceholder="연결 검색..."
        />
        <SearchableSelect
          value={kind}
          onChange={setKind}
          options={kinds}
          allLabel="모든 종류"
          searchPlaceholder="종류 검색..."
        />
        <SearchableSelect
          value={switchLabel}
          onChange={(name) =>
            setSwitchSlug(name === "all" ? "all" : switchNameToSlug.get(name) ?? "all")
          }
          options={switchNames}
          allLabel="모든 축"
          searchPlaceholder="축 검색..."
        />
        <SearchableSelect
          value={colorFam}
          onChange={setColorFam}
          options={families}
          allLabel="모든 색상"
          searchPlaceholder="색상 검색..."
        />
        <SearchableSelect
          value={material}
          onChange={setMaterial}
          options={materials}
          allLabel="모든 재질"
          searchPlaceholder="재질 검색..."
        />
        <button
          onClick={() => setHotswapOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
            hotswapOnly
              ? "border-accent bg-accent/15 text-foreground"
              : "border-border bg-surface text-muted hover:text-foreground"
          }`}
        >
          핫스왑만
        </button>
      </div>

      {/* 결과 */}
      <p className="mt-4 text-sm text-muted">{filtered.length}개의 키보드</p>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">조건에 맞는 키보드가 없습니다.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((kb) => (
            <KeyboardCard key={kb.slug} kb={kb} />
          ))}
        </div>
      )}
    </div>
  );
}
