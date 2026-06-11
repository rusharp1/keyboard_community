import Link from "next/link";
import HeaderAuth from "@/components/auth/HeaderAuth";
import MobileNav from "@/components/MobileNav";

const nav = [
  { href: "/keyboards", label: "키보드 도감" },
  { href: "/switches", label: "축 도감" },
  { href: "/keycaps", label: "키캡 도감" },
  { href: "/community", label: "커뮤니티" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-bold"
          >
            ⌨
          </span>
          <span className="hidden sm:inline">키보드 커뮤니티</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {/* 데스크탑: 도감/커뮤니티 인라인 */}
          <span className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </span>
          {/* 모바일: 햄버거로 모음 */}
          <MobileNav links={nav} />
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
