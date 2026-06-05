// 키캡(Keycap) 세트 도감 시드 데이터
// 출처: 사용자가 제공한 키캡 세트 목록 + 공개 자료(WebSearch) 보강.
// 키캡은 사진을 직접 싣지 못하므로, 이름/테마에서 추론한 "대표 색 팔레트"로 분위기를 보여줍니다.
// 일부 니치(한/중) 세트는 공개 자료가 적어 색감/테마가 추정치이며 정보 보강이 필요합니다(needsInfo).

import { instagramTagUrl } from "./switches";

export interface Keycap {
  slug: string;
  nameKo: string;
  nameEn?: string;
  /** 제조사/브랜드 (식별되는 경우만) */
  maker?: string;
  /** 키캡 프로파일 Cherry/OEM/SA/XDA/MDA 등 (확인되는 경우만) */
  profile?: string;
  /** 재질 PBT/ABS 등 (확인되는 경우만) */
  material?: string;
  /** 테마 한줄 요약 */
  theme: string;
  /** 대표 색 HEX 3~5개 (스와치 표시용, 분위기 추정) */
  palette: string[];
  /** 상세 설명 */
  description?: string;
  /** 색감/테마가 추정치라 정보 보강이 필요한 경우 */
  needsInfo?: boolean;
  /** 인스타그램 해시태그 */
  instagramTags: string[];
}

export const keycaps: Keycap[] = [
  {
    slug: "doll",
    nameKo: "인형 키캡",
    theme: "인형처럼 보드라운 파스텔 톤",
    palette: ["#f6d6d9", "#f3e9e0", "#d9c2b0", "#caa6a0", "#8a6f6a"],
    description: "부드러운 살구·핑크 계열의 인형 감성 파스텔 세트.",
    needsInfo: true,
    instagramTags: ["인형키캡", "키캡"],
  },
  {
    slug: "late-evening",
    nameKo: "늦은 저녁",
    nameEn: "Late Evening",
    theme: "해질녘의 차분한 저녁 감성",
    palette: ["#2b2d4a", "#4b3b6b", "#c8704f", "#e6b566", "#e7e0d3"],
    description: "남보라 하늘에 노을빛 주황이 섞인 저녁 무드의 색 조합.",
    instagramTags: ["늦은저녁키캡", "키캡"],
  },
  {
    slug: "botanical",
    nameKo: "식물키보드",
    nameEn: "Botanical",
    theme: "싱그러운 식물·보태니컬",
    palette: ["#3f5e3a", "#6b8e5a", "#aac08a", "#e8e4d0", "#7a5c3e"],
    description: "초록 잎과 흙색이 어우러진 식물원 느낌의 차분한 세트.",
    instagramTags: ["식물키캡", "보태니컬키캡"],
  },
  {
    slug: "moonrise",
    nameKo: "문라이즈",
    nameEn: "Moonrise",
    theme: "달이 떠오르는 밤하늘",
    palette: ["#1c2433", "#2f3b57", "#6b7aa3", "#e8e6c9", "#cfd3da"],
    description: "짙은 남색 밤하늘에 달빛 크림색이 포인트로 들어간 세트.",
    instagramTags: ["moonrise", "키캡"],
  },
  {
    slug: "mosaic",
    nameKo: "모자이크",
    nameEn: "Mosaic",
    theme: "여러 색이 어우러진 모자이크",
    palette: ["#2a9d8f", "#e9c46a", "#e76f51", "#264653", "#f4f1de"],
    description: "타일을 맞춘 듯 청록·머스터드·테라코타가 어우러진 컬러풀 세트.",
    instagramTags: ["모자이크키캡", "키캡"],
  },
  {
    slug: "black-cat",
    nameKo: "검은 고양이",
    nameEn: "Black Cat",
    theme: "까만 고양이의 시크한 무드",
    palette: ["#1a1a1a", "#3a3a3a", "#7d7d7d", "#f0ece4", "#e7a6b0"],
    description: "블랙·그레이 기반에 분홍 발바닥 같은 포인트가 들어간 고양이 테마.",
    instagramTags: ["검은고양이키캡", "고양이키캡"],
  },
  {
    slug: "eternal-summer",
    nameKo: "영원한 여름",
    nameEn: "Eternal Summer",
    theme: "끝나지 않는 여름 바다",
    palette: ["#1e7d8c", "#4cb5c4", "#ffd97d", "#ee6c4d", "#f2efe6"],
    description: "청록 바다와 모래·코랄이 어우러진 여름 휴양지 색감.",
    instagramTags: ["영원한여름키캡", "키캡"],
  },
  {
    slug: "magic",
    nameKo: "매직 테마",
    nameEn: "Magic",
    theme: "몽환적인 매직 파스텔 (매직걸 계열)",
    palette: ["#b8a7d9", "#a8d8c8", "#f3c4d6", "#f5f0e6", "#5b4b8a"],
    description: "라벤더·민트·핑크의 몽환적인 파스텔. 인기 'Magic Girl' 계열 감성.",
    needsInfo: true,
    instagramTags: ["매직키캡", "magicgirl"],
  },
  {
    slug: "youdiantian",
    nameKo: "유디엔티엔",
    nameEn: "Youdiantian (有点甜)",
    theme: "'조금 달달한' 스위트 파스텔",
    palette: ["#f7c9d4", "#fbd9b8", "#fef3da", "#bfe3d0", "#caa6c9"],
    description: "이름 그대로 '조금 달콤한' 파스텔 핑크·피치 톤의 중국 키캡 세트.",
    needsInfo: true,
    instagramTags: ["youdiantian", "키캡"],
  },
  {
    slug: "kindergarten",
    nameKo: "킨더가튼",
    nameEn: "Kindergarten",
    theme: "유치원처럼 알록달록 원색",
    palette: ["#e63946", "#f4a261", "#f6d34d", "#2a9d8f", "#457b9d"],
    description: "빨강·노랑·파랑 원색이 통통 튀는 유치원 감성의 발랄한 세트.",
    instagramTags: ["kindergarten", "키캡"],
  },
  {
    slug: "cowboy-bunny",
    nameKo: "카우보이 버니",
    nameEn: "Cowboy Bunny",
    theme: "서부 카우보이 + 토끼",
    palette: ["#b07d4f", "#e8d2a6", "#3f5b78", "#c0392b", "#f2ead9"],
    description: "가죽 갈색과 데님 블루에 토끼 모티프를 더한 웨스턴 테마.",
    needsInfo: true,
    instagramTags: ["카우보이버니키캡", "키캡"],
  },
  {
    slug: "cloud-cat-purple",
    nameKo: "구름냥 퍼플",
    nameEn: "Cloud Cat Purple",
    theme: "보랏빛 구름 고양이",
    palette: ["#6a5acd", "#9f8fe0", "#cdc3ef", "#f3eefb", "#bfb0d6"],
    description: "보라·라일락 톤의 폭신한 구름과 고양이 감성 세트.",
    needsInfo: true,
    instagramTags: ["구름냥키캡", "키캡"],
  },
  {
    slug: "strawberry-cake",
    nameKo: "딸기케이크",
    nameEn: "Strawberry Cake",
    theme: "딸기 케이크의 달콤한 핑크",
    palette: ["#f6a9b8", "#fae3e1", "#e23b50", "#caa472", "#fffaf3"],
    description: "부드러운 핑크와 크림 화이트에 딸기 레드 포인트. 카페 디저트 감성의 인기 테마.",
    instagramTags: ["딸기케이크키캡", "strawberrycake"],
  },
  {
    slug: "gryffindor",
    nameKo: "그리핀도르",
    nameEn: "Gryffindor",
    theme: "그리핀도르(해리포터) 레드·골드",
    palette: ["#7c0a02", "#a31621", "#d4af37", "#3a2a1a", "#ece3cf"],
    description: "해리포터 그리핀도르 기숙사의 진홍색과 금색을 담은 테마.",
    instagramTags: ["그리핀도르키캡", "gryffindor", "해리포터키캡"],
  },
  {
    slug: "pink-cherry",
    nameKo: "핑크체리",
    nameEn: "Pink Cherry",
    theme: "상큼한 핑크 체리",
    palette: ["#f48fb1", "#e53e51", "#f8d5dd", "#5a8f4e", "#fff6f4"],
    description: "핑크와 체리 레드, 초록 잎 포인트가 상큼한 체리 테마.",
    instagramTags: ["핑크체리키캡", "키캡"],
  },
  {
    slug: "peony",
    nameKo: "모란",
    nameEn: "Peony",
    theme: "탐스러운 모란꽃",
    palette: ["#c2407a", "#e483a8", "#f3c9d8", "#5b7d4b", "#f4ece1"],
    description: "진분홍 모란꽃과 초록 잎을 담은 동양적인 플로럴 세트.",
    needsInfo: true,
    instagramTags: ["모란키캡", "키캡"],
  },
  {
    slug: "dessert-cat",
    nameKo: "디저트 고양이",
    nameEn: "Dessert Cat",
    theme: "디저트 카페의 고양이",
    palette: ["#e9c9a8", "#caa06a", "#f4d9c6", "#7a5240", "#fbf3e9"],
    description: "캐러멜·크림 톤에 고양이를 더한 달콤한 디저트 카페 감성.",
    needsInfo: true,
    instagramTags: ["디저트고양이키캡", "고양이키캡"],
  },
  {
    slug: "owls-letter",
    nameKo: "올빼미의 편지",
    nameEn: "Owl's Letter",
    theme: "올빼미가 전하는 편지 (크라프트)",
    palette: ["#5a4632", "#9c7a4d", "#cdb286", "#1f4e4a", "#efe6d2"],
    description: "갈색 크라프트 종이와 올빼미, 짙은 청록 포인트의 빈티지 편지 테마.",
    needsInfo: true,
    instagramTags: ["올빼미의편지키캡", "키캡"],
  },
  {
    slug: "graffiti",
    nameKo: "그래피티",
    nameEn: "Graffiti",
    theme: "거리의 그래피티",
    palette: ["#f6d000", "#e0218a", "#1ca9c9", "#1a1a1a", "#efefe9"],
    description: "검정 바탕 위 형광 옐로·마젠타·시안이 튀는 스트리트 그래피티 무드.",
    needsInfo: true,
    instagramTags: ["그래피티키캡", "graffiti"],
  },
  {
    slug: "opera",
    nameKo: "오페라",
    nameEn: "Opera",
    theme: "고풍스러운 오페라 하우스",
    palette: ["#6e1423", "#a31621", "#caa14a", "#1b1b1b", "#efe6d6"],
    description: "버건디 레드와 금색이 어우러진 클래식한 오페라 하우스 분위기.",
    needsInfo: true,
    instagramTags: ["오페라키캡", "키캡"],
  },
  {
    slug: "bia-fairytale",
    nameKo: "비아동화진",
    theme: "동화 속 파스텔 풍경",
    palette: ["#cdb4db", "#ffc8dd", "#bde0fe", "#a2d2ff", "#fef9ef"],
    description: "동화풍의 부드러운 파스텔 색감으로 추정되는 세트. (상세 정보 보강 필요)",
    needsInfo: true,
    instagramTags: ["키캡"],
  },
  {
    slug: "yupung-yeoun",
    nameKo: "유풍여운",
    theme: "동양적 여운의 잔잔한 톤",
    palette: ["#6b7c93", "#9aa7b5", "#cdd3da", "#b08d57", "#f0ece2"],
    description: "먹빛과 한지 같은 차분한 동양적 색감으로 추정되는 세트. (상세 정보 보강 필요)",
    needsInfo: true,
    instagramTags: ["키캡"],
  },
  {
    slug: "pale-blossom",
    nameKo: "페일블라썸",
    nameEn: "Pale Blossom",
    theme: "옅게 흩날리는 벚꽃",
    palette: ["#f3d4dd", "#e7c1d3", "#cbb6d6", "#dbe5cf", "#fbf4f1"],
    description: "옅은 분홍·라일락의 벚꽃 감성. 봄빛의 은은한 파스텔 세트.",
    needsInfo: true,
    instagramTags: ["페일블라썸키캡", "paleblossom"],
  },
  {
    slug: "little-prince",
    nameKo: "어린왕자",
    nameEn: "Little Prince",
    theme: "어린왕자 동화 (블루·골드)",
    palette: ["#1f3a68", "#3f6fb5", "#e8c14b", "#d98b9a", "#f1ead8"],
    description: "어린왕자의 파란 코트와 노란 별·장미를 담은 동화 테마. 여러 제조사 버전이 있음.",
    instagramTags: ["어린왕자키캡", "littleprince"],
  },
  {
    slug: "donut",
    nameKo: "도넛",
    nameEn: "Donut",
    theme: "달콤한 도넛 파스텔",
    palette: ["#f6b8c8", "#8a5a3b", "#f7e6c4", "#7ec4cf", "#fff7ef"],
    description: "핑크 글레이즈와 초콜릿 갈색, 스프링클 포인트의 달콤한 도넛 테마.",
    needsInfo: true,
    instagramTags: ["도넛키캡", "donutkeycaps"],
  },
  {
    slug: "jtk-bubblegum",
    nameKo: "JTK 버블검",
    nameEn: "JTK Bubblegum",
    maker: "JTK",
    profile: "Cherry",
    material: "PBT",
    theme: "통통 튀는 버블껌 핑크·블루",
    palette: ["#f5b7c8", "#8ecae6", "#fbe3ea", "#fff6f8", "#5a86a8"],
    description:
      "JTK의 버블검 세트. 연핑크와 하늘색이 어우러진 큐트한 컬러웨이로, Cherry 프로파일 두툼한 PBT로 제작.",
    instagramTags: ["jtkbubblegum", "버블검키캡"],
  },
  {
    slug: "cat-butler",
    nameKo: "고양이집사",
    nameEn: "Cat Butler",
    theme: "집사를 부리는 고양이",
    palette: ["#8d8d8d", "#c9c2b6", "#3a3a3a", "#f0ece3", "#e7a6b0"],
    description: "회색·크림 톤에 고양이 모티프를 더한 집사 감성의 귀여운 세트.",
    needsInfo: true,
    instagramTags: ["고양이집사키캡", "고양이키캡"],
  },
  {
    slug: "akko-lesser-panda",
    nameKo: "AKKO 래서판다",
    nameEn: "AKKO Lesser Panda",
    maker: "AKKO",
    profile: "MDA",
    material: "더블샷 PBT",
    theme: "레서판다(레드판다)의 러스트·크림",
    palette: ["#c4572f", "#e08a4b", "#f2e3cf", "#5a3a2a", "#2b2b2b"],
    description:
      "AKKO의 레서판다 테마. 적갈색·크림 톤으로 레드판다를 표현한 더블샷 PBT, MDA 프로파일 세트.",
    needsInfo: true,
    instagramTags: ["akko래서판다", "akkokeycaps"],
  },
  {
    slug: "chestnut-pig",
    nameKo: "밤나무 돼지",
    nameEn: "Chestnut Pig",
    theme: "밤나무 아래 돼지 (밤색·핑크)",
    palette: ["#7a4a2b", "#b07d4f", "#f2c6cf", "#e8d8c0", "#3a2a1a"],
    description: "밤색 갈색과 돼지의 분홍을 섞은 따뜻하고 포근한 테마.",
    needsInfo: true,
    instagramTags: ["밤나무돼지키캡", "키캡"],
  },
];

// ───────────────── 헬퍼 ─────────────────

export function getKeycapBySlug(slug: string): Keycap | undefined {
  return keycaps.find((k) => k.slug === slug);
}

export function getAllKeycapSlugs(): string[] {
  return keycaps.map((k) => k.slug);
}

export function getMakers(): string[] {
  return Array.from(
    new Set(keycaps.map((k) => k.maker).filter((m): m is string => !!m))
  ).sort();
}

/** 네이버 쇼핑 검색 링크 (구매처 탐색용) */
export function naverShopSearchUrl(name: string): string {
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
    name + " 키캡"
  )}`;
}

// 인스타 해시태그 링크는 축 도감과 공유
export { instagramTagUrl };
