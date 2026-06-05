// 축(스위치) 도감 시드 데이터
// 스펙(작동압력/바닥압/이동거리)은 제조사 공개값 기준의 대표치이며 로트/리비전에 따라 다를 수 있습니다.
// youtubeVideoIds 에 검증된 타건음 영상 ID를 넣으면 상세 페이지에 임베드로 표시됩니다.
// 비어 있으면 유튜브 검색 링크로 자동 폴백합니다.

// 축의 "방식"은 셋 중 하나로 상호 배타적. 저소음은 그 위에 덧붙는 별개 속성.
export type SwitchType = "linear" | "tactile" | "clicky";

export interface Keyswitch {
  slug: string;
  nameKo: string;
  nameEn: string;
  brand: string;
  /** 축 방식 (리니어/택타일/클릭키 중 하나) */
  type: SwitchType;
  /** 저소음(댐퍼) 여부 — 예: 리니어 + 저소음 */
  silent?: boolean;
  /** 대표 색상 표시 이름 */
  color: string;
  /** 대표 색상 HEX (배지/칩 표시에 사용) */
  colorHex: string;
  /** 작동 압력 (g) */
  actuationForce: number;
  /** 바닥압 (g) */
  bottomOutForce: number;
  /** 총 이동거리 (mm) */
  totalTravel: number;
  /** 소리 성향 한줄 */
  soundProfile: string;
  /** 키감 한줄 요약 */
  feelSummary: string;
  /** 상세 설명 */
  description: string;
  /** 검증된 타건음 유튜브 영상 ID (비면 검색 링크로 폴백) */
  youtubeVideoIds: string[];
  /** 인스타그램 해시태그 (한/영) */
  instagramTags: string[];
}

export const SWITCH_TYPE_META: Record<
  SwitchType,
  { labelKo: string; labelEn: string; desc: string; accent: string }
> = {
  linear: {
    labelKo: "리니어",
    labelEn: "Linear",
    desc: "걸림 없이 부드럽게 끝까지 눌리는 축. 빠른 연타와 게이밍에 인기.",
    accent: "#ef4444",
  },
  tactile: {
    labelKo: "택타일",
    labelEn: "Tactile",
    desc: "누르는 중간에 걸림(구분감)이 느껴지는 축. 타이핑 피드백을 선호하는 사용자에게.",
    accent: "#a16207",
  },
  clicky: {
    labelKo: "클릭키",
    labelEn: "Clicky",
    desc: "걸림감과 함께 '딸깍' 소리가 나는 축. 경쾌한 타건음을 좋아한다면.",
    accent: "#3b82f6",
  },
};

// 저소음은 종류가 아니라 별개 속성이라 따로 둔다. (배지/필터에서 사용)
export const SILENT_META = {
  labelKo: "저소음",
  labelEn: "Silent",
  desc: "댐퍼로 바닥/복귀 소음을 줄인 축. 리니어·택타일 등 어떤 방식에도 붙을 수 있음. 사무실/야간/공용 공간에 적합.",
  accent: "#10b981",
};

export const switches: Keyswitch[] = [
  // ───────────────── 리니어 ─────────────────
  {
    slug: "cherry-mx-red",
    nameKo: "체리 적축",
    nameEn: "Cherry MX Red",
    brand: "Cherry",
    type: "linear",
    color: "레드",
    colorHex: "#e3120b",
    actuationForce: 45,
    bottomOutForce: 75,
    totalTravel: 4.0,
    soundProfile: "조용하고 부드러운 '투툭' 소리",
    feelSummary: "가볍고 부드러운 입문용 리니어의 표준",
    description:
      "가장 대중적인 리니어 축. 45g의 가벼운 작동압력으로 빠른 연타가 쉬워 게이밍 입문용으로 많이 추천됩니다. 걸림감이 없어 처음 기계식을 접하는 사용자에게 무난합니다.",
    youtubeVideoIds: [],
    instagramTags: ["적축", "cherrymxred", "기계식키보드"],
  },
  {
    slug: "cherry-mx-black",
    nameKo: "체리 흑축",
    nameEn: "Cherry MX Black",
    brand: "Cherry",
    type: "linear",
    color: "블랙",
    colorHex: "#1a1a1a",
    actuationForce: 60,
    bottomOutForce: 90,
    totalTravel: 4.0,
    soundProfile: "묵직하고 낮은 '툭툭' 소리",
    feelSummary: "묵직한 손맛의 무거운 리니어",
    description:
      "적축보다 무거운 60g 작동압력의 리니어 축. 오타가 적고 묵직한 손맛을 선호하는 사용자에게 인기. 장시간 타이핑보다 또박또박한 입력감을 원할 때 좋습니다.",
    youtubeVideoIds: [],
    instagramTags: ["흑축", "cherrymxblack", "기계식키보드"],
  },
  {
    slug: "cherry-mx-speed-silver",
    nameKo: "체리 은축",
    nameEn: "Cherry MX Speed Silver",
    brand: "Cherry",
    type: "linear",
    color: "실버",
    colorHex: "#c0c0c0",
    actuationForce: 45,
    bottomOutForce: 75,
    totalTravel: 3.4,
    soundProfile: "적축과 비슷하나 더 짧고 빠른 소리",
    feelSummary: "작동 지점이 얕은 스피드 리니어",
    description:
      "적축과 압력은 같지만 작동 지점(1.2mm)과 총 이동거리(3.4mm)가 짧아 더 빠르게 입력되는 축. FPS 등 빠른 반응이 중요한 게이밍에서 선호됩니다.",
    youtubeVideoIds: [],
    instagramTags: ["은축", "cherrymxspeedsilver", "스피드축"],
  },
  {
    slug: "gateron-yellow",
    nameKo: "게이트론 황축",
    nameEn: "Gateron Yellow",
    brand: "Gateron",
    type: "linear",
    color: "옐로우",
    colorHex: "#f4c20d",
    actuationForce: 50,
    bottomOutForce: 65,
    totalTravel: 4.0,
    soundProfile: "부드럽고 깊은 '도독' 소리",
    feelSummary: "가성비 끝판왕, 부드러운 리니어",
    description:
      "저렴한 가격에 부드러운 타건감으로 '가성비 리니어'의 대명사가 된 축. 윤활 없이도 매끈해 커스텀 입문자에게 자주 추천됩니다.",
    youtubeVideoIds: [],
    instagramTags: ["황축", "gateronyellow", "게이트론"],
  },
  {
    slug: "gateron-oil-king",
    nameKo: "게이트론 오일킹",
    nameEn: "Gateron Oil King",
    brand: "Gateron",
    type: "linear",
    color: "블랙",
    colorHex: "#222222",
    actuationForce: 55,
    bottomOutForce: 63,
    totalTravel: 4.0,
    soundProfile: "깊고 둥근 '톡톡' 풀사운드",
    feelSummary: "공장 윤활된 프리미엄 리니어",
    description:
      "공장 윤활 상태에서도 매우 매끄러운 프리미엄 리니어 축. 깊고 둥근 타건음으로 커스텀 빌드에서 인기가 높습니다.",
    youtubeVideoIds: [],
    instagramTags: ["오일킹", "gateronoilking", "커스텀키보드"],
  },

  // ───────────────── 택타일 ─────────────────
  {
    slug: "cherry-mx-brown",
    nameKo: "체리 갈축",
    nameEn: "Cherry MX Brown",
    brand: "Cherry",
    type: "tactile",
    color: "브라운",
    colorHex: "#6b4423",
    actuationForce: 45,
    bottomOutForce: 60,
    totalTravel: 4.0,
    soundProfile: "약한 걸림과 함께 부드러운 소리",
    feelSummary: "은은한 구분감의 입문용 택타일",
    description:
      "리니어와 클릭키 사이의 절충안. 약한 걸림감으로 타이핑 피드백을 주면서도 소리가 크지 않아 사무용/올라운드로 가장 무난한 택타일 축입니다.",
    youtubeVideoIds: [],
    instagramTags: ["갈축", "cherrymxbrown", "기계식키보드"],
  },
  {
    slug: "cherry-mx-clear",
    nameKo: "체리 백축",
    nameEn: "Cherry MX Clear",
    brand: "Cherry",
    type: "tactile",
    color: "클리어",
    colorHex: "#e8e8e8",
    actuationForce: 65,
    bottomOutForce: 95,
    totalTravel: 4.0,
    soundProfile: "묵직하고 단단한 택타일 소리",
    feelSummary: "걸림감이 뚜렷한 무거운 택타일",
    description:
      "갈축보다 무겁고 걸림감이 뚜렷한 택타일 축. 확실한 구분감을 원하는 타이핑 매니아들이 선호하며, 묵직한 손맛이 특징입니다.",
    youtubeVideoIds: [],
    instagramTags: ["백축", "cherrymxclear", "택타일"],
  },
  {
    slug: "boba-u4t",
    nameKo: "보바 U4T",
    nameEn: "Gazzew Boba U4T",
    brand: "Gazzew",
    type: "tactile",
    color: "더스티 브라운",
    colorHex: "#4a3528",
    actuationForce: 62,
    bottomOutForce: 68,
    totalTravel: 4.0,
    soundProfile: "강한 걸림 후 '톡' 하는 선명한 소리",
    feelSummary: "강한 구분감의 인기 택타일",
    description:
      "강하고 둥근 걸림감(범프)으로 유명한 택타일 축. 'Thocky'한 타건음과 확실한 피드백으로 커스텀 키보드 씬에서 큰 인기를 끈 축입니다. (저소음 버전 U4도 존재)",
    youtubeVideoIds: [],
    instagramTags: ["보바U4T", "bobau4t", "gazzew"],
  },
  {
    slug: "boba-u4",
    nameKo: "보바 U4",
    nameEn: "Gazzew Boba U4",
    brand: "Gazzew",
    type: "tactile",
    silent: true,
    color: "더스티 브라운",
    colorHex: "#4a3528",
    actuationForce: 62,
    bottomOutForce: 68,
    totalTravel: 4.0,
    soundProfile: "걸림감은 유지하되 댐퍼로 조용한 소리",
    feelSummary: "보바 U4T의 저소음 버전 (택타일 + 저소음)",
    description:
      "인기 택타일 U4T에 저소음 댐퍼를 더한 버전. 확실한 걸림감(구분감)을 그대로 살리면서 바닥/복귀 소음을 줄여, 조용한 환경에서 택타일을 쓰고 싶을 때 좋은 선택입니다.",
    youtubeVideoIds: [],
    instagramTags: ["보바U4", "bobau4", "저소음택타일"],
  },
  {
    slug: "holy-panda",
    nameKo: "홀리판다",
    nameEn: "Holy Panda",
    brand: "Drop / 기타",
    type: "tactile",
    color: "화이트",
    colorHex: "#f0f0f0",
    actuationForce: 67,
    bottomOutForce: 67,
    totalTravel: 4.0,
    soundProfile: "둥글고 깊은 택타일 '톡' 소리",
    feelSummary: "급격한 걸림이 매력인 명품 택타일",
    description:
      "짧고 급격한 걸림감(스냅감)으로 택타일 마니아들 사이에서 전설적인 인기를 얻은 축. 여러 제조사 버전이 존재하며 둥근 타건음이 특징입니다.",
    youtubeVideoIds: [],
    instagramTags: ["홀리판다", "holypanda", "커스텀키보드"],
  },

  // ───────────────── 클릭키 ─────────────────
  {
    slug: "cherry-mx-blue",
    nameKo: "체리 청축",
    nameEn: "Cherry MX Blue",
    brand: "Cherry",
    type: "clicky",
    color: "블루",
    colorHex: "#1e6fd9",
    actuationForce: 50,
    bottomOutForce: 60,
    totalTravel: 4.0,
    soundProfile: "경쾌한 '딸깍' 클릭음",
    feelSummary: "기계식 하면 떠오르는 대표 클릭키",
    description:
      "'기계식 키보드' 하면 떠오르는 대표적인 딸깍 소리의 클릭키 축. 명확한 타건감과 경쾌한 소리가 매력이지만 소음이 커 공용 공간에서는 주의가 필요합니다.",
    youtubeVideoIds: [],
    instagramTags: ["청축", "cherrymxblue", "기계식키보드"],
  },
  {
    slug: "cherry-mx-green",
    nameKo: "체리 녹축",
    nameEn: "Cherry MX Green",
    brand: "Cherry",
    type: "clicky",
    color: "그린",
    colorHex: "#2e8b57",
    actuationForce: 70,
    bottomOutForce: 90,
    totalTravel: 4.0,
    soundProfile: "묵직하고 단단한 클릭음",
    feelSummary: "청축의 무거운 버전",
    description:
      "청축과 같은 클릭 방식이지만 더 무거운 작동압력을 가진 축. 또렷한 클릭감과 묵직한 손맛을 동시에 원하는 사용자에게 적합합니다.",
    youtubeVideoIds: [],
    instagramTags: ["녹축", "cherrymxgreen", "클릭축"],
  },
  {
    slug: "kailh-box-white",
    nameKo: "카일 박스 화이트",
    nameEn: "Kailh Box White",
    brand: "Kailh",
    type: "clicky",
    color: "화이트",
    colorHex: "#f5f5f5",
    actuationForce: 50,
    bottomOutForce: 55,
    totalTravel: 3.6,
    soundProfile: "또렷하고 높은 '틱틱' 클릭음",
    feelSummary: "방수·방진 박스 구조의 선명한 클릭키",
    description:
      "클릭 바(click bar) 구조로 또렷하고 일관된 클릭음을 내는 축. 방수·방진 박스 스템으로 내구성이 좋고, 청축보다 깔끔한 클릭감을 선호하는 사용자에게 인기입니다.",
    youtubeVideoIds: [],
    instagramTags: ["박스화이트", "kailhboxwhite", "kailh"],
  },

  // ───────────────── 저소음 (리니어 + 저소음) ─────────────────
  {
    slug: "cherry-mx-silent-red",
    nameKo: "체리 저소음 적축",
    nameEn: "Cherry MX Silent Red",
    brand: "Cherry",
    type: "linear",
    silent: true,
    color: "핑크/레드",
    colorHex: "#c75b6b",
    actuationForce: 45,
    bottomOutForce: 70,
    totalTravel: 3.7,
    soundProfile: "댐퍼로 매우 조용한 '슥슥' 소리",
    feelSummary: "적축의 조용한 버전",
    description:
      "스템에 댐퍼를 넣어 바닥/복귀 소음을 크게 줄인 저소음 리니어 축. 적축의 가벼운 느낌을 유지하면서 사무실·야간·공용 공간에서 쓰기 좋습니다.",
    youtubeVideoIds: [],
    instagramTags: ["저소음적축", "cherrymxsilentred", "저소음키보드"],
  },
  {
    slug: "gateron-silent-red",
    nameKo: "게이트론 저소음 적축",
    nameEn: "Gateron Silent Red",
    brand: "Gateron",
    type: "linear",
    silent: true,
    color: "레드",
    colorHex: "#b34a4a",
    actuationForce: 45,
    bottomOutForce: 60,
    totalTravel: 4.0,
    soundProfile: "부드럽고 거의 소음 없는 타건음",
    feelSummary: "가성비 저소음 리니어",
    description:
      "게이트론 특유의 부드러움에 저소음 댐퍼를 더한 가성비 저소음 축. 조용한 환경을 원하면서도 부담 없는 가격을 찾는 사용자에게 적합합니다.",
    youtubeVideoIds: [],
    instagramTags: ["게이트론저소음", "gateronsilentred", "저소음키보드"],
  },
];

// ───────────────── 헬퍼 ─────────────────

export function getSwitchBySlug(slug: string): Keyswitch | undefined {
  return switches.find((s) => s.slug === slug);
}

export function getAllSlugs(): string[] {
  return switches.map((s) => s.slug);
}

export function getBrands(): string[] {
  return Array.from(new Set(switches.map((s) => s.brand))).sort();
}

/** 유튜브 타건음 검색 링크 (영상 ID가 없을 때 폴백) */
export function youtubeSearchUrl(sw: Keyswitch): string {
  const q = encodeURIComponent(`${sw.nameEn} switch sound test 타건음`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

/** 인스타그램 해시태그 탐색 링크 */
export function instagramTagUrl(tag: string): string {
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
}
