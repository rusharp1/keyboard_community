import type { MetadataRoute } from "next";

const BASE = "https://keyboard-community.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 로그인 전용·운영·인증 콜백 경로는 크롤링 제외.
      disallow: [
        "/community/admin",
        "/community/me",
        "/community/settings",
        "/community/new",
        "/onboarding",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
