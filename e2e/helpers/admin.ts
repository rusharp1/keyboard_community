import { createClient, type User } from "@supabase/supabase-js";
import { PASSWORD } from "./data";

// service_role(관리자) 클라이언트 — 로컬 테스트 전용(.env.test.local).
// 메일을 보내지 않고 계정 상태를 만들고 인증 토큰을 직접 발급한다.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function admin() {
  if (!url || !serviceKey) {
    throw new Error(
      "관리자 테스트에는 NEXT_PUBLIC_SUPABASE_URL(.env.local)과 SUPABASE_SERVICE_ROLE_KEY(.env.test.local)가 필요합니다.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createUser(
  email: string,
  nickname: string,
  { confirmed }: { confirmed: boolean },
  password = PASSWORD,
): Promise<User> {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: confirmed,
    user_metadata: { nickname }, // 트리거(handle_new_user)가 profiles 행 생성
  });
  if (error) throw error;
  return data.user;
}

// 확인/재설정 토큰을 메일 없이 발급. 우리 콜백의 token_hash 경로로 검증한다.
// 우리 앱 콜백으로 바로 넘길 수 있는 경로(메일 링크와 동일한 token_hash 흐름).
// signup 링크는 유저를 생성하므로 닉네임을 넘겨 트리거(profiles NOT NULL)를 만족시킨다.
export async function confirmCallbackPath(
  email: string,
  nickname: string,
  password = PASSWORD,
): Promise<string> {
  const { data, error } = await admin().auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) throw error;
  const token = data.properties?.hashed_token;
  if (!token) throw new Error("generateLink(signup): hashed_token 없음");
  return `/auth/callback?token_hash=${token}&type=signup`;
}

export async function recoveryCallbackPath(email: string): Promise<string> {
  const { data, error } = await admin().auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) throw error;
  const token = data.properties?.hashed_token;
  if (!token) throw new Error("generateLink(recovery): hashed_token 없음");
  return `/auth/callback?token_hash=${token}&type=recovery&next=/auth/reset`;
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const { data, error } = await admin().auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) return;
  const u = data.users.find(
    (x) => x.email?.toLowerCase() === email.toLowerCase(),
  );
  if (u) await admin().auth.admin.deleteUser(u.id);
}
