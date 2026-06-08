import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
const TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

function requireNaverEnv() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정(서버 전용 env).");
  }
  return { clientId, clientSecret };
}

// 네이버 동의 화면으로 보낼 authorize URL.
export function naverAuthorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = requireNaverEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

// code → access_token 교환(Client Secret은 서버에서만 사용).
export async function exchangeNaverCode(
  code: string,
  state: string,
): Promise<string> {
  const { clientId, clientSecret } = requireNaverEnv();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    state,
  });
  const res = await fetch(`${TOKEN_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`네이버 토큰 교환 실패: ${res.status}`);
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) {
    throw new Error(`네이버 토큰 없음: ${json.error ?? "unknown"}`);
  }
  return json.access_token;
}

export type NaverProfile = { id: string; email?: string; nickname?: string };

// 네이버 프로필 조회. 응답이 { response: {...} }로 감싸여 옴.
export async function fetchNaverProfile(
  accessToken: string,
): Promise<NaverProfile> {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`네이버 프로필 조회 실패: ${res.status}`);
  const json = (await res.json()) as {
    response?: { id?: string; email?: string; nickname?: string };
  };
  const r = json.response ?? {};
  if (!r.id) throw new Error("네이버 프로필에 id가 없습니다.");
  return { id: r.id, email: r.email, nickname: r.nickname };
}

type AdminClient = ReturnType<typeof createAdminClient>;

// 이메일로 기존 유저 조회(없으면 null).
async function findUserByEmail(admin: AdminClient, email: string) {
  const lower = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === lower);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

// 네이버 프로필 → Supabase 유저 확보 + magiclink hashed_token 발급.
// 같은 이메일이면 기존 계정과 연결(동일 계정 로그인). 없으면 생성(닉네임은 온보딩).
export async function establishNaverSession(
  profile: NaverProfile,
): Promise<{ token: string }> {
  if (!profile.email) throw new Error("NO_EMAIL");
  const admin = createAdminClient();

  const existing = await findUserByEmail(admin, profile.email);
  if (existing) {
    // 네이버 연결 흔적 기록(app_metadata는 사용자 변조 불가).
    if (!existing.app_metadata?.naver_id) {
      await admin.auth.admin.updateUserById(existing.id, {
        app_metadata: { ...existing.app_metadata, naver_id: profile.id },
      });
    }
  } else {
    const { error } = await admin.auth.admin.createUser({
      email: profile.email,
      email_confirm: true,
      app_metadata: { naver_id: profile.id },
      // 닉네임은 넣지 않음 → 트리거가 profiles 생성을 건너뜀(온보딩에서 입력).
    });
    if (error) throw error;
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
  });
  if (error) throw error;
  const token = data.properties?.hashed_token;
  if (!token) throw new Error("magiclink hashed_token 발급 실패");
  return { token };
}
