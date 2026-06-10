"use client";

import { useActionState } from "react";
import { updateNotificationPrefs } from "@/app/community/actions";
import { NOTIFICATION_EVENTS, type NotificationPrefs } from "@/lib/community/types";

// 이벤트×채널 토글 매트릭스. 체크박스 name은 DB 컬럼명(`<event>_<channel>`)과 일치.
export default function NotificationSettingsForm({
  prefs,
}: {
  prefs: NotificationPrefs;
}) {
  const [state, action, pending] = useActionState(updateNotificationPrefs, {});

  return (
    <form action={action} className="mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 text-left font-medium">알림 이벤트</th>
            <th className="w-20 px-3 py-2 font-medium">인앱(종)</th>
            <th className="w-20 px-3 py-2 font-medium">이메일</th>
          </tr>
        </thead>
        <tbody>
          {NOTIFICATION_EVENTS.map((ev) => (
            <tr key={ev.key} className="border-b border-border/50">
              <td className="py-3 text-foreground">{ev.label}</td>
              <td className="px-3 text-center">
                <input
                  type="checkbox"
                  name={`${ev.key}_bell`}
                  defaultChecked={prefs[`${ev.key}_bell` as keyof NotificationPrefs]}
                  className="h-4 w-4 accent-accent"
                />
              </td>
              <td className="px-3 text-center">
                <input
                  type="checkbox"
                  name={`${ev.key}_email`}
                  defaultChecked={prefs[`${ev.key}_email` as keyof NotificationPrefs]}
                  className="h-4 w-4 accent-accent"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-muted">
        이메일 알림은 설정만 저장되며, 실제 발송은 메일 서버(SMTP) 연결 후 동작합니다.
      </p>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        {state.ok && (
          <span className="text-sm text-muted">저장되었습니다.</span>
        )}
        {state.error && (
          <span className="text-sm text-accent">{state.error}</span>
        )}
      </div>
    </form>
  );
}
