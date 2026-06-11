import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// 본문 마크다운 렌더. react-markdown은 기본적으로 원시 HTML을 렌더하지 않고
// (rehype-raw 미사용) 위험한 URL(javascript: 등)도 내장 sanitize로 막아 XSS-safe.
// 스타일은 Tailwind 컴포넌트 맵으로 직접 지정(@tailwindcss/typography 불필요).
// children/필요 속성만 명시 전달 — react-markdown이 넘기는 node prop을 DOM에 흘리지 않는다.
const components: Components = {
  h1: ({ children }) => <h1 className="mb-2 mt-5 text-xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-base font-semibold">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-accent underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-border pl-3 text-muted">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
  // 코드블록 컨테이너. 내부 code의 인라인 배경/패딩은 무력화.
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-surface-2 p-3 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-5 border-border" />,
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} className="my-3 max-w-full rounded-lg border border-border" />
    ) : null,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border bg-surface px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="break-words text-[15px] text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
