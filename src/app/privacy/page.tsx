import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 키보드 커뮤니티",
  description: "키보드 커뮤니티가 수집하는 개인정보 항목·목적·보유기간 및 이용자 권리 안내.",
};

// ⚠️ 운영자 정보·시행일은 placeholder([ ]) — 공개 전 실제 값으로 채울 것.
const OPERATOR = "[운영자명]";
const CONTACT = "[문의 이메일]";
const EFFECTIVE = "[시행일: YYYY-MM-DD]";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← 홈
      </Link>
      <h1 className="mt-3 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted">시행일: {EFFECTIVE}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          키보드 커뮤니티(이하 “서비스”)는 「개인정보 보호법」에 따라 이용자의 개인정보를
          보호하고 관련 고충을 처리하기 위해 다음과 같이 개인정보처리방침을 둡니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원가입·로그인: 이메일 주소, 닉네임, 비밀번호(암호화 저장)</li>
            <li>소셜 로그인(네이버): 네이버가 제공하는 이메일·식별자(동의 항목 한정)</li>
            <li>서비스 이용 중 생성: 게시물·댓글·리뷰·좋아요·신고 등 활동 기록, 활동점수·제재 이력</li>
            <li>자동 수집: 접속 로그, 쿠키(중복 조회수 방지용 식별값 등), 기기·브라우저 정보</li>
          </ul>
        </Section>

        <Section title="2. 수집·이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별·인증, 커뮤니티 게시판 운영</li>
            <li>알림 발송, 부정이용(스팸·도배·신고 누적) 방지 및 제재</li>
            <li>서비스 개선 및 통계 분석</li>
          </ul>
        </Section>

        <Section title="3. 보유 및 이용기간">
          <p>
            회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당
            기간 동안 보관하며, 게시물 등 일부 콘텐츠는 탈퇴 후에도 익명 처리되어 남을 수
            있습니다.
          </p>
        </Section>

        <Section title="4. 처리 위탁 및 제3자 제공">
          <p>안정적 서비스 제공을 위해 아래 사업자의 인프라를 이용합니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase — 데이터베이스·인증·스토리지(해외)</li>
            <li>Vercel — 웹 호스팅·접속 분석(해외)</li>
            <li>네이버 — 소셜 로그인(이용자가 동의한 경우)</li>
          </ul>
          <p>법령에 근거하거나 이용자가 동의한 경우를 제외하고 제3자에게 제공하지 않습니다.</p>
        </Section>

        <Section title="5. 이용자의 권리">
          <p>
            이용자는 언제든지 본인의 개인정보를 조회·수정하거나 회원 탈퇴를 통해 삭제를 요청할
            수 있습니다. 문의는 아래 연락처로 해주시기 바랍니다.
          </p>
        </Section>

        <Section title="6. 개인정보 보호책임자 / 문의">
          <ul className="list-disc space-y-1 pl-5">
            <li>운영자: {OPERATOR}</li>
            <li>문의: {CONTACT}</li>
          </ul>
        </Section>

        <Section title="7. 고지의 의무">
          <p>본 방침의 추가·삭제·수정이 있을 경우 시행 전 서비스 공지를 통해 안내합니다.</p>
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
