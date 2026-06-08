"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/app/(auth)/actions";

const initial: FormState = {};

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="mx-auto max-w-sm space-y-4 px-4 py-12">
      <h1 className="text-xl font-bold">새 비밀번호 설정</h1>
      <p className="text-sm text-muted">새로 사용할 비밀번호를 입력하세요.</p>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="new-password">
          새 비밀번호
        </label>
        <input
          id="new-password"
          suppressHydrationWarning
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="8자 이상"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-xs text-accent">{state.fieldErrors.password}</p>
        )}
      </div>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "변경 중…" : "비밀번호 변경"}
      </button>
    </form>
  );
}
