"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  // 이메일 미확인 로그인 시도 → 재발송 안내용
  needsConfirmation?: boolean;
  email?: string;
};

const emailSchema = z.email("올바른 이메일을 입력하세요.");
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.");
const nicknameSchema = z
  .string()
  .min(2, "닉네임은 2자 이상이어야 합니다.")
  .max(20, "닉네임은 20자 이하여야 합니다.")
  .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 한글·영문·숫자·밑줄(_)만 가능합니다.");

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
});

async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// 첫 번째 zod 에러 메시지를 필드별로 추린다.
function firstFieldErrors(
  flattened: Record<string, string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flattened)) {
    if (msgs && msgs.length > 0) out[key] = msgs[0];
  }
  return out;
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }
  const { email, password, nickname } = parsed.data;

  const supabase = await createClient();

  // 닉네임 사전 중복 체크(최종 방어는 DB unique index).
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (existing) {
    return { fieldErrors: { nickname: "이미 사용 중인 닉네임입니다." } };
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // 트리거의 닉네임 unique 위반은 가입 실패로 전파된다.
    if (/nickname|duplicate|unique|profiles/i.test(error.message)) {
      return { fieldErrors: { nickname: "이미 사용 중인 닉네임입니다." } };
    }
    return { error: error.message };
  }

  // 이미 가입된(확인된) 이메일이면 Supabase 이메일 열거 방지로 인해
  // error 없이 빈 identities로 응답한다(메일도 안 감) → 중복으로 처리.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      fieldErrors: {
        email:
          "이미 가입된 이메일입니다. 로그인하거나 '비밀번호를 잊으셨나요?'를 이용하세요.",
      },
    };
  }

  return {
    message:
      "확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료한 뒤 로그인하세요.",
    email,
  };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return {
        error: "이메일 확인이 필요합니다. 받은 메일의 링크를 눌러주세요.",
        needsConfirmation: true,
        email,
      };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/community");
}

export async function resendConfirmation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { error: "이메일이 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: error.message, needsConfirmation: true, email };
  return { message: "확인 메일을 다시 보냈습니다.", email };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "이메일 오류" } };
  }
  const email = parsed.data;

  const supabase = await createClient();
  const origin = await getOrigin();
  // 재설정 링크는 콜백을 거쳐 세션을 만든 뒤 /auth/reset 으로 보낸다.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  });
  if (error) return { error: error.message };
  return {
    message: "비밀번호 재설정 메일을 보냈습니다. 메일의 링크를 눌러주세요.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { fieldErrors: { password: parsed.error.issues[0]?.message ?? "비밀번호 오류" } };
  }

  const supabase = await createClient();
  // 재설정 링크로 들어온 사용자는 복구 세션이 있어야 한다.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "세션이 만료되었습니다. 재설정 메일을 다시 요청하세요." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };

  redirect("/community");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// 소셜(네이버) 신규 유저의 닉네임 온보딩 — 로그인 세션으로 profiles 행 생성.
export async function completeOnboarding(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = nicknameSchema.safeParse(formData.get("nickname"));
  if (!parsed.success) {
    return {
      fieldErrors: { nickname: parsed.error.issues[0]?.message ?? "닉네임 오류" },
    };
  }
  const nickname = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 사전 중복 체크(최종 방어는 lower(nickname) unique index).
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (existing) {
    return { fieldErrors: { nickname: "이미 사용 중인 닉네임입니다." } };
  }

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, nickname });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return { fieldErrors: { nickname: "이미 사용 중인 닉네임입니다." } };
    }
    return { error: error.message };
  }

  // 헤더(레이아웃)가 새 닉네임을 즉시 반영하도록 캐시 무효화.
  revalidatePath("/", "layout");
  redirect("/community");
}
