"use client";

import { useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { uploadPostImage } from "@/lib/community/uploadImage";

// tiptap-markdown은 editor.storage.markdown.getMarkdown()을 주입하지만 Storage 타입을 보강하지 않아
// 직접 선언 병합으로 타입을 맞춘다.
declare module "@tiptap/core" {
  interface Storage {
    markdown: { getMarkdown: () => string };
  }
}

// 글 본문용 WYSIWYG 에디터. 화면은 서식 그대로 보이되, 저장은 마크다운 문자열로.
// value(마크다운)는 부모(PostForm)의 단일 소스이며, WYSIWYG 편집은 onUpdate→onChange로,
// 마크다운 모드 편집은 textarea→onChange로 흘려보낸다. 두 모드는 토글 시 setContent로 동기화.
export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");

  const editor = useEditor({
    immediatelyRender: false, // SSR 안전.
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // 제목1/2/3.
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Image.configure({ inline: false }),
      // html:false → 원시 HTML을 마크다운으로 직렬화하지 않음(저장 단계부터 마크다운만, XSS 표면 최소화).
      Markdown.configure({ html: false, transformPastedText: true, linkify: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-content min-h-[16rem] bg-surface px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.storage.markdown.getMarkdown()),
  });

  // 모드 전환. 마크다운→서식 복귀 시 편집된 마크다운을 에디터에 재파싱해 동기화.
  const toggleMode = () => {
    if (mode === "wysiwyg") {
      setMode("markdown"); // value는 onUpdate로 이미 최신.
    } else {
      editor?.commands.setContent(value, { emitUpdate: false });
      setMode("wysiwyg");
    }
  };

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {mode === "wysiwyg" && <Toolbar editor={editor} />}

      <div className={mode === "markdown" ? "hidden" : ""}>
        <EditorContent editor={editor} />
      </div>

      {mode === "markdown" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="min-h-[16rem] w-full resize-y bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none"
          placeholder="# 제목&#10;**굵게**, *기울임*, - 목록, [링크](url), ![이미지](url)"
        />
      )}

      <div className="flex items-center justify-end border-t border-border bg-surface-2 px-2 py-1">
        <button
          type="button"
          onClick={toggleMode}
          className="rounded px-2 py-0.5 text-xs text-muted hover:text-foreground"
          title={mode === "wysiwyg" ? "마크다운으로 직접 입력" : "서식 편집기로 전환"}
        >
          {mode === "wysiwyg" ? "마크다운 ⤵" : "서식 편집 ⤴"}
        </button>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // useEditorState로 선택 영역 변화에 맞춰 버튼 active 상태만 구독.
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      quote: editor.isActive("blockquote"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    setImgError(null);
    setImgBusy(true);
    try {
      const { url, error } = await uploadPostImage(file);
      if (error) {
        setImgError(error);
        return;
      }
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setImgBusy(false);
    }
  };

  return (
    <div className="border-b border-border bg-surface-2">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
        <Btn active={s.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="제목1">
          제목1
        </Btn>
        <Btn active={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="제목2">
          제목2
        </Btn>
        <Btn active={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="제목3">
          제목3
        </Btn>
        <Sep />
        <Btn active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()} label="굵게">
          <span className="font-bold">B</span>
        </Btn>
        <Btn active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()} label="기울임">
          <span className="italic">I</span>
        </Btn>
        <Btn active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()} label="취소선">
          <span className="line-through">S</span>
        </Btn>
        <Sep />
        <Btn active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="인용구">
          ❝
        </Btn>
        <Btn active={s.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} label="목록">
          •
        </Btn>
        <Btn active={s.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="번호 목록">
          1.
        </Btn>
        <Btn active={s.code} onClick={() => editor.chain().focus().toggleCode().run()} label="코드">
          {"</>"}
        </Btn>
        <Btn active={s.link} onClick={setLink} label="링크">
          🔗
        </Btn>
        <Btn onClick={() => fileRef.current?.click()} label="이미지" disabled={imgBusy}>
          {imgBusy ? "…" : "🖼"}
        </Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickImage}
          className="hidden"
        />
      </div>
      {imgError && <p className="px-2 pb-1 text-xs text-accent">{imgError}</p>}
    </div>
  );
}

function Btn({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`min-w-7 rounded px-2 py-1 text-sm leading-none disabled:opacity-50 ${
        active ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />;
}
