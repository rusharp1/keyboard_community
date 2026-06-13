import { type Page } from "@playwright/test";

// RichEditor(WYSIWYG) 본문 입력 — 마크다운 모드로 전환해 textarea에 그대로 채운다.
// (contenteditable 직접 타이핑은 마크다운 원문 보존이 안 돼 XSS/서식 검증에 부적합.)
export async function fillBody(page: Page, markdown: string) {
  await page.getByRole("button", { name: /마크다운/ }).click();
  await page.getByPlaceholder(/굵게/).fill(markdown);
}
