"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/community/actions";
import { BODY_MAX, TITLE_MAX } from "@/lib/community/limits";
import { allItemOptions } from "@/data/items";
import SearchableSelect from "@/components/SearchableSelect";
import RichEditor from "./RichEditor";

type CategoryOpt = { id: number; name: string };

type Initial = {
  id?: string;
  title?: string;
  body?: string;
  tags?: string[];
  category_id?: number;
  item?: string; // "type:slug" 형태(도감 항목 태깅)
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

  // 도감 항목 태깅. SearchableSelect는 라벨 문자열 기반 → 라벨↔"type:slug" 매핑.
  const itemOptions = useMemo(() => allItemOptions(), []);
  const valueToLabel = useMemo(
    () => new Map(itemOptions.map((o) => [o.value, o.label])),
    [itemOptions],
  );
  const labelToValue = useMemo(
    () => new Map(itemOptions.map((o) => [o.label, o.value])),
    [itemOptions],
  );
  const [itemValue, setItemValue] = useState(initial.item ?? "");
  const itemLabel = itemValue ? valueToLabel.get(itemValue) ?? "all" : "all";

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
          <label className="block text-sm text-muted">
            내용 <span className="text-xs">(선택)</span>
          </label>
          <span className={`text-[11px] ${body.length > BODY_MAX ? "text-accent" : "text-muted"}`}>
            {body.length}/{BODY_MAX}
          </span>
        </div>
        {/* WYSIWYG 에디터(서식 즉시 반영). 저장은 마크다운 문자열 → 아래 hidden input으로 제출. */}
        <RichEditor value={body} onChange={setBody} />
        <input type="hidden" name="body" value={body} />
        <p className="mt-1 text-[11px] text-muted">
          도구 모음으로 제목·굵게·인용구·목록·링크·이미지를 넣을 수 있어요. 우하단 “마크다운”으로 직접 입력도 가능합니다.
        </p>
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

      <div>
        <label className="mb-1 block text-sm text-muted">
          관련 도감 항목 <span className="text-xs">(선택 — 축/키캡/키보드)</span>
        </label>
        <input type="hidden" name="item" value={itemValue} />
        <div className="flex items-center gap-2">
          <SearchableSelect
            value={itemLabel}
            onChange={(label) =>
              setItemValue(label === "all" ? "" : labelToValue.get(label) ?? "")
            }
            options={itemOptions.map((o) => o.label)}
            allLabel="선택 안 함"
            searchPlaceholder="도감 항목 검색..."
          />
          {itemValue && (
            <button
              type="button"
              onClick={() => setItemValue("")}
              className="text-xs text-muted hover:text-accent"
            >
              해제
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted">
          연결하면 해당 도감 상세의 “관련 후기 글”에 노출됩니다.
        </p>
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
