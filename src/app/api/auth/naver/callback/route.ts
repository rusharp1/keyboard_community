import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeNaverCode,
  fetchNaverProfile,
  establishNaverSession,
} from "@/lib/auth/naver";

// 네이버 콜백: state 검증 → token 교환 → 프로필 → 유저 확보/세션토큰 →
// 기존 /auth/callback(magiclink token_hash)으로 넘겨 세션 수립.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("naver_oauth_state")?.value;
  cookieStore.delete("naver_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=state`);
  }

  try {
    const accessToken = await exchangeNaverCode(code, state);
    const profile = await fetchNaverProfile(accessToken);
    const { token } = await establishNaverSession(profile);
    // 신규/기존 모두 온보딩을 경유(거기서 profiles 유무로 라우팅).
    return NextResponse.redirect(
      `${origin}/auth/callback?token_hash=${token}&type=magiclink&next=/onboarding`,
    );
  } catch (e) {
    const reason =
      e instanceof Error && e.message === "NO_EMAIL" ? "no_email" : "naver";
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }
}
