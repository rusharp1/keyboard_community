import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { naverAuthorizeUrl } from "@/lib/auth/naver";

// 네이버 로그인 시작: CSRF용 state 쿠키 발급 후 네이버 동의 화면으로.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/naver/callback`;

  const cookieStore = await cookies();
  cookieStore.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(naverAuthorizeUrl(redirectUri, state));
}
