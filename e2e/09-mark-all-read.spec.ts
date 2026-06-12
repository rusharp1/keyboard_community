import { test, expect } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";

// 라이브(Vercel) "모두 읽음" 검증: 배지 즉시 0 + 재방문(리로드)해도 0 유지.
// Phase 7 함정 — startTransition(markAllNotificationsRead)로 폼 언마운트 취소를 회피했는지가 핵심.
test.use({ baseURL: "https://keyboard-community.vercel.app" });

const db = serviceClient();
const acc = newEmail("mar");
const nick = newNickname("mar");
let user: User;

test.beforeAll(async () => {
  user = await createUser(acc.email, nick, { confirmed: true });
  // 안 읽은 알림 3건 시드(직접 insert — 트리거와 동일 경로).
  await db.from("notifications").insert([
    { user_id: user.id, type: "notice" },
    { user_id: user.id, type: "notice" },
    { user_id: user.id, type: "notice" },
  ]);
});
test.afterAll(async () => {
  await deleteUserByEmail(acc.email).catch(() => {});
});

test("모두 읽음 → 배지 즉시 0 + 리로드 후에도 0 유지", async ({ page }) => {
  await loginViaUI(page, acc.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.goto("/community");

  // 시드한 3건 → "3개 안 읽음" 배지.
  const bell = page.getByRole("button", { name: /알림/ });
  await expect(bell).toBeVisible();
  await expect(page.getByRole("button", { name: /3개 안 읽음/ })).toBeVisible({
    timeout: 30_000,
  });

  // 종 열기 → "모두 읽음" 클릭.
  await bell.click();
  await page.getByRole("button", { name: "모두 읽음" }).click();

  // 배지 즉시 0(안 읽음 라벨 사라짐).
  await expect(page.getByRole("button", { name: /안 읽음/ })).toHaveCount(0, {
    timeout: 10_000,
  });

  // 서버 저장 확인: DB의 안 읽음 0건.
  await expect(async () => {
    const { count } = await db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    expect(count).toBe(0);
  }).toPass({ timeout: 15_000 });

  // 재방문(리로드) 후에도 배지 0(액션이 취소되지 않고 저장됨).
  await page.reload();
  await expect(bell).toBeVisible();
  await expect(page.getByRole("button", { name: /안 읽음/ })).toHaveCount(0);
});
