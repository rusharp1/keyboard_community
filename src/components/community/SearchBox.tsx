"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

// 제목+본문 검색. 현재 category/sort는 유지하고 q만 갱신.
export default function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  // q만 갱신/해제하고 나머지 쿼리(category·sort 등)는 유지.
  function navigate(q: string) {
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    router.push(`/community?${next.toString()}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(value);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    // 네이티브 지우기(X)·수동 비우기로 입력이 비면 검색을 해제(=q 제거).
    if (v === "" && params.get("q")) navigate("");
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="제목·내용 검색"
        className="w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none transition-colors focus:border-accent"
      />
      <button
        type="submit"
        className="shrink-0 whitespace-nowrap rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-border"
      >
        검색
      </button>
    </form>
  );
}
