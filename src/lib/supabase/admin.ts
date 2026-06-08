import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

// service_role(관리자) 클라이언트 — RLS를 우회하므로 서버에서만 사용한다.
// 네이버 소셜 로그인에서 유저 생성/조회/세션토큰 발급에 쓴다.
export function createAdminClient(): SupabaseClient {
  const { url } = requireSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다(서버 전용 env).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
