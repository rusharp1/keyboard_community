import { test, expect } from "@playwright/test";
import { PASSWORD, newEmail, newNickname } from "./helpers/data";

// 메일 발송/수신이 필요 없는 검증 케이스 모음.
// (Zod 검증은 Supabase 호출 전에 실패하므로 메일이 나가지 않는다.)

test.describe("TC-1-2 회원가입 폼 유효성", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "회원가입" }).click();
  });

  test("비밀번호 7자 이하 → 차단", async ({ page }) => {
    await page.locator("#signup-email").fill(newEmail("val").email);
    await page.locator("#signup-nickname").fill(newNickname());
    await page.locator("#signup-password").fill("test12"); // 6자
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible();
  });

  test("닉네임 2자 미만 → 차단", async ({ page }) => {
    await page.locator("#signup-email").fill(newEmail("val").email);
    await page.locator("#signup-nickname").fill("a");
    await page.locator("#signup-password").fill(PASSWORD);
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("닉네임은 2자 이상이어야 합니다.")).toBeVisible();
  });

  test("닉네임 허용되지 않은 특수문자 → 차단", async ({ page }) => {
    await page.locator("#signup-email").fill(newEmail("val").email);
    await page.locator("#signup-nickname").fill("bad@nick");
    await page.locator("#signup-password").fill(PASSWORD);
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(
      page.getByText("닉네임은 한글·영문·숫자·밑줄(_)만 가능합니다."),
    ).toBeVisible();
  });

  test("이메일 형식 오류 → 브라우저 기본 검증으로 제출 차단", async ({ page }) => {
    const emailInput = page.locator("#signup-email");
    await emailInput.fill("not-an-email");
    await page.locator("#signup-nickname").fill(newNickname());
    await page.locator("#signup-password").fill(PASSWORD);
    await page.getByRole("button", { name: "가입하기" }).click();
    // HTML5 type=email 검증에 걸려 제출되지 않음 → 입력값 validity가 invalid
    const valid = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid,
    );
    expect(valid).toBe(false);
  });
});

test("TC-2-2 변조/만료된 인증 링크 → /login?error=auth", async ({ page }) => {
  await page.goto("/auth/callback?code=invalid-code-xyz");
  await page.waitForURL(/\/login\?error=auth/);
  expect(page.url()).toContain("/login?error=auth");
});

test("TC-3-3 잘못된 자격증명 → 공통 에러 메시지", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#login-email").fill(newEmail("nope").email);
  await page.locator("#login-password").fill("wrongpass1");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByText("이메일 또는 비밀번호가 올바르지 않습니다."),
  ).toBeVisible();
});

test("TC-4-3 새 비밀번호 8자 미만 → 차단", async ({ page }) => {
  await page.goto("/auth/reset");
  await page.locator("#new-password").fill("test12"); // 6자
  await page.getByRole("button", { name: "비밀번호 변경" }).click();
  await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible();
});
