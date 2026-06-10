"use client";

import { useState } from "react";
import Link from "next/link";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/community/actions";
import { formatDate, notificationText } from "@/lib/community/format";
import type { NotificationItem } from "@/lib/community/types";

// 헤더 종: unread 배지 + 드롭다운. 알림 목록·카운트는 서버(HeaderAuth)에서 주입.
export default function BellMenu({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림${unreadCount > 0 ? ` (${unreadCount}개 안 읽음)` : ""}`}
        className="relative rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <span aria-hidden className="text-lg">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
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
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">알림</span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead}>
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-foreground"
                  >
                    모두 읽음
                  </button>
                </form>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">
                새 알림이 없어요
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    {/* 클릭 → 읽음 처리 후 대상 글로 이동(서버 액션이 redirect). */}
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="post_id" value={n.post_id ?? ""} />
                      <button
                        type="submit"
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
