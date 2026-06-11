"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type CatLink = {
  key: string;
  name: string;
  href: string;
  active: boolean;
};

// 카테고리 SNB. 데스크탑은 좌측 고정 컬럼, 모바일은 좌측에서 슬라이드되는 드로어.
export default function CategorySidebar({ items }: { items: CatLink[] }) {
  const [open, setOpen] = useState(false);
  const active = items.find((i) => i.active) ?? items[0];

  // 드로어 열림 동안 ESC 닫기 + 배경 스크롤 잠금(PostImages 라이트박스 패턴).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const itemClass = (a: boolean) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      a
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted hover:bg-surface hover:text-foreground"
    }`;

  return (
    <>
      {/* 모바일: 트리거 바 + 좌측 슬라이드 드로어 */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm text-foreground"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>☰</span>
            <span className="font-medium">{active.name}</span>
          </span>
          <span aria-hidden className="text-muted">
            카테고리
          </span>
        </button>

        {/* 오버레이(클릭 닫기) — 슬라이드 위해 항상 렌더 후 클래스 토글 */}
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        {/* 좌측 드로어 패널 */}
        <nav
          role="dialog"
          aria-modal="true"
          aria-label="카테고리"
          className={`fixed left-0 top-0 z-50 flex h-full w-64 max-w-[80vw] flex-col border-r border-border bg-background transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <span className="text-sm font-semibold text-foreground">카테고리</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="text-lg text-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="space-y-0.5 overflow-y-auto p-2">
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
          </div>
        </nav>
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
