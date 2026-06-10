import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationItem,
  type NotificationPrefs,
  type NotificationType,
} from "./types";

// notifications는 profiles를 user_id·actor_id 두 번 참조 → 임베드에 FK 힌트 필수.
const ACTOR = "actor:profiles!actor_id(nickname)";
const POST = "post:posts!post_id(title)";

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getNotifications(
  userId: string,
  limit = 10,
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      `id, type, post_id, comment_id, is_read, created_at, ${ACTOR}, ${POST}`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    type: NotificationType;
    post_id: string | null;
    comment_id: string | null;
    is_read: boolean;
    created_at: string;
    actor: { nickname: string } | null;
    post: { title: string } | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    actor_nickname: r.actor?.nickname ?? null,
    post_id: r.post_id,
    comment_id: r.comment_id,
    post_title: r.post?.title ?? null,
    is_read: r.is_read,
    created_at: r.created_at,
  }));
}

// 알림 설정. 행이 없으면 DB와 동일한 기본값을 돌려준다.
export async function getNotificationPrefs(
  userId: string,
): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_prefs")
    .select(
      "comment_bell, comment_email, reply_bell, reply_email, like_bell, like_email, notice_bell, notice_email",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return { ...DEFAULT_NOTIFICATION_PREFS, ...((data as Partial<NotificationPrefs>) ?? {}) };
}
