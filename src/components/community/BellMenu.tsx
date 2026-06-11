"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/community/actions";
import { createClient } from "@/lib/supabase/client";
import { formatDate, notificationText } from "@/lib/community/format";
import type { NotificationItem } from "@/lib/community/types";

// 헤더 종: unread 배지 + 드롭다운. 목록·카운트는 서버(HeaderAuth)에서 시드로 주입하고,
// Supabase Realtime(본인 notifications INSERT) 수신 시 router.refresh로 새로고침 없이 갱신.
// 읽음은 낙관적으로 즉시 배지에 반영.
export default function BellMenu({
  notifications,
  unreadCount,
  userId,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  userId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const [unread, setUnread] = useState(unreadCount);

  // 서버에서 새 props가 오면(예: router.refresh 후) 로컬 상태를 렌더 중 동기화.
  // (effect 대신 "이전 prop 비교" 패턴 — 낙관적 변경은 새 서버 데이터로 덮어쓴다.)
  const [seed, setSeed] = useState({ notifications, unreadCount });
  if (seed.notifications !== notifications || seed.unreadCount !== unreadCount) {
    setSeed({ notifications, unreadCount });
    setItems(notifications);
    setUnread(unreadCount);
  }

  // 본인 알림 INSERT를 실시간 구독 → 헤더(루트 레이아웃) 재요청.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // RLS가 걸린 postgres_changes는 소켓이 사용자 토큰으로 인증된 "뒤에" 구독해야
    // 본인 행 이벤트를 받는다. 따라서 setAuth 완료 후 subscribe.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => router.refresh(),
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[bell] realtime 구독 실패:", status);
          }
        });
    })();

    // 소켓 지연/누락 대비 안전망: 탭 복귀 시 최신화.
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, router]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) router.refresh(); // 열 때 최신 목록 보장.
          setOpen((v) => !v);
        }}
        aria-label={`알림${unread > 0 ? ` (${unread}개 안 읽음)` : ""}`}
        className="relative rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <span aria-hidden className="text-lg">
          🔔
        </span>
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* 바깥 클릭 시 닫기 */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="fixed left-2 right-2 top-14 z-50 w-auto overflow-hidden rounded-lg border border-border bg-background shadow-lg sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">알림</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // 낙관적: 배지 즉시 0 + 목록 읽음 처리.
                    setUnread(0);
                    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    // 폼 언마운트로 액션이 취소되지 않도록 트랜지션으로 직접 호출.
                    startTransition(() => markAllNotificationsRead());
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                새 알림이 없어요
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    {/* 클릭 → 읽음 처리 후 대상 글로 이동(서버 액션이 redirect). */}
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="post_id" value={n.post_id ?? ""} />
                      <button
                        type="submit"
                        onClick={() => {
                          // 낙관적: 안 읽은 항목이면 배지 -1, 해당 항목 읽음 표시.
                          if (!n.is_read) setUnread((u) => Math.max(0, u - 1));
                          setItems((prev) =>
                            prev.map((x) =>
                              x.id === n.id ? { ...x, is_read: true } : x,
                            ),
                          );
                        }}
                        className={`block w-full px-3 py-2.5 text-left transition-colors hover:bg-surface ${
                          n.is_read ? "" : "bg-accent/5"
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          <span
                            aria-hidden
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              n.is_read ? "bg-transparent" : "bg-accent"
                            }`}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm text-foreground">
                              {notificationText(n.type, n.actor_nickname, !!n.comment_id)}
                            </span>
                            {n.post_title && (
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {n.post_title}
                              </span>
                            )}
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {formatDate(n.created_at)}
                            </span>
                          </span>
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/community/settings"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-3 py-2 text-center text-xs text-muted hover:text-foreground"
            >
              알림 설정
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
