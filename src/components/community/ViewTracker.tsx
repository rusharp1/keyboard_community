"use client";

import { useEffect, useRef } from "react";
import { recordView } from "@/app/community/actions";

// 상세 페이지 마운트 시 조회수 1회 집계(중복방지는 서버에서).
export default function ViewTracker({ postId }: { postId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void recordView(postId);
  }, [postId]);
  return null;
}
