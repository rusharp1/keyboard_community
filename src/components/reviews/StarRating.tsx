"use client";

import { useState } from "react";

// 별점 — 표시(readOnly) 또는 입력(name 지정 시 클릭 가능, hidden input에 값 기록).
export default function StarRating({
  value = 0,
  name,
  label,
  size = "text-base",
  readOnly = false,
}: {
  value?: number;
  name?: string;
  label?: string; // 입력 버튼 aria-label 접두(축 구분용)
  size?: string;
  readOnly?: boolean;
}) {
  const interactive = !!name && !readOnly;
  const [val, setVal] = useState(Math.round(value));
  const shown = interactive ? val : value;

  return (
    <span className={`inline-flex items-center leading-none ${size}`}>
      {name && <input type="hidden" name={name} value={val} />}
      {[1, 2, 3, 4, 5].map((i) =>
        interactive ? (
          <button
            key={i}
            type="button"
            aria-label={label ? `${label} ${i}점` : `${i}점`}
            onClick={() => setVal(i)}
            className="px-0.5"
          >
            <span className={i <= val ? "text-amber-400" : "text-border"}>★</span>
          </button>
        ) : (
          <span key={i} className={i <= Math.round(shown) ? "text-amber-400" : "text-border"}>
            ★
          </span>
        ),
      )}
    </span>
  );
}
