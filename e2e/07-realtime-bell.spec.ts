import { test, expect } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";

// 라이브(Vercel) 실시간 종 푸시 검증.
// 로그인 상태(페이지 리로드 없음)에서 본인 notifications에 INSERT가 발생하면
// BellMenu의 Supabase Realtime 구독 → router.refresh로 종 배지가 즉시 갱신되는지 본다.
// 같은 Supabase 프로젝트라 realtime 동작은 로컬/라이브 동일하지만, 요청대로 배포본을 직접 친다.
test.use({ baseURL: "https://keyboard-community.vercel.app" });

const db = serviceClient();
const acc = newEmail("rt");
const nick = newNickname("rt");
let user: User;

test.beforeAll(async () => {
  user = await createUser(acc.email, nick, { confirmed: true });
});
test.afterAll(async () => {
  await deleteUserByEmail(acc.email).catch(() => {});
});

test("알림 INSERT → 새로고침 없이 종 배지 증가(realtime)", async ({ page }) => {
  await loginViaUI(page, acc.email);
  // 로그인 후 헤더의 종이 보일 때까지(로그인 상태 = BellMenu 노출).
  const bell = page.getByRole("button", { name: /알림/ });
  await expect(bell).toBeVisible({ timeout: 30_000 });
  // 아직 안 읽음 배지 없음.
  await expect(page.getByRole("button", { name: /안 읽음/ })).toHaveCount(0);

  // Realtime 구독(getSession→setAuth→subscribe)이 자리잡을 시간을 잠깐 준다.
  await page.waitForTimeout(4000);

  // 다른 행위 시뮬레이션: 본인 알림 1건 직접 INSERT(트리거와 동일 경로).
  const { error } = await db
    .from("notifications")
    .insert({ user_id: user.id, type: "notice" });
  expect(error).toBeFalsy();

  // 페이지 리로드 없이 배지가 떠야 한다(realtime → router.refresh).
  await expect(page.getByRole("button", { name: /안 읽음/ })).toBeVisible({
    timeout: 25_000,
  });
});
