import { test, expect } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail, serviceClient } from "./helpers/admin";

// 벌점제(Phase 8) — 운영자 부과 UI 2계정 흐름.
// 운영자(admin)가 검토큐에서 벌점 부과 → (a)작성자 누적점수 갱신·"벌점 부과됨" 중복차단,
// (b)작성자에게 'penalty' 종 알림 도착, (c)작성자 /community/me 제재 배너.
// 신고 5건 자동숨김 픽스처는 service_role로 시드(검토큐 진입 조건).

const db = serviceClient();

const adminAcc = newEmail("padm");
const adminNick = newNickname("padm");
const victim = newEmail("pvic");
const victimNick = newNickname("pvic");
let adminUser: User;
let victimUser: User;
let postId: string;
const reporterEmails: string[] = [];

test.beforeAll(async () => {
  // 운영자(admin) + 피해 작성자.
  adminUser = await createUser(adminAcc.email, adminNick, { confirmed: true });
  await db.from("profiles").update({ role: "admin" }).eq("id", adminUser.id);
  victimUser = await createUser(victim.email, victimNick, { confirmed: true });

  // 작성자 글 1개(자유 카테고리).
  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .single();
  const { data: post } = await db
    .from("posts")
    .insert({
      user_id: victimUser.id,
      category_id: cat.id,
      title: `[검증] 운영자 벌점 부과 ${Date.now()}`,
      body: "신고 누적 → 검토큐 → 벌점 부과 흐름 검증용.",
    })
    .select("id")
    .single();
  postId = post.id;

  // 서로 다른 신고자 5명 → 자동숨김 + 검토큐 등장.
  const reasons = ["spam", "abuse", "offtopic", "sexual", "etc"];
  for (let i = 0; i < 5; i++) {
    const e = newEmail(`prep${i}`);
    reporterEmails.push(e.email);
    const r = await createUser(e.email, newNickname(`prep${i}`), { confirmed: true });
    const { error } = await db.from("reports").insert({
      reporter_id: r.id,
      target_type: "post",
      target_id: postId,
      reason: reasons[i],
    });
    if (error) throw error;
  }
});

test.afterAll(async () => {
  // 글·신고 먼저 정리 후 계정 삭제(신고는 글 FK가 없어 수동).
  await db.from("reports").delete().eq("target_type", "post").eq("target_id", postId);
  await db.from("posts").delete().eq("id", postId);
  await deleteUserByEmail(adminAcc.email).catch(() => {});
  await deleteUserByEmail(victim.email).catch(() => {});
  for (const e of reporterEmails) await deleteUserByEmail(e).catch(() => {});
});

test("운영자가 검토큐에서 벌점 부과 → 작성자 누적·중복차단·알림·배너", async ({
  page,
  browser,
}) => {
  // 사전 조건: 신고 5건으로 자동숨김됐는지(검토큐 진입).
  const { data: hiddenPost } = await db
    .from("posts")
    .select("is_hidden")
    .eq("id", postId)
    .single();
  expect(hiddenPost?.is_hidden).toBe(true);

  // 1) 운영자 로그인 → 검토큐 진입. confirm 다이얼로그는 자동 수락.
  page.on("dialog", (d) => d.accept());
  await loginViaUI(page, adminAcc.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.goto("/community/admin");
  await expect(page.getByRole("heading", { name: "운영", exact: true })).toBeVisible();

  // 대상 카드: 작성자 닉네임으로 스코핑(큐에 다른 항목이 섞여도 안전).
  const card = page.locator("div.rounded-lg").filter({ hasText: victimNick });
  await expect(card.getByText(/누적 벌점/)).toContainText("0점");

  // 2) 벌점 부과(심각도 보통 +2).
  await card.getByRole("combobox").selectOption({ label: "보통 (+2)" });
  await card.getByPlaceholder("사유 메모(선택)").fill("검증용 부과");
  await card.getByRole("button", { name: "벌점 부과" }).click();

  // 3) 부과 후: 같은 콘텐츠는 "벌점 부과됨"으로 잠김(중복 차단 UI).
  await expect(page.getByText("벌점 부과됨")).toBeVisible({ timeout: 30_000 });

  // 4) DB 확인: 작성자 누적 2점 + 'penalty' 알림 1건.
  const { data: prof } = await db
    .from("profiles")
    .select("penalty_points")
    .eq("id", victimUser.id)
    .single();
  expect(prof?.penalty_points).toBe(2);
  const { count } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", victimUser.id)
    .eq("type", "penalty");
  expect(count).toBe(1);

  // 5) 작성자 계정(2번째 컨텍스트): 종 배지 + 마이페이지 제재 배너.
  const ctx = await browser.newContext();
  const vp = await ctx.newPage();
  await loginViaUI(vp, victim.email);
  await vp.waitForURL(/\/community/, { timeout: 30_000 });

  // 종 배지(안 읽음) — aria-label에 "안 읽음".
  await expect(vp.getByRole("button", { name: /안 읽음/ })).toBeVisible({ timeout: 30_000 });

  await vp.goto("/community/me");
  await expect(vp.getByText(/누적 벌점/)).toBeVisible();
  await expect(vp.getByText(/\+2점/)).toBeVisible();
  await ctx.close();
});

test("admin이 제재 관리에서 영구정지 해제 → 차단 풀림", async ({ page }) => {
  // 작성자를 영구정지 상태로 세팅(제재 관리 목록 진입 조건).
  await db
    .from("profiles")
    .update({ penalty_points: 10, is_banned: true, suspended_until: null })
    .eq("id", victimUser.id);

  page.on("dialog", (d) => d.accept());
  await loginViaUI(page, adminAcc.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await page.goto("/community/admin");

  // 제재 관리 섹션 행: 작성자 + "영구정지"로 스코핑(검토큐 카드와 구분).
  const row = page
    .locator("div.rounded-lg")
    .filter({ hasText: victimNick })
    .filter({ hasText: "영구정지" });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole("button", { name: "제재 해제" }).click();

  // 해제 반영: is_banned=false, 누적 벌점 0.
  await expect(async () => {
    const { data } = await db
      .from("profiles")
      .select("is_banned, penalty_points")
      .eq("id", victimUser.id)
      .single();
    expect(data?.is_banned).toBe(false);
    expect(data?.penalty_points).toBe(0);
  }).toPass({ timeout: 15_000 });
});
