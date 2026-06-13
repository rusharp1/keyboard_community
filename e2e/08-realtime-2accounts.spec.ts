import { test, expect, type Page } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";
import { fillBody } from "./helpers/post";

// 라이브(Vercel) 2계정 실시간: A가 글 상세에 머문 채(리로드 없음) B가 댓글/좋아요를 하면
// A의 헤더 종 배지가 즉시 증가하는지. 댓글은 기본 ON, 좋아요는 기본 OFF라 A의 like_bell을 켠다.
test.use({ baseURL: "https://keyboard-community.vercel.app" });

const db = serviceClient();
const aAcc = newEmail("rtA");
const aNick = newNickname("rtA");
const bAcc = newEmail("rtB");
const bNick = newNickname("rtB");
let aUser: User;
let bUser: User;

test.beforeAll(async () => {
  aUser = await createUser(aAcc.email, aNick, { confirmed: true });
  bUser = await createUser(bAcc.email, bNick, { confirmed: true });
});
test.afterAll(async () => {
  await deleteUserByEmail(aAcc.email).catch(() => {});
  await deleteUserByEmail(bAcc.email).catch(() => {});
});

async function createPost(page: Page, title: string): Promise<string> {
  await page.goto("/community/new");
  await page.locator("#category_id").selectOption({ label: "자유" });
  await page.locator("#title").fill(title);
  await fillBody(page, "2계정 실시간 검증용 글");
  await page.getByRole("button", { name: "등록" }).click();
  await page.waitForURL(/\/community\/[0-9a-f-]{36}/i, { timeout: 30_000 });
  return page.url();
}

test("B 댓글/좋아요 → A 종 배지 새로고침 없이 0→1→2", async ({ browser }) => {
  // A: 로그인 → 글 작성 → 상세에 머문다(이후 리로드 금지).
  const ctxA = await browser.newContext();
  const aPage = await ctxA.newPage();
  await loginViaUI(aPage, aAcc.email);
  await aPage.waitForURL(/\/community/, { timeout: 30_000 });
  const postUrl = await createPost(aPage, `실시간2계정 ${Date.now()}`);

  // 종 노출 + 안 읽음 0. Realtime 구독이 자리잡을 시간을 준다.
  await expect(aPage.getByRole("button", { name: /알림/ })).toBeVisible();
  await expect(aPage.getByRole("button", { name: /안 읽음/ })).toHaveCount(0);
  await aPage.waitForTimeout(4000);

  // B: 로그인 → A의 글로 가서 댓글 작성.
  const ctxB = await browser.newContext();
  const bPage = await ctxB.newPage();
  await loginViaUI(bPage, bAcc.email);
  await bPage.waitForURL(/\/community/, { timeout: 30_000 });
  await bPage.goto(postUrl);
  await bPage.locator('textarea[name="body"]').fill(`안녕하세요 ${Date.now()}`);
  await bPage.getByRole("button", { name: "등록" }).click();
  await expect(bPage.getByText("댓글 1")).toBeVisible({ timeout: 30_000 });

  // A: 리로드 없이 종 배지 1.
  await expect(aPage.getByRole("button", { name: /1개 안 읽음/ })).toBeVisible({
    timeout: 25_000,
  });

  // 좋아요 알림은 기본 OFF → A의 like_bell을 켠 뒤 B가 좋아요.
  await db
    .from("notification_prefs")
    .upsert({ user_id: aUser.id, like_bell: true }, { onConflict: "user_id" });
  const likeBtn = bPage.getByRole("button", { name: /[♡♥]/ }).first();
  await expect(likeBtn).toContainText("♡");
  await likeBtn.click();
  await expect(bPage.getByRole("button", { name: /♥/ }).first()).toBeVisible();

  // A: 리로드 없이 종 배지 2.
  await expect(aPage.getByRole("button", { name: /2개 안 읽음/ })).toBeVisible({
    timeout: 25_000,
  });

  await ctxA.close();
  await ctxB.close();
});
