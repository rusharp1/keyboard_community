// Supabase 환경변수 읽기/검증.
// 도감 페이지는 인증과 무관하므로, 환경변수가 없을 때 throw 대신
// null을 돌려주는 graceful 경로(getSupabaseEnv)와, 인증이 실제로 필요한
// 곳에서 쓰는 엄격 경로(requireSupabaseEnv)를 분리한다.

export type SupabaseEnv = { url: string; anonKey: string };

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
    );
  }
  return env;
}
