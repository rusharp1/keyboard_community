import { test, expect, type Page } from "@playwright/test";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";

// 라이브(Vercel) 2계정 도감 리뷰: A·B가 같은 축에 다축 별점 → 개수 합산·서로의 리뷰 노출.
// 기존 리뷰가 있을 수 있어 baseline을 읽고 +1/+2로 비파괴 검증(평균은 baseline=0일 때만 단언).
test.use({ baseURL: "https://keyboard-community.vercel.app" });

const db = serviceClient();
const a = newEmail("rv2a");
const aNick = newNickname("rv2a");
const b = newEmail("rv2b");
const bNick = newNickname("rv2b");

test.beforeAll(async () => {
  await createUser(a.email, aNick, { confirmed: true });
  await createUser(b.email, bNick, { confirmed: true });
});
test.afterAll(async () => {
  // 계정 삭제 → reviews FK cascade로 정리.
  await deleteUserByEmail(a.email).catch(() => {});
  await deleteUserByEmail(b.email).catch(() => {});
});

async function gotoFirstSwitch(page: Page): Promise<string> {
  await page.goto("/switches");
  await page.locator('a[href^="/switches/"]').first().click();
  await page.waitForURL(/\/switches\/[^/]+$/, { timeout: 30_000 });
  return page.url();
}

async function submitReview(page: Page, star: number) {
  for (const label of ["키감", "소리", "가성비"]) {
    await page.getByRole("button", { name: `${label} ${star}점` }).click();
  }
  await page.getByRole("button", { name: /등록|수정/ }).click();
}

test("A·B 두 계정 리뷰 → 개수 합산 + 서로의 리뷰 노출", async ({ browser }) => {
  // 대상 슬러그 확보 + 기존 리뷰 수(baseline).
  const ctxA = await browser.newContext();
  const aPage = await ctxA.newPage();
  await loginViaUI(aPage, a.email);
  await aPage.waitForURL(/\/community/, { timeout: 30_000 });
  const url = await gotoFirstSwitch(aPage);
  const slug = url.split("/").pop()!;

  const { data: base } = await db
    .from("review_stats")
    .select("n")
    .eq("item_type", "switch")
    .eq("item_slug", slug)
    .maybeSingle();
  const baseline = base ? Number(base.n) : 0;

  // A: 5점 리뷰 → 개수 baseline+1.
  await submitReview(aPage, 5);
  await expect(aPage.getByText(`${baseline + 1}개의 평가`)).toBeVisible({ timeout: 30_000 });

  // B: 같은 축으로 → A 리뷰가 보이고, 1점 리뷰 후 개수 baseline+2.
  const ctxB = await browser.newContext();
  const bPage = await ctxB.newPage();
  await loginViaUI(bPage, b.email);
  await bPage.waitForURL(/\/community/, { timeout: 30_000 });
  await bPage.goto(url);

  await expect(bPage.getByText(`${baseline + 1}개의 평가`)).toBeVisible({ timeout: 30_000 });
  await expect(bPage.getByText(aNick)).toBeVisible(); // A의 리뷰가 B에게 보임

  await submitReview(bPage, 1);
  await expect(bPage.getByText(`${baseline + 2}개의 평가`)).toBeVisible({ timeout: 30_000 });

  // 두 작성자 닉네임 모두 "리뷰 목록"에 노출(헤더의 로그인 닉네임과 구분 위해 리스트로 스코핑).
  const reviewList = bPage.getByRole("list").filter({ hasText: aNick });
  await expect(reviewList.getByText(aNick)).toBeVisible();
  await expect(reviewList.getByText(bNick)).toBeVisible();

  // 기존 리뷰가 없던 경우에만 평균을 단언(5점·1점 → 종합 3.0).
  if (baseline === 0) {
    await expect(bPage.getByText("3.0").first()).toBeVisible();
  }

  // A가 새로고침하면 개수 baseline+2 반영.
  await aPage.goto(url);
  await expect(aPage.getByText(`${baseline + 2}개의 평가`)).toBeVisible({ timeout: 30_000 });

  await ctxA.close();
  await ctxB.close();
});
