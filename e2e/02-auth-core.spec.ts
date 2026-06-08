import { test, expect } from "@playwright/test";
import { newEmail, newNickname } from "./helpers/data";
import { signupViaUI, loginViaUI } from "./helpers/auth";
import {
  createUser,
  confirmCallbackPath,
  recoveryCallbackPath,
  deleteUserByEmail,
} from "./helpers/admin";

// 메일을 보내지 않는 코어 케이스(admin API로 계정 상태/토큰 직접 생성).
// 언제든 실행 가능 — Supabase 메일 한도와 무관.

const created: string[] = [];
test.afterAll(async () => {
  for (const email of created) await deleteUserByEmail(email).catch(() => {});
});

test("TC-1-3 닉네임 중복 차단", async ({ page }) => {
  const nick = newNickname("dup");
  const existing = newEmail("nick");
  await createUser(existing.email, nick, { confirmed: true });
  created.push(existing.email);

  await signupViaUI(page, { email: newEmail("nick2").email, nickname: nick });
  await expect(page.getByText("이미 사용 중인 닉네임입니다.")).toBeVisible();
});

test("TC-1-5 중복(확인된) 이메일 가입 차단", async ({ page }) => {
  const u = newEmail("dupmail");
  await createUser(u.email, newNickname("dm"), { confirmed: true });
  created.push(u.email);

  await signupViaUI(page, { email: u.email, nickname: newNickname("dm2") });
  await expect(
    page.getByText("이미 가입된 이메일입니다.", { exact: false }),
  ).toBeVisible();
});

test("TC-2-1 이메일 인증(토큰) → /community", async ({ page }) => {
  const u = newEmail("confirm");
  created.push(u.email);
  // generateLink('signup')이 미확인 유저를 생성하고 token_hash 발급(닉네임 필요)
  const path = await confirmCallbackPath(u.email, newNickname("cf"));
  await page.goto(path);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
});

test("TC-3-1 정상 로그인 → /community", async ({ page }) => {
  const u = newEmail("login");
  await createUser(u.email, newNickname("li"), { confirmed: true });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
});

test("TC-5-1 로그인 상태 헤더(닉네임/로그아웃)", async ({ page }) => {
  const u = newEmail("hdr");
  const nick = newNickname("hd");
  await createUser(u.email, nick, { confirmed: true });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await expect(page.getByText(nick)).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
});

test("TC-3-4 기 로그인 사용자가 /login 접근 → 홈 리다이렉트", async ({ page }) => {
  const u = newEmail("redir");
  await createUser(u.email, newNickname("rd"), { confirmed: true });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.goto("/login");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
});

test("TC-3-4b /signup — 비로그인 시 가입 탭, 기로그인 시 홈 리다이렉트", async ({ page }) => {
  // 비로그인: /signup → 회원가입 폼(가입 탭이 기본)
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
  await expect(page.locator("#signup-nickname")).toBeVisible();

  // 로그인 후: /signup → 홈
  const u = newEmail("signupredir");
  await createUser(u.email, newNickname("sr"), { confirmed: true });
  created.push(u.email);
  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.goto("/signup");
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
});

test("TC-5-3 로그아웃 → 홈 리다이렉트", async ({ page }) => {
  const u = newEmail("logout");
  await createUser(u.email, newNickname("lo"), { confirmed: true });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
});

test("TC-4-2 재설정 링크 → /auth/reset → 새 비번 → /community", async ({ page }) => {
  const u = newEmail("reset");
  await createUser(u.email, newNickname("rs"), { confirmed: true });
  created.push(u.email);

  const path = await recoveryCallbackPath(u.email);
  await page.goto(path);
  await page.waitForURL(/\/auth\/reset/, { timeout: 30_000 });
  await page.locator("#new-password").fill("test456!");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();
  await page.waitForURL(/\/community/, { timeout: 30_000 });
});

test("TC-1-4 닉네임 동시성 → 같은 닉네임 동시 생성 시 하나만 성공", async () => {
  // 사전 체크를 우회(admin)하고 동시에 같은 닉네임 생성 → 최종 방어인
  // lower(nickname) unique index가 하나만 통과시키는지 검증.
  const nick = newNickname("race");
  const e1 = newEmail("race1");
  const e2 = newEmail("race2");
  created.push(e1.email, e2.email);

  const results = await Promise.allSettled([
    createUser(e1.email, nick, { confirmed: true }),
    createUser(e2.email, nick, { confirmed: true }),
  ]);
  const ok = results.filter((r) => r.status === "fulfilled").length;
  expect(ok).toBe(1);
});

test("TC-3-2(코어) 미인증 로그인 → 안내 + 재발송 버튼 노출", async ({ page }) => {
  const u = newEmail("unconf");
  await createUser(u.email, newNickname("uc"), { confirmed: false });
  created.push(u.email);

  await loginViaUI(page, u.email);
  await expect(
    page.getByText("이메일 확인이 필요합니다.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "확인 메일 다시 보내기" }),
  ).toBeVisible();
});
