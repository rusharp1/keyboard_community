import { type Page } from "@playwright/test";
import { PASSWORD } from "./data";

// 회원가입 폼 제출(UI). 결과 메시지는 호출부에서 검증한다.
export async function signupViaUI(
  page: Page,
  { email, nickname, password = PASSWORD }: { email: string; nickname: string; password?: string },
) {
  await page.goto("/login");
  await page.getByRole("button", { name: "회원가입" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-nickname").fill(nickname);
  await page.locator("#signup-password").fill(password);
  await page.locator('form button[type="submit"]').click();
}

// 로그인 폼 제출(UI).
export async function loginViaUI(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.locator('form button[type="submit"]').click();
}
