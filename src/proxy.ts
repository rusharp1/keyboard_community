import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

// Next 16: `middleware.ts`는 deprecated → `proxy.ts`.
// 여기서는 인증 토큰 쿠키를 갱신하는 일만 한다(리다이렉트 차단 없음).
// 실제 권한 검증은 RLS와 Server Action 내부의 getUser()로 수행한다.
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  // 환경변수가 없으면 세션 갱신을 건너뛴다(도감 등은 인증 무관하게 동작).
  if (!env) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // 토큰 갱신 트리거 — getUser() 호출이 만료된 세션을 새로 고친다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 자산·이미지 제외(없으면 인증 로직이 CSS/JS/이미지 로딩을 막을 수 있음).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
