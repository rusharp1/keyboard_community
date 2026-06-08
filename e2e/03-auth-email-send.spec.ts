import { test, expect } from "@playwright/test";
import { newEmail, newNickname } from "./helpers/data";
import { signupViaUI, loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail } from "./helpers/admin";

// 실제 메일을 발송하는 UI 경로를 검증하는 케이스.
// Supabase 시간당 발송 한도를 소비하므로, 한도가 남아 있을 때 실행한다.
// (admin으로 우회 불가 — 가입/재발송 UI 자체가 메일을 보내기 때문)

const created: string[] = [];
test.afterAll(async () => {
  for (const email of created) await deleteUserByEmail(email).catch(() => {});
});

test("TC-1-1 정상 회원가입 → 확인 메일 안내, 미로그인 상태", async ({ page }) => {
  const u = newEmail("signup");
  created.push(u.email);

  await signupViaUI(page, { email: u.email, nickname: newNickname("su") });
  await expect(page.getByText("확인 메일을 보냈습니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
});

test("TC-4-1 비밀번호 재설정 메일 발송 안내", async ({ page }) => {
  const u = newEmail("resetmail");
  await createUser(u.email, newNickname("rm"), { confirmed: true });
  created.push(u.email);

  await page.goto("/login");
  await page.getByRole("button", { name: "비밀번호를 잊으셨나요?" }).click();
  await page.locator("#forgot-email").fill(u.email);
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByText("비밀번호 재설정 메일을 보냈습니다.", { exact: false }),
  ).toBeVisible();
});

test("TC-1-6 미확인 이메일 재가입 → 오류 없이 재발송", async ({ page }) => {
  const u = newEmail("resend");
  await createUser(u.email, newNickname("rs1"), { confirmed: false });
  created.push(u.email);

  // 동일 이메일 재가입(닉네임은 새 값) → 중복 처리되지 않고 확인 메일 재발송
  await signupViaUI(page, { email: u.email, nickname: newNickname("rs2") });
  await expect(page.getByText("확인 메일을 보냈습니다.")).toBeVisible();
});

test("TC-3-2(재발송) 미인증 로그인 → 재발송 버튼 클릭 → 재발송", async ({ page }) => {
  const u = newEmail("resend2");
  await createUser(u.email, newNickname("re"), { confirmed: false });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await page.getByRole("button", { name: "확인 메일 다시 보내기" }).click();
  await expect(page.getByText("확인 메일을 다시 보냈습니다.")).toBeVisible();
});
