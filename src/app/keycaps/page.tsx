import type { Metadata } from "next";
import KeycapExplorer from "@/components/KeycapExplorer";
import { getReviewStatsBulk } from "@/lib/community/reviews";

export const metadata: Metadata = {
  title: "키캡 도감 — 키보드 커뮤니티",
  description: "키캡 세트의 테마와 색감을 모아 보고, 인스타그램·구매처로 연결해 보세요.",
};

export default async function KeycapsPage() {
  const statsBySlug = await getReviewStatsBulk("keycap");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">키캡 도감</h1>
      <p className="mt-1 text-muted">
        키캡 세트의 테마와 대표 색감을 모았어요. 색 팔레트는 분위기 참고용 추정치이며,
        상세에서 인스타그램·구매처 링크로 실제 모습을 확인할 수 있습니다.
      </p>

      <div className="mt-6">
        <KeycapExplorer statsBySlug={statsBySlug} />
      </div>
    </div>
  );
}
