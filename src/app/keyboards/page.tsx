import type { Metadata } from "next";
import KeyboardExplorer from "@/components/KeyboardExplorer";

export const metadata: Metadata = {
  title: "키보드 도감 — 키보드 커뮤니티",
  description:
    "완성형 키보드를 배열·연결·재질·스위치 종류로 모아 보고, 구매처·리뷰로 연결해 보세요.",
};

export default function KeyboardsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">키보드 도감</h1>
      <p className="mt-1 text-muted">
        AULA 독거미부터 커스텀 완제품까지 — 배열·연결 방식·핫스왑·스위치 종류·재질로
        필터링해 보세요. 스펙은 참고용이며 가격은 시점·판매처에 따라 달라질 수 있습니다.
      </p>
      <div className="mt-6">
        <KeyboardExplorer />
      </div>
    </div>
  );
}
