"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

// 모바일 상단 햄버거: 도감/커뮤니티 링크를 드롭다운으로 모은다(데스크탑은 Header가 인라인 표시).
export default function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="메뉴"
        className="rounded-md px-2 py-1.5 text-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        ☰
      </button>

      {open && (
        <>
          {/* 바깥 클릭 시 닫기 */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <nav className="fixed left-2 right-2 top-14 z-50 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
