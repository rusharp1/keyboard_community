import { test, expect, type Page } from "@playwright/test";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";
import { fillBody } from "./helpers/post";

// 도감 리뷰(Phase 9) — 다축 별점 작성/수정 + 아이템 태깅 후기 연결.
// 데이터 계층(집계·중복·자동숨김)은 scripts/verify-phase9.mjs가 검증 — 여기선 브라우저 흐름.
// 선행: community.sql Phase 9 적용 필요(reviews/review_stats/posts.item_*).

const db = serviceClient();
const acc = newEmail("rv");
const nick = newNickname("rv");

test.beforeAll(async () => {
  await createUser(acc.email, nick, { confirmed: true });
});
test.afterAll(async () => {
  // 작성 리뷰/글 정리 후 계정 삭제(계정 삭제 시 cascade로도 정리됨).
  await deleteUserByEmail(acc.email).catch(() => {});
});

// 첫 번째 축 상세로 이동 → slug 반환.
async function gotoFirstSwitch(page: Page): Promise<string> {
  await page.goto("/switches");
  const first = page.locator('a[href^="/switches/"]').first();
  await first.click();
  await page.waitForURL(/\/switches\/[^/]+$/, { timeout: 30_000 });
  return page.url();
}

// 평가 폼에서 3축 모두 별점 클릭 후 등록/수정.
async function submitReview(page: Page, axes: string[], star: number) {
  for (const label of axes) {
    await page.getByRole("button", { name: `${label} ${star}점` }).click();
  }
  await page.getByRole("button", { name: /등록|수정/ }).click();
}

test("축 상세에서 다축 별점 작성 → 평균·목록 반영, 재작성=수정(upsert)", async ({ page }) => {
  await loginViaUI(page, acc.email);
  await page.waitForURL(/\/community|\//, { timeout: 30_000 });
  const url = await gotoFirstSwitch(page);

  const axes = ["키감", "소리", "가성비"]; // switch REVIEW_AXES
  await submitReview(page, axes, 5);

  // 평균 요약(5.0) + 내 리뷰가 목록에 노출.
  await expect(page.getByText("1개의 평가")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("5.0").first()).toBeVisible();

  // 재작성(2점) → upsert: 여전히 1개, 평균 갱신.
  await page.goto(url);
  await submitReview(page, axes, 2);
  await expect(page.getByText("1개의 평가")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("2.0").first()).toBeVisible();
});

test("글쓰기 아이템 태깅 → 도감 상세 '관련 후기 글' 노출", async ({ page }) => {
  await loginViaUI(page, acc.email);
  await page.waitForURL(/\/community|\//, { timeout: 30_000 });
  const url = await gotoFirstSwitch(page);
  const slug = url.split("/").pop()!;
  const itemName = await page
    .getByRole("heading", { level: 1 })
    .first()
    .textContent();

  // 글 작성 + 아이템 태깅.
  await page.goto("/community/new");
  await page.locator("#category_id").selectOption({ label: "자유" });
  const title = `리뷰연동글 ${Date.now()}`;
  await page.locator("#title").fill(title);
  await fillBody(page, "도감 태깅 검증");
  // 도감 항목 SearchableSelect: "선택 안 함" 버튼 열고 검색 → 항목 선택.
  await page.getByRole("button", { name: /선택 안 함/ }).click();
  await page.getByPlaceholder("도감 항목 검색...").fill(itemName?.trim().slice(0, 6) ?? slug);
  await page.getByRole("button", { name: new RegExp(`\\[축\\]`) }).first().click();
  await page.getByRole("button", { name: "등록" }).click();
  await page.waitForURL(/\/community\/[0-9a-f-]{36}/i, { timeout: 30_000 });

  // 도감 상세 → 관련 후기 글에 노출.
  await page.goto(url);
  await expect(page.getByText("관련 후기 글")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(title)).toBeVisible();
});
