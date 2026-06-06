import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

// 서버(Server Component / Server Action / Route Handler)용 Supabase 클라이언트.
// Next 16에서 cookies()는 async이므로 반드시 await 한다.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component에서 호출되면 set이 막혀 에러가 난다.
          // 세션 갱신은 proxy.ts가 담당하므로 여기서는 무시해도 안전하다.
        }
      },
    },
  });
}
