import type { Metadata } from "next";
import SwitchExplorer from "@/components/SwitchExplorer";
import { SWITCH_TYPE_META, type SwitchType } from "@/data/switches";
import { getReviewStatsBulk } from "@/lib/community/reviews";

export const metadata: Metadata = {
  title: "축 도감 — 키보드 커뮤니티",
  description: "기계식 키보드 축의 이름·색상·특성을 종류와 제조사로 찾아보세요.",
};

export default async function SwitchesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; silent?: string; magnetic?: string }>;
}) {
  const { type, silent, magnetic } = await searchParams;
  const initialType =
    type && type in SWITCH_TYPE_META ? (type as SwitchType) : undefined;
  const initialSilent = silent === "1" || silent === "true";
  const initialMagnetic = magnetic === "1" || magnetic === "true";
  const statsBySlug = await getReviewStatsBulk("switch");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">축 도감</h1>
      <p className="mt-1 text-muted">
        종류·제조사·검색으로 원하는 축을 찾고, 상세에서 타건음을 들어보세요.
      </p>

      <div className="mt-6">
        <SwitchExplorer
          initialType={initialType}
          initialSilent={initialSilent}
          initialMagnetic={initialMagnetic}
          statsBySlug={statsBySlug}
        />
      </div>
    </div>
  );
}
