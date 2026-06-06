// 완성형 키보드 도감 시드 데이터
// 출처: AULA "독거미" 정본 목록(펀키스) + swagkey.kr(Swagkeys 등) 완제품.
// 한 모델이 색상 × 축 × 연결의 여러 변형을 가지므로 "모델 1개 = 항목 1개"로 두고
// 색상/연결은 배열, 번들 축은 축 도감(switches)과 slug로 크로스링크한다.
// 스펙·가격은 리비전/판매처에 따라 달라질 수 있어 불확실 항목은 needsInfo로 표기한다.

import { instagramTagUrl, getSwitchBySlug, type Keyswitch } from "./switches";

export type SwitchKind = "기계식" | "자석축(HE)" | "멤브레인";

export interface KbColor {
  name: string;
  hex: string;
  /** 출시예정(미발매) 색상 */
  upcoming?: boolean;
}

export interface Keyboard {
  slug: string;
  nameKo: string;
  nameEn?: string;
  brand: string;
  /** 배열 — "65%","75%","TKL(80%)","96%(1800)","풀배열(100%)","60%" 등 */
  layout: string;
  /** 연결 방식(복수 가능) */
  connections: string[];
  /** 스위치 종류 */
  switchKind: SwitchKind;
  /** 핫스왑 지원 여부 */
  hotswap: boolean;
  /** 케이스 재질 */
  material: string;
  /** LCD 디스플레이 탑재 */
  hasLCD?: boolean;
  /** 색상 옵션 */
  colors: KbColor[];
  /** 제공(번들) 축 — 축 도감 slug 참조. 멤브레인은 빈 배열 */
  availableSwitchSlugs?: string[];
  /** 최저 대략가(원) */
  priceFromKrw?: number;
  description?: string;
  needsInfo?: boolean;
  buyUrl?: string;
  instagramTags?: string[];
}

const SWAGKEY = "https://www.swagkey.kr/1816928659";

export const keyboards: Keyboard[] = [
  // ───────── AULA 독거미 (펀키스 정본) ─────────
  {
    slug: "aula-f65",
    nameKo: "AULA F65 독거미",
    nameEn: "AULA F65",
    brand: "AULA",
    layout: "65%",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "올리비아 화이트", hex: "#f0ebe0" },
      { name: "스카이 블랙", hex: "#2b2f36" },
    ],
    availableSwitchSlugs: [
      "ktt-sea-silent",
      "leobog-seiya",
      "aula-yellow-v3",
      "leobog-gyeonghae",
    ],
    priceFromKrw: 39000,
    description: "컴팩트한 65% 미니 배열의 독거미. 핫스왑·가스켓·트라이모드 무선·RGB를 갖춘 입문 가성비 모델.",
    needsInfo: true,
    instagramTags: ["aulaf65", "독거미키보드"],
  },
  {
    slug: "aula-f75-max",
    nameKo: "AULA F75 Max 독거미",
    nameEn: "AULA F75 Max",
    brand: "AULA",
    layout: "75%",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    hasLCD: true,
    colors: [
      { name: "올리비아 화이트", hex: "#f0ebe0" },
      { name: "스카이 블랙", hex: "#2b2f36" },
    ],
    availableSwitchSlugs: ["leobog-gyeonghae", "leobog-seiya", "ktt-sea-silent"],
    priceFromKrw: 55000,
    description: "LCD를 탑재한 75% 모델. 핫스왑·가스켓·트라이모드 무선 구성.",
    needsInfo: true,
    instagramTags: ["aulaf75max", "독거미키보드"],
  },
  {
    slug: "aula-f87-pro",
    nameKo: "AULA F87 Pro 독거미",
    nameEn: "AULA F87 Pro",
    brand: "AULA",
    layout: "TKL(80%)",
    connections: ["유선", "유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "인디고 블랙", hex: "#2a2e3a" },
      { name: "올리비아 화이트", hex: "#f0ebe0" },
      { name: "다크 올리비아", hex: "#6b6a5e" },
      { name: "라이트 올리비아", hex: "#d8d2c2" },
      { name: "블러쉬 핑크", hex: "#f3c5d2", upcoming: true },
    ],
    availableSwitchSlugs: [
      "leobog-cotton-silent",
      "aula-yellow-v3",
      "ktt-peach-silent-v2",
      "ktt-sea-silent",
      "leobog-seiya",
      "leobog-hoemok-v4",
      "leobog-rose-silent",
    ],
    priceFromKrw: 45000,
    description: "텐키리스(87키) 인기 모델. 유선/유무선 선택, 핫스왑·가스켓 구성에 다양한 축 옵션.",
    instagramTags: ["aulaf87pro", "독거미키보드"],
  },
  {
    slug: "aula-f99",
    nameKo: "AULA F99 독거미",
    nameEn: "AULA F99",
    brand: "AULA",
    layout: "96%(1800)",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "올리비아 화이트", hex: "#f0ebe0" },
      { name: "인디고 블랙", hex: "#2a2e3a" },
    ],
    availableSwitchSlugs: ["aula-yellow-v3", "leobog-hoemok-v4"],
    priceFromKrw: 49000,
    description: "넘버패드를 살린 96%(1800) 인기 모델. 트라이모드 무선·핫스왑·가스켓 구성.",
    instagramTags: ["aulaf99", "독거미키보드"],
  },
  {
    slug: "aula-f108",
    nameKo: "AULA F108 독거미",
    nameEn: "AULA F108",
    brand: "AULA",
    layout: "풀배열(100%)",
    connections: ["유선", "유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "스카이 블랙", hex: "#2b2f36" },
      { name: "라이트 그레이", hex: "#c9ccd1" },
      { name: "올리비아 화이트", hex: "#f0ebe0" },
      { name: "블러쉬 핑크", hex: "#f3c5d2", upcoming: true },
    ],
    availableSwitchSlugs: [
      "ktt-sea-silent",
      "leobog-cotton-silent",
      "leobog-seiya",
      "leobog-gyeonghae",
      "aula-yellow-v3",
      "leobog-rose-silent",
    ],
    priceFromKrw: 49000,
    description: "표준 풀배열(108키) 모델. 유선/유무선 선택, 핫스왑·가스켓에 폭넓은 축 옵션.",
    instagramTags: ["aulaf108", "독거미키보드"],
  },
  {
    slug: "aula-f108-pro",
    nameKo: "AULA F108 Pro 독거미",
    nameEn: "AULA F108 Pro",
    brand: "AULA",
    layout: "풀배열(100%)",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    hasLCD: true,
    colors: [
      { name: "치즈 화이트", hex: "#f5e6b8" },
      { name: "오로라 블랙", hex: "#26282e" },
    ],
    availableSwitchSlugs: [
      "ktt-sea-silent",
      "leobog-cotton-silent",
      "leobog-seiya",
      "leobog-gyeonghae",
    ],
    priceFromKrw: 65000,
    description: "LCD를 탑재한 풀배열 상위 모델. 트라이모드 무선·핫스왑·가스켓 구성.",
    needsInfo: true,
    instagramTags: ["aulaf108pro", "독거미키보드"],
  },
  {
    slug: "aula-s102",
    nameKo: "AULA S102 독거미",
    nameEn: "AULA S102",
    brand: "AULA",
    layout: "풀배열(100%)",
    connections: ["유선"],
    switchKind: "멤브레인",
    hotswap: false,
    material: "플라스틱",
    colors: [
      { name: "그린", hex: "#6fae7d" },
      { name: "핑크", hex: "#f4a9c0" },
      { name: "그레이", hex: "#8a8d92" },
    ],
    availableSwitchSlugs: [],
    priceFromKrw: 25000,
    description: "유선 멤브레인 풀배열 저소음 키보드. 가벼운 입문·사무용.",
    needsInfo: true,
    instagramTags: ["aulas102", "독거미키보드"],
  },
  {
    slug: "aula-s102-pro",
    nameKo: "AULA S102 Pro 독거미",
    nameEn: "AULA S102 Pro",
    brand: "AULA",
    layout: "풀배열(100%)",
    connections: ["유무선(트라이모드)"],
    switchKind: "멤브레인",
    hotswap: false,
    material: "플라스틱",
    colors: [
      { name: "핑크", hex: "#f4a9c0" },
      { name: "그린", hex: "#6fae7d" },
      { name: "그레이", hex: "#8a8d92" },
    ],
    availableSwitchSlugs: [],
    priceFromKrw: 35000,
    description: "S102의 유무선 버전. 멤브레인 풀배열 저소음 키보드.",
    needsInfo: true,
    instagramTags: ["aulas102pro", "독거미키보드"],
  },
  {
    slug: "aula-hero68he",
    nameKo: "AULA Hero68 HE 독거미",
    nameEn: "AULA Hero68 HE",
    brand: "AULA",
    layout: "65%(68키)",
    connections: ["유무선(트라이모드)"],
    switchKind: "자석축(HE)",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "화이트", hex: "#f2f2f0" },
      { name: "블랙레드", hex: "#6e2a2a" },
      { name: "퍼플", hex: "#7a5cc0" },
      { name: "핑크", hex: "#f4a9c0" },
      { name: "미스트 블랙", hex: "#3a3d42" },
      { name: "미스트 화이트", hex: "#eef0f2" },
    ],
    availableSwitchSlugs: [
      "aula-black-king",
      "aula-dragon-king",
      "aula-jade-king",
      "aula-silver-he",
    ],
    priceFromKrw: 65000,
    description: "8K 자석축(HE) 65% 게이밍 키보드. 작동점 조절·래피드 트리거 등 HE 기능 지원.",
    needsInfo: true,
    instagramTags: ["hero68he", "독거미키보드", "자석축"],
  },
  {
    slug: "aula-win60he-max",
    nameKo: "AULA Win60 HE Max 독거미",
    nameEn: "AULA Win60 HE Max",
    brand: "AULA",
    layout: "60%",
    connections: ["유무선(트라이모드)"],
    switchKind: "자석축(HE)",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "골든 블랙", hex: "#2b2620" },
      { name: "라벤더 화이트", hex: "#e8e4f0" },
    ],
    availableSwitchSlugs: ["aula-spirit-purple"],
    priceFromKrw: 60000,
    description: "8K 자석축(HE) 60% 게이밍 키보드.",
    needsInfo: true,
    instagramTags: ["win60he", "독거미키보드", "자석축"],
  },
  {
    slug: "aula-win68he-max",
    nameKo: "AULA Win68 HE Max 독거미",
    nameEn: "AULA Win68 HE Max",
    brand: "AULA",
    layout: "65%(68키)",
    connections: ["유무선(트라이모드)"],
    switchKind: "자석축(HE)",
    hotswap: true,
    material: "플라스틱",
    colors: [
      { name: "라벤더 화이트", hex: "#e8e4f0" },
      { name: "골든 블랙", hex: "#2b2620" },
    ],
    availableSwitchSlugs: ["aula-spirit-purple"],
    priceFromKrw: 65000,
    description: "8K 자석축(HE) 65% 게이밍 키보드.",
    needsInfo: true,
    instagramTags: ["win68he", "독거미키보드", "자석축"],
  },

  // ───────── Swagkeys (swagkey.kr) 완제품 ─────────
  {
    slug: "swagkeys-eave65",
    nameKo: "스웨그키 Eave65",
    nameEn: "Swagkeys Eave65",
    brand: "Swagkeys",
    layout: "65%",
    connections: ["유선"],
    switchKind: "기계식",
    hotswap: true,
    material: "폴리카보네이트(PC)",
    colors: [{ name: "클리어", hex: "#cfd8e0" }],
    availableSwitchSlugs: [],
    priceFromKrw: 57000,
    description: "투명 PC 케이스의 65% 키보드. 실리콘 가스켓 마운트·핫스왑·언더글로 RGB를 갖춘 가성비 입문 커스텀.",
    buyUrl: SWAGKEY,
    instagramTags: ["swagkeys", "eave65"],
  },
  {
    slug: "swagkeys-smurve80",
    nameKo: "스웨그키 Smurve80",
    nameEn: "Swagkeys x PK Smurve80",
    brand: "Swagkeys",
    layout: "TKL(80%)",
    connections: ["유선"],
    switchKind: "기계식",
    hotswap: true,
    material: "알루미늄",
    colors: [],
    availableSwitchSlugs: [],
    priceFromKrw: 128000,
    description: "Swagkeys x PK 협업 80% 모델. 가스켓 마운트·핫스왑 구성의 엔수지애스트 완제품.",
    needsInfo: true,
    buyUrl: SWAGKEY,
    instagramTags: ["swagkeys", "smurve80"],
  },
  {
    slug: "bridge75",
    nameKo: "브릿지75",
    nameEn: "Shortcut Studio Bridge75",
    brand: "Shortcut Studio",
    layout: "75%",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "알루미늄",
    colors: [{ name: "실버", hex: "#9aa0a6" }],
    availableSwitchSlugs: [],
    priceFromKrw: 125000,
    description: "Shortcut Studio의 알루미늄 75% 키보드(swagkey 판매). 볼캐치 가스켓·트라이모드 무선·핫스왑. Plus(기계식)와 HE(자석축) 버전이 있음.",
    buyUrl: SWAGKEY,
    instagramTags: ["bridge75", "shortcutstudio"],
  },
  {
    slug: "swagkeys-transition-lite-8k",
    nameKo: "스웨그키 Transition LITE 유무선 8K",
    nameEn: "Swagkeys Transition LITE 8K",
    brand: "Swagkeys",
    layout: "75%",
    connections: ["유무선(트라이모드)"],
    switchKind: "기계식",
    hotswap: true,
    material: "플라스틱",
    colors: [],
    availableSwitchSlugs: [],
    priceFromKrw: 99000,
    description: "8K 폴링레이트를 지원하는 75% 유무선 모델. 핫스왑·가스켓 구성의 Transition LITE 완제품.",
    needsInfo: true,
    buyUrl: SWAGKEY,
    instagramTags: ["swagkeys", "transitionlite"],
  },
];

// ───────────────── 헬퍼 ─────────────────

export function getKeyboardBySlug(slug: string): Keyboard | undefined {
  return keyboards.find((k) => k.slug === slug);
}

export function getAllKeyboardSlugs(): string[] {
  return keyboards.map((k) => k.slug);
}

function uniqSorted(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
}

export function getKbBrands(): string[] {
  return uniqSorted(keyboards.map((k) => k.brand));
}

export function getLayouts(): string[] {
  return uniqSorted(keyboards.map((k) => k.layout));
}

export function getConnections(): string[] {
  return uniqSorted(keyboards.flatMap((k) => k.connections));
}

export function getSwitchKinds(): string[] {
  return uniqSorted(keyboards.map((k) => k.switchKind));
}

export function getKbMaterials(): string[] {
  return uniqSorted(keyboards.map((k) => k.material));
}

/** 색상명 → 계열(필터용) */
export function colorFamily(name: string): string {
  if (name.includes("블랙레드")) return "블랙레드";
  if (name.includes("화이트")) return "화이트";
  if (name.includes("블랙")) return "블랙";
  if (name.includes("핑크")) return "핑크";
  if (name.includes("그레이")) return "그레이";
  if (name.includes("라벤더") || name.includes("퍼플")) return "퍼플";
  if (name.includes("그린")) return "그린";
  if (name.includes("올리비아")) return "올리브";
  if (name.includes("클리어") || name.includes("투명")) return "클리어";
  return "기타";
}

export function getColorFamilies(): string[] {
  return uniqSorted(
    keyboards.flatMap((k) => k.colors.map((c) => colorFamily(c.name)))
  );
}

/** 키보드의 제공 축을 축 도감 항목으로 해석 (없는 slug는 제외) */
export function getKeyboardSwitches(kb: Keyboard): Keyswitch[] {
  return (kb.availableSwitchSlugs ?? [])
    .map((s) => getSwitchBySlug(s))
    .filter((s): s is Keyswitch => !!s);
}

/** 세부 축 필터용: 전체 키보드가 제공하는 축 목록(slug+이름, 중복 제거) */
export function getKeyboardSwitchOptions(): { slug: string; nameKo: string }[] {
  const map = new Map<string, string>();
  for (const kb of keyboards) {
    for (const sw of getKeyboardSwitches(kb)) map.set(sw.slug, sw.nameKo);
  }
  return Array.from(map, ([slug, nameKo]) => ({ slug, nameKo })).sort((a, b) =>
    a.nameKo.localeCompare(b.nameKo, "ko")
  );
}

/** 네이버 쇼핑 검색 링크 (구매처 탐색용) */
export function naverShopSearchUrl(name: string): string {
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
    name + " 키보드"
  )}`;
}

/** 유튜브 리뷰 검색 링크 */
export function youtubeReviewUrl(kb: Keyboard): string {
  const name = kb.nameEn ?? kb.nameKo;
  const q = encodeURIComponent(`${name} 키보드 리뷰`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

// 인스타 해시태그 링크는 축 도감과 공유
export { instagramTagUrl };
