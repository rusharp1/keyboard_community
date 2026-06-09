"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "post-images";
const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// 브라우저에서 Supabase Storage로 업로드 후, 공개 URL을 hidden input(name="images")으로
// 폼에 실어 보낸다. 서버 액션이 posts.images에 저장.
export default function ImageUploader({ initial = [] }: { initial?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = ""; // 같은 파일 재선택 허용
    if (files.length === 0) return;
    setError(null);

    if (urls.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지입니다.`);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setBusy(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setError("이미지 파일만 올릴 수 있습니다.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`각 이미지는 5MB 이하여야 합니다 (${file.name}).`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) {
          setError(`업로드 실패: ${upErr.message}`);
          continue;
        }
        added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      if (added.length) setUrls((prev) => [...prev, ...added].slice(0, MAX_IMAGES));
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm text-muted">
          이미지 <span className="text-xs">(선택, 최대 {MAX_IMAGES}장·각 5MB)</span>
        </label>
        <span className="text-[11px] text-muted">
          {urls.length}/{MAX_IMAGES}
        </span>
      </div>

      {urls.map((u) => (
        <input key={u} type="hidden" name="images" value={u} />
      ))}

      {urls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {urls.map((u) => (
            <div key={u} className="relative h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt=""
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(u)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs text-foreground shadow hover:bg-border"
                aria-label="이미지 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < MAX_IMAGES && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={onPick}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-border"
        />
      )}
      {busy && <p className="mt-1 text-xs text-muted">업로드 중…</p>}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
