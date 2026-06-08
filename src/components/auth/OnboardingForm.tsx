"use client";

import { useActionState } from "react";
import { completeOnboarding, type FormState } from "@/app/(auth)/actions";

const initial: FormState = {};

export default function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, initial);

  return (
    <form action={action} className="mx-auto max-w-sm space-y-4 px-4 py-12">
      <h1 className="text-xl font-bold">닉네임 설정</h1>
      <p className="text-sm text-muted">
        커뮤니티에서 사용할 닉네임을 정해주세요. 한 번 정하면 글 작성자로 표시됩니다.
      </p>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="onb-nickname">
          닉네임
        </label>
        <input
          id="onb-nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          required
          placeholder="2~20자, 한글·영문·숫자·밑줄(_)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        {state.fieldErrors?.nickname && (
          <p className="mt-1 text-xs text-accent">{state.fieldErrors.nickname}</p>
        )}
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
