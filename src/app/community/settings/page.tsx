import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { getNotificationPrefs } from "@/lib/community/notifications";
import { levelFor } from "@/lib/community/types";
import NotificationSettingsForm from "@/components/community/NotificationSettingsForm";

export const metadata: Metadata = { title: "알림 설정 — 커뮤니티" };

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const prefs = await getNotificationPrefs(user.id);
  const level = levelFor(profile.activity_score);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/community" className="text-sm text-muted hover:text-foreground">
        ← 커뮤니티
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-foreground">알림 설정</h1>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <span className="font-medium text-foreground">{profile.nickname}</span>
        <span title={`활동점수 ${profile.activity_score}`}>
          {level.emoji}
          {level.name}
        </span>
      </div>

      <NotificationSettingsForm prefs={prefs} />
    </div>
  );
}
