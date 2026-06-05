"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchableSelect({
  value,
  onChange,
  options,
  allLabel = "전체",
  searchPlaceholder = "검색...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [query, options]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none transition-colors hover:text-foreground focus:border-accent"
      >
        <span className={value === "all" ? "text-muted" : "text-foreground"}>
          {value === "all" ? allLabel : value}
        </span>
        <span aria-hidden className="text-muted">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-surface-2 p-2 shadow-lg">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <ul className="mt-2 max-h-60 overflow-auto">
            <li>
              <button
                type="button"
                onClick={() => select("all")}
                className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface ${
                  value === "all" ? "text-accent" : ""
                }`}
              >
                {allLabel}
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => select(o)}
                  className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface ${
                    value === o ? "text-accent" : ""
                  }`}
                >
                  {o}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2.5 py-2 text-sm text-muted">결과 없음</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
