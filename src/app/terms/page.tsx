import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 — 키보드 커뮤니티",
  description: "키보드 커뮤니티 서비스 이용약관 — 계정, 게시물, 금지행위, 제재, 면책.",
};

// ⚠️ 운영자 정보·시행일은 placeholder([ ]) — 공개 전 실제 값으로 채울 것.
const OPERATOR = "[운영자명]";
const EFFECTIVE = "[시행일: YYYY-MM-DD]";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← 홈
      </Link>
      <h1 className="mt-3 text-2xl font-bold">이용약관</h1>
      <p className="mt-2 text-sm text-muted">시행일: {EFFECTIVE}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 키보드 커뮤니티(이하 “서비스”)가 제공하는 기계식 키보드 도감·타건음·커뮤니티
            기능의 이용 조건과 절차, 이용자와 운영자의 권리·의무를 규정합니다.
          </p>
        </Section>

        <Section title="제2조 (계정)">
          <ul className="list-disc space-y-1 pl-5">
            <li>이용자는 이메일 또는 소셜 로그인으로 계정을 만들어 서비스를 이용합니다.</li>
            <li>계정 정보는 본인이 관리하며, 타인에게 양도·대여할 수 없습니다.</li>
            <li>닉네임은 중복될 수 없으며, 부적절한 닉네임은 변경·제한될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="제3조 (게시물과 권리)">
          <ul className="list-disc space-y-1 pl-5">
            <li>이용자가 작성한 게시물·댓글·리뷰의 권리는 작성자에게 있습니다.</li>
            <li>
              운영자는 서비스 운영·노출을 위해 게시물을 표시·정렬·검색에 활용할 수 있습니다.
            </li>
            <li>도감 정보·타건음 링크는 참고용이며 제조사·판매처 사정에 따라 다를 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="제4조 (금지행위)">
          <ul className="list-disc space-y-1 pl-5">
            <li>스팸·광고·도배, 욕설·비방, 음란·불법 정보 게시</li>
            <li>타인 사칭, 허위사실 유포, 권리 침해</li>
            <li>서비스 정상 운영을 방해하는 행위(자동화·부정 접근 등)</li>
          </ul>
        </Section>

        <Section title="제5조 (신고·제재)">
          <p>
            이용자는 부적절한 콘텐츠를 신고할 수 있으며, 서로 다른 이용자의 신고가 누적되면 해당
            콘텐츠는 자동으로 숨김 처리될 수 있습니다. 운영진은 검토 후 콘텐츠 숨김·삭제 및
            작성자에 대한 벌점 부과를 할 수 있고, 누적 벌점에 따라 경고·활동정지·영구 이용정지의
            제재가 적용됩니다.
          </p>
        </Section>

        <Section title="제6조 (서비스 변경·중단)">
          <p>
            운영자는 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 중요한 변경은 사전에 공지하도록
            노력합니다.
          </p>
        </Section>

        <Section title="제7조 (면책)">
          <p>
            서비스는 무상으로 제공되며, 도감·타건음 등 정보의 정확성·완전성을 보증하지 않습니다.
            이용자 간 분쟁이나 외부 링크·거래로 인한 손해에 대해 운영자는 책임지지 않습니다.
          </p>
        </Section>

        <Section title="제8조 (문의·준거법)">
          <p>
            본 약관 관련 문의는 운영자({OPERATOR})에게 할 수 있으며, 서비스 이용과 관련한 분쟁은
            대한민국 법령을 준거법으로 합니다.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-muted">{children}</div>
    </section>
  );
}
