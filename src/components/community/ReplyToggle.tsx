"use client";

import { useState } from "react";
import CommentForm from "./CommentForm";

// 댓글 아래 "답글" 버튼 → 대댓글 입력 폼 토글.
export default function ReplyToggle({ postId, parentId }: { postId: string; parentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={open ? "w-full" : ""}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted hover:text-foreground"
      >
        {open ? "취소" : "답글"}
      </button>
      {open && (
        <div className="mt-2">
          <CommentForm
            postId={postId}
            parentId={parentId}
            placeholder="답글을 입력하세요"
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
