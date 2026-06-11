"use client";

import { useEffect, useState } from "react";

// 상세 본문 이미지 + 클릭 시 전체화면 라이트박스(바깥 클릭·ESC 닫기).
export default function PostImages({ images }: { images: string[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    // 라이트박스 동안 배경 스크롤 잠금.
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-6 space-y-3">
        {images.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(src)}
            className="block w-full cursor-zoom-in"
            aria-label="이미지 확대"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full rounded-lg border border-border" />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="닫기"
            className="absolute right-4 top-4 text-2xl text-white/80 hover:text-white"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full cursor-default rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
