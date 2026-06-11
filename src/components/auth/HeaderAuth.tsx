import Link from "next/link";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import BellMenu from "@/components/community/BellMenu";
import {
  getNotifications,
  getUnreadCount,
} from "@/lib/community/notifications";

const loginLinkClass =
  "ml-2 rounded-md bg-surface-2 px-3 py-1.5 text-foreground transition-colors hover:bg-border";

function LoginLink() {
  return (
    <Link href="/login" className={loginLinkClass}>
      로그인
    </Link>
  );
}

// 로그인 상태를 서버에서 읽어 닉네임/로그아웃을 표시한다.
// 환경변수가 없으면 throw 대신 로그인 링크로 graceful degrade.
export default async function HeaderAuth() {
  if (!getSupabaseEnv()) return <LoginLink />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <LoginLink />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();
  const nickname = profile?.nickname ?? user.email?.split("@")[0] ?? "사용자";

  // 프로필이 있는 정식 유저만 알림 종을 노출(온보딩 전 소셜 신규 유저 제외).
  const [unreadCount, notifications] = profile
    ? await Promise.all([getUnreadCount(user.id), getNotifications(user.id)])
    : [0, []];

  return (
    <div className="ml-2 flex items-center gap-1">
      {profile && (
        <BellMenu notifications={notifications} unreadCount={unreadCount} />
      )}
      <Link
        href="/community/me"
        className="px-2 text-sm font-medium text-foreground hover:underline"
      >
        {nickname}
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md bg-surface-2 px-3 py-1.5 text-sm text-muted transition-colors hover:bg-border hover:text-foreground"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
