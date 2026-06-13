import { test, expect, type Page } from "@playwright/test";
import { newEmail, newNickname } from "./helpers/data";
import { loginViaUI } from "./helpers/auth";
import { createUser, deleteUserByEmail } from "./helpers/admin";
import { fillBody } from "./helpers/post";

// 커뮤니티 게시판 핵심 UI 흐름(글 작성·댓글·좋아요·마크다운/XSS·마이페이지·가드).
// 데이터 계층(트리거·카운터·알림)은 scripts/verify-phase*.mjs가 검증 — 여기선 브라우저 흐름만.
// 메일 없이 admin API로 확인된 계정을 만들고 UI로 로그인한다.

const user = newEmail("comm");
const nick = newNickname("comm");

test.beforeAll(async () => {
  await createUser(user.email, nick, { confirmed: true });
});
test.afterAll(async () => {
  // 유저 삭제 → profiles·posts·comments·likes 까지 FK cascade로 정리.
  await deleteUserByEmail(user.email).catch(() => {});
});

// /community/new 에서 글 작성 → 상세 URL 반환.
async function createPost(
  page: Page,
  {
    title,
    body,
    category = "자유",
    tags,
  }: { title: string; body: string; category?: string; tags?: string },
): Promise<string> {
  await page.goto("/community/new");
  await page.locator("#category_id").selectOption({ label: category });
  await page.locator("#title").fill(title);
  await fillBody(page, body);
  if (tags) await page.locator("#tags").fill(tags);
  await page.getByRole("button", { name: "등록" }).click();
  await page.waitForURL(/\/community\/[0-9a-f-]{36}/i, { timeout: 30_000 });
  return page.url();
}

test("글 작성 → 상세에 제목·본문 노출", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });

  const title = `E2E 글 ${Date.now()}`;
  await createPost(page, { title, body: "본문 내용입니다." });

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("본문 내용입니다.")).toBeVisible();
});

test("댓글 작성 → 목록에 노출", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await createPost(page, { title: `댓글테스트 ${Date.now()}`, body: "x" });

  const comment = `좋은 글이네요 ${Date.now()}`;
  await page.locator('textarea[name="body"]').fill(comment);
  await page.getByRole("button", { name: "등록" }).click();

  await expect(page.getByText(comment)).toBeVisible();
  await expect(page.getByText("댓글 1")).toBeVisible();
});

test("좋아요 토글 → ♡↔♥ + 카운트 변화", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  await createPost(page, { title: `좋아요테스트 ${Date.now()}`, body: "x" });

  const like = page.getByRole("button", { name: /[♡♥]/ }).first();
  await expect(like).toContainText("♡");
  await like.click();
  await expect(page.getByRole("button", { name: /♥/ }).first()).toContainText("1");
  // 취소
  await page.getByRole("button", { name: /♥/ }).first().click();
  await expect(page.getByRole("button", { name: /♡/ }).first()).toBeVisible();
});

test("본문 마크다운 렌더 + XSS 무력화", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });

  const body = [
    "**굵게렌더** 일반텍스트",
    "",
    "<script>window.__xss=1</script>",
    "",
    "[위험링크](javascript:alert(1))",
  ].join("\n");
  await createPost(page, { title: `마크다운 ${Date.now()}`, body });

  // 마크다운: **굵게** → <strong>
  await expect(page.locator("strong").filter({ hasText: "굵게렌더" })).toBeVisible();
  // XSS: 주입 <script>가 실제 DOM 스크립트로 들어가지 않음
  await expect(page.locator("article script")).toHaveCount(0);
  // XSS: javascript: 링크가 만들어지지 않음(react-markdown URL sanitize)
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  // 스크립트가 실행되지 않았음(전역 오염 없음)
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

test("마이페이지 — 내 글 탭에 방금 쓴 글", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  const title = `마이페이지글 ${Date.now()}`;
  await createPost(page, { title, body: "x" });

  await page.goto("/community/me");
  await expect(page.getByRole("heading", { name: "마이페이지", exact: true })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();

  // 좋아요한 글 탭은 비어 있음(아직 좋아요 안 함)
  await page.getByRole("link", { name: "좋아요한 글" }).click();
  await expect(page.getByText("아직 좋아요한 글이 없어요.")).toBeVisible();
});

test("북마크 토글 → 마이페이지 '저장' 탭", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  const title = `북마크글 ${Date.now()}`;
  await createPost(page, { title, body: "x" });

  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("button", { name: "저장됨" })).toBeVisible();

  await page.goto("/community/me?tab=bookmarks");
  await expect(page.getByText(title)).toBeVisible();
});

test("상세 태그 클릭 → 태그 필터 목록", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  const tag = `태그${Date.now()}`;
  const title = `태그글 ${Date.now()}`;
  await createPost(page, { title, body: "x", tags: tag });

  await page.getByRole("link", { name: `#${tag}` }).click();
  await page.waitForURL(new RegExp(`tag=`), { timeout: 30_000 });
  await expect(page.getByText(title)).toBeVisible();
});

test("공개 프로필 → 작성글 + 활동요약 노출", async ({ page }) => {
  await loginViaUI(page, user.email);
  await page.waitForURL(/\/community/, { timeout: 30_000 });
  const title = `프로필글 ${Date.now()}`;
  await createPost(page, { title, body: "x" });

  await page.goto(`/community/u/${encodeURIComponent(nick)}`);
  await expect(page.getByRole("heading", { name: nick })).toBeVisible();
  await expect(page.getByText("받은 좋아요")).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
});

test("비로그인 글쓰기 접근 → /login 리다이렉트", async ({ page }) => {
  await page.goto("/community/new");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});
