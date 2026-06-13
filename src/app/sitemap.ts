import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/data/switches";
import { getAllKeycapSlugs } from "@/data/keycaps";
import { getAllKeyboardSlugs } from "@/data/keyboards";

const BASE = "https://keyboard-community.vercel.app";

// 공개 정적 경로 + 도감 상세(축·키캡·키보드). 커뮤니티 글은 유동 콘텐츠라 제외.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "",
    "/switches",
    "/keycaps",
    "/keyboards",
    "/community",
    "/terms",
    "/privacy",
  ];
  const detail = [
    ...getAllSlugs().map((s) => `/switches/${s}`),
    ...getAllKeycapSlugs().map((s) => `/keycaps/${s}`),
    ...getAllKeyboardSlugs().map((s) => `/keyboards/${s}`),
  ];
  return [...staticPaths, ...detail].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
  }));
}
