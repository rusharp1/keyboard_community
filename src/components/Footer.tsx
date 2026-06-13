import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted">
        <p>키보드 커뮤니티 — 기계식 키보드 축 도감과 타건음 모음</p>
        <p className="mt-1 text-xs">
          스펙은 제조사 공개값 기준의 대표치이며 로트/리비전에 따라 다를 수 있습니다.
        </p>
        <nav className="mt-3 flex gap-4 text-xs">
          <Link href="/terms" className="hover:text-foreground">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
        </nav>
      </div>
    </footer>
  );
}
