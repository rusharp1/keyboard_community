import { test, expect, type Page } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, setSanction } from "./helpers/admin";
import { fillBody } from "./helpers/post";

// 벌점제(Phase 8) — 기간 기반 활동정지 게이트(requireWriteAccess) 검증.
// 데이터 계층(누적·임계값→suspended_until/is_banned)은 scripts/verify-phase8.mjs가 검증.
// 여기선 suspended_until을 미래/과거로 직접 세팅해 "기간에 맞춰 차단/해제"되는지 본다.

const u = newEmail("pen");
const nick = newNickname("pen");
let user: User;

const future = () => new Date(Date.now() + 7 * 86_400_000).toISOString(); // 7일 뒤
const past = () => new Date(Date.now() - 60_000).toISOString(); // 1분 전(만료)

test.beforeAll(async () => {
  user = await createUser(u.email, nick, { confirmed: true });
});
test.afterAll(async () => {
  await deleteUserByEmail(u.email).catch(() => {});
});

async function login(page: Page) {
  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
}

test("정지 만료 전(미래) — 글쓰기 차단 → /community/me + 정지 배너", async ({ page }) => {
  await setSanction(user.id, {
    penalty_points: 5,
    suspended_until: future(),
    is_banned: false,
  });
  await login(page);

  await page.goto("/community/new");
  await page.waitForURL(/\/community\/me/, { timeout: 30_000 });
  await expect(page.getByText(/활동정지 중/)).toBeVisible();
});

test("정지 만료 후(과거) — 글쓰기 폼 정상 노출(해제)", async ({ page }) => {
  await setSanction(user.id, {
    penalty_points: 5,
    suspended_until: past(),
    is_banned: false,
  });
  await login(page);

  await page.goto("/community/new");
  // 리다이렉트 없이 글쓰기 폼이 보인다.
  await expect(page.locator("#title")).toBeVisible();
  await expect(page).toHaveURL(/\/community\/new/);
});

test("영구정지(is_banned) — 글쓰기 차단 → /community/me + 영구정지 배너", async ({ page }) => {
  await setSanction(user.id, {
    penalty_points: 10,
    suspended_until: null,
    is_banned: true,
  });
  await login(page);

  await page.goto("/community/new");
  await page.waitForURL(/\/community\/me/, { timeout: 30_000 });
  await expect(page.getByText(/영구 이용정지/)).toBeVisible();
});

test("정지 중 댓글 작성 시도 → 액션 가드가 /community/me로 차단", async ({ page }) => {
  // 1) 깨끗한 상태에서 댓글 달 글 1개 생성.
  await setSanction(user.id, {
    penalty_points: 0,
    suspended_until: null,
    is_banned: false,
  });
  await login(page);
  await page.goto("/community/new");
  await page.locator("#category_id").selectOption({ label: "자유" });
  await page.locator("#title").fill(`정지댓글테스트 ${Date.now()}`);
  await fillBody(page, "x");
  await page.getByRole("button", { name: "등록" }).click();
  await page.waitForURL(/\/community\/[0-9a-f-]{36}/i, { timeout: 30_000 });
  const postUrl = page.url();

  // 2) 정지시킨 뒤 같은 글에서 댓글 제출 → 서버 액션(requireWriteAccess)이 막는다.
  await setSanction(user.id, {
    penalty_points: 5,
    suspended_until: future(),
    is_banned: false,
  });
  await page.goto(postUrl);
  await page.locator('textarea[name="body"]').fill(`막혀야함 ${Date.now()}`);
  await page.getByRole("button", { name: "등록" }).click();
  await page.waitForURL(/\/community\/me/, { timeout: 30_000 });
});

// 비교군: 제재 없는 정상 유저는 글쓰기 폼이 그대로 보인다(회귀 방지).
test("제재 없음 — 글쓰기 폼 정상(회귀)", async ({ page }) => {
  await setSanction(user.id, {
    penalty_points: 0,
    suspended_until: null,
    is_banned: false,
  });
  await login(page);
  await page.goto("/community/new");
  await expect(page.locator("#title")).toBeVisible();
});
