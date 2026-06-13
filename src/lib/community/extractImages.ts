// 본문 마크다운에서 이미지 URL을 순서대로 추출(중복 제거·상한 캡).
// 글 작성/수정 시 posts.images를 본문 기준으로 채워 목록 썸네일 등에 쓴다.
// 생성 이미지가 ![alt](url) 형태라 url은 공백/')' 전까지로 충분히 잡힌다.
const IMG_RE = /!\[[^\]]*\]\(\s*([^\s)]+)/g;
const MAX = 10;

export function extractImageUrls(markdown: string): string[] {
  const seen = new Set<string>();
  for (const m of markdown.matchAll(IMG_RE)) {
    const url = m[1];
    if (url) seen.add(url);
    if (seen.size >= MAX) break;
  }
  return [...seen];
}
