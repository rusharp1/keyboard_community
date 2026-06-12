// 도감 3종(축·키캡·키보드) 공용 접근자 — 리뷰/태깅이 (item_type, item_slug)로 참조.
// 도감은 정적 데이터라 DB FK가 없으므로 유효성·표시는 여기서 해결한다.
import { switches } from "@/data/switches";
import { keycaps } from "@/data/keycaps";
import { keyboards } from "@/data/keyboards";

export type ItemType = "switch" | "keycap" | "keyboard";

export const ITEM_TYPES: ItemType[] = ["switch", "keycap", "keyboard"];

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  switch: "축",
  keycap: "키캡",
  keyboard: "키보드",
};

// 타입별 리뷰 축 라벨(다축 별점). [axis1, axis2, axis3] 순서, 3번째는 공통 '가성비'.
// ⚠️ DB reviews.axis1/2/3는 숫자만 — 이 라벨이 단일 출처. 순서 변경은 마이그레이션 주의.
export const REVIEW_AXES: Record<ItemType, [string, string, string]> = {
  switch: ["키감", "소리", "가성비"],
  keycap: ["타건감", "색감·마감", "가성비"],
  keyboard: ["빌드품질", "소리", "가성비"],
};

const TABLE: Record<ItemType, { slug: string; nameKo: string }[]> = {
  switch: switches,
  keycap: keycaps,
  keyboard: keyboards,
};

const BASE_PATH: Record<ItemType, string> = {
  switch: "switches",
  keycap: "keycaps",
  keyboard: "keyboards",
};

export function isItemType(t: string): t is ItemType {
  return t === "switch" || t === "keycap" || t === "keyboard";
}

// 도감 항목 메타(이름·링크). 없는 slug면 null → 리뷰/태그 유효성 검증에 사용.
export function getItemMeta(
  type: string,
  slug: string,
): { type: ItemType; nameKo: string; href: string } | null {
  if (!isItemType(type)) return null;
  const found = TABLE[type].find((x) => x.slug === slug);
  if (!found) return null;
  return { type, nameKo: found.nameKo, href: `/${BASE_PATH[type]}/${slug}` };
}

// PostForm 아이템 태깅 SearchableSelect용. value="type:slug".
export function allItemOptions(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (const t of ITEM_TYPES) {
    for (const x of TABLE[t]) {
      out.push({ value: `${t}:${x.slug}`, label: `[${ITEM_TYPE_LABEL[t]}] ${x.nameKo}` });
    }
  }
  return out;
}

// "type:slug" 파싱 + 유효성. 유효하면 {type, slug}, 아니면 null.
export function parseItemRef(
  ref: string,
): { type: ItemType; slug: string } | null {
  const [type, slug] = ref.split(":");
  if (!type || !slug) return null;
  if (!getItemMeta(type, slug)) return null;
  return { type: type as ItemType, slug };
}
