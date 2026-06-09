"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

// 제목+본문 검색. 현재 category/sort는 유지하고 q만 갱신.
export default function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    router.push(`/community?${next.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="제목·내용 검색"
        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none transition-colors focus:border-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-border"
      >
        검색
      </button>
    </form>
  );
}
