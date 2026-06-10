"use client";

import { useState } from "react";
import Link from "next/link";

export type CatLink = {
  key: string;
  name: string;
  href: string;
  active: boolean;
};

// 카테고리 SNB. 데스크탑은 좌측 고정 컬럼, 모바일은 햄버거로 펼치는 드롭다운.
export default function CategorySidebar({ items }: { items: CatLink[] }) {
  const [open, setOpen] = useState(false);
  const active = items.find((i) => i.active) ?? items[0];

  const itemClass = (a: boolean) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      a
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted hover:bg-surface hover:text-foreground"
    }`;

  return (
    <>
      {/* 모바일: 햄버거 + 펼침 목록 */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>☰</span>
            <span className="font-medium">{active.name}</span>
          </span>
          <span aria-hidden className="text-muted">
            {open ? "▲" : "▼"}
          </span>
        </button>
        {open && (
          <nav className="mt-2 rounded-lg border border-border p-1">
            {items.map((i) => (
              <Link
                key={i.key}
                href={i.href}
                onClick={() => setOpen(false)}
                className={itemClass(i.active)}
              >
                {i.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* 데스크탑: 좌측 고정 사이드바 */}
      <nav className="hidden w-44 shrink-0 md:block">
        <p className="px-3 pb-1 text-xs font-semibold text-muted">카테고리</p>
        <div className="space-y-0.5">
          {items.map((i) => (
            <Link key={i.key} href={i.href} className={itemClass(i.active)}>
              {i.name}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
