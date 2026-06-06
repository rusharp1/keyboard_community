"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  signIn,
  signUp,
  requestPasswordReset,
  resendConfirmation,
  type FormState,
} from "@/app/(auth)/actions";

type Mode = "login" | "signup" | "forgot";

const initial: FormState = {};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
const labelClass = "mb-1 block text-sm text-muted";
const submitClass =
  "w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-accent">{msg}</p>;
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");

  const [loginState, loginAction, loginPending] = useActionState(signIn, initial);
  const [signupState, signupAction, signupPending] = useActionState(
    signUp,
    initial,
  );
  const [forgotState, forgotAction, forgotPending] = useActionState(
    requestPasswordReset,
    initial,
  );

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      {/* 탭 */}
      <div className="mb-6 flex rounded-lg border border-border bg-surface p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
            mode === "login"
              ? "bg-surface-2 font-medium text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
            mode === "signup"
              ? "bg-surface-2 font-medium text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          회원가입
        </button>
      </div>

      {/* 로그인 */}
      {mode === "login" && (
        <form action={loginAction} className="space-y-4">
          <h1 className="text-xl font-bold">로그인</h1>
          <div>
            <label className={labelClass} htmlFor="login-email">
              이메일
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="login-password">
              비밀번호
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>

          {loginState.error && (
            <p className="text-sm text-accent">{loginState.error}</p>
          )}
          {loginState.needsConfirmation && loginState.email && (
            <ResendBox email={loginState.email} />
          )}

          <button type="submit" disabled={loginPending} className={submitClass}>
            {loginPending ? "로그인 중…" : "로그인"}
          </button>

          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="block w-full text-center text-xs text-muted hover:text-foreground"
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>
      )}

      {/* 회원가입 */}
      {mode === "signup" && (
        <form action={signupAction} className="space-y-4">
          <h1 className="text-xl font-bold">회원가입</h1>

          {signupState.message ? (
            <div className="rounded-lg border border-border bg-surface p-4 text-sm">
              <p>{signupState.message}</p>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="mt-3 text-accent hover:underline"
              >
                로그인으로 →
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass} htmlFor="signup-email">
                  이메일
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
                <FieldError msg={signupState.fieldErrors?.email} />
              </div>
              <div>
                <label className={labelClass} htmlFor="signup-nickname">
                  닉네임
                </label>
                <input
                  id="signup-nickname"
                  name="nickname"
                  type="text"
                  autoComplete="nickname"
                  required
                  placeholder="커뮤니티에 표시될 이름"
                  className={inputClass}
                />
                <FieldError msg={signupState.fieldErrors?.nickname} />
              </div>
              <div>
                <label className={labelClass} htmlFor="signup-password">
                  비밀번호
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="8자 이상"
                  className={inputClass}
                />
                <FieldError msg={signupState.fieldErrors?.password} />
              </div>

              {signupState.error && (
                <p className="text-sm text-accent">{signupState.error}</p>
              )}

              <button
                type="submit"
                disabled={signupPending}
                className={submitClass}
              >
                {signupPending ? "가입 중…" : "가입하기"}
              </button>
            </>
          )}
        </form>
      )}

      {/* 비밀번호 찾기 */}
      {mode === "forgot" && (
        <form action={forgotAction} className="space-y-4">
          <h1 className="text-xl font-bold">비밀번호 재설정</h1>
          <p className="text-sm text-muted">
            가입한 이메일로 재설정 링크를 보내드립니다.
          </p>

          {forgotState.message ? (
            <div className="rounded-lg border border-border bg-surface p-4 text-sm">
              {forgotState.message}
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass} htmlFor="forgot-email">
                  이메일
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
                <FieldError msg={forgotState.fieldErrors?.email} />
              </div>
              {forgotState.error && (
                <p className="text-sm text-accent">{forgotState.error}</p>
              )}
              <button
                type="submit"
                disabled={forgotPending}
                className={submitClass}
              >
                {forgotPending ? "보내는 중…" : "재설정 메일 보내기"}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMode("login")}
            className="block w-full text-center text-xs text-muted hover:text-foreground"
          >
            ← 로그인으로 돌아가기
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        가입하면 키보드 커뮤니티{" "}
        <Link href="/community" className="hover:text-foreground">
          이용약관
        </Link>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}

// 이메일 미확인 시 재발송 버튼
function ResendBox({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, initial);
  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-3 text-sm">
      <input type="hidden" name="email" value={email} />
      {state.message ? (
        <p className="text-muted">{state.message}</p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="text-accent hover:underline disabled:opacity-60"
        >
          {pending ? "보내는 중…" : "확인 메일 다시 보내기"}
        </button>
      )}
    </form>
  );
}
