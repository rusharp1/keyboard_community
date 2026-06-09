"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/community/actions";
import { BODY_MAX, TITLE_MAX } from "@/lib/community/limits";

type CategoryOpt = { id: number; name: string };

type Initial = {
  id?: string;
  title?: string;
  body?: string;
  tags?: string[];
  category_id?: number;
};

export default function PostForm({
  action,
  categories,
  mode = "create",
  initial = {},
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  categories: CategoryOpt[];
  mode?: "create" | "edit";
  initial?: Initial;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // controlled 입력 — 서버 액션 폼 자동 초기화로 검증 실패 시 값이 날아가는 것 방지.
  const [title, setTitle] = useState(initial.title ?? "");
  const [body, setBody] = useState(initial.body ?? "");

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && <input type="hidden" name="id" value={initial.id} />}

      {mode === "create" && (
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="category_id">
            카테고리
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={initial.category_id ?? categories[0]?.id}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category_id && (
            <p className="mt-1 text-xs text-accent">{state.fieldErrors.category_id}</p>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm text-muted" htmlFor="title">
            제목
          </label>
          <span className="text-[11px] text-muted">
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-xs text-accent">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm text-muted" htmlFor="body">
            내용 <span className="text-xs">(선택)</span>
          </label>
          <span className="text-[11px] text-muted">
            {body.length}/{BODY_MAX}
          </span>
        </div>
        <textarea
          id="body"
          name="body"
          rows={12}
          value={body}
          maxLength={BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {state.fieldErrors?.body && (
          <p className="mt-1 text-xs text-accent">{state.fieldErrors.body}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="tags">
          태그 <span className="text-xs">(쉼표로 구분, 최대 5개)</span>
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          defaultValue={initial.tags?.join(", ")}
          placeholder="예: 적축, 타건샷, 입문"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "저장 중…" : mode === "edit" ? "수정 완료" : "등록"}
      </button>
    </form>
  );
}
