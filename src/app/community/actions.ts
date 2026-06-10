"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  requireAdmin,
  requireProfile,
  requireStaff,
  requireUser,
} from "@/lib/auth/guards";
import { BODY_MAX, COMMENT_MAX, TITLE_MAX } from "@/lib/community/limits";
import { REPORT_REASONS, type ReportReason } from "@/lib/community/types";

const MAX_IMAGES = 5;

// 폼에서 넘어온 이미지 URL들(브라우저에서 Storage 업로드 후 hidden input으로 전달).
function parseImages(formData: FormData): string[] {
  return formData
    .getAll("images")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, MAX_IMAGES);
}

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean; // 성공 신호(댓글 폼 초기화용)
};

const titleSchema = z
  .string()
  .trim()
  .min(2, "제목은 2자 이상이어야 합니다.")
  .max(TITLE_MAX, `제목은 ${TITLE_MAX}자 이하여야 합니다.`);
// 본문은 선택 입력(비워도 등록 가능). 길이 상한만 검사.
const bodySchema = z
  .string()
  .trim()
  .max(BODY_MAX, `내용은 ${BODY_MAX}자 이하여야 합니다.`);
const commentSchema = z
  .string()
  .trim()
  .min(1, "댓글을 입력하세요.")
  .max(COMMENT_MAX, `댓글은 ${COMMENT_MAX}자 이하여야 합니다.`);

// "키보드, #축, 키캡" → ["키보드","축","키캡"] (앞 # 제거, 중복·공백 정리, 최대 5개)
function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const t = part.trim().replace(/^#/, "").slice(0, 24);
    if (t && !seen.has(t)) seen.add(t);
    if (seen.size >= 5) break;
  }
  return [...seen];
}

export async function createPost(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireProfile();

  const title = titleSchema.safeParse(formData.get("title"));
  const body = bodySchema.safeParse(formData.get("body"));
  const categoryId = Number(formData.get("category_id"));

  const fieldErrors: Record<string, string> = {};
  if (!title.success) fieldErrors.title = title.error.issues[0].message;
  if (!body.success) fieldErrors.body = body.error.issues[0].message;
  if (!Number.isInteger(categoryId) || categoryId <= 0)
    fieldErrors.category_id = "카테고리를 선택하세요.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user!.id,
      category_id: categoryId,
      title: title.data,
      body: body.data,
      tags: parseTags(formData.get("tags")),
      images: parseImages(formData),
    })
    .select("id")
    .single();

  if (error) {
    // 공지 등 admin_only 카테고리에 일반 유저가 쓰면 RLS가 막는다.
    if (/row-level security|policy/i.test(error.message))
      return { error: "이 카테고리에는 글을 쓸 권한이 없습니다." };
    return { error: error.message };
  }

  redirect(`/community/${data.id}`);
}

export async function updatePost(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const title = titleSchema.safeParse(formData.get("title"));
  const body = bodySchema.safeParse(formData.get("body"));
  const fieldErrors: Record<string, string> = {};
  if (!title.success) fieldErrors.title = title.error.issues[0].message;
  if (!body.success) fieldErrors.body = body.error.issues[0].message;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const { error } = await supabase
    .from("posts")
    .update({
      title: title.data,
      body: body.data,
      tags: parseTags(formData.get("tags")),
      images: parseImages(formData),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  redirect(`/community/${id}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("posts").delete().eq("id", id);
  redirect("/community");
}

export async function addComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireProfile();
  const postId = String(formData.get("post_id") ?? "");
  const parentId = formData.get("parent_id");
  const body = commentSchema.safeParse(formData.get("body"));
  if (!postId) return { error: "잘못된 요청입니다." };
  if (!body.success) return { fieldErrors: { body: body.error.issues[0].message } };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user!.id,
    parent_id: typeof parentId === "string" && parentId ? parentId : null,
    body: body.data,
  });
  if (error) return { error: error.message };

  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function updateComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const body = commentSchema.safeParse(formData.get("body"));
  if (!id) return { error: "잘못된 요청입니다." };
  if (!body.success) return { fieldErrors: { body: body.error.issues[0].message } };

  // 본인/운영진만 수정 가능(RLS update 정책으로 최종 방어).
  const { error } = await supabase
    .from("comments")
    .update({ body: body.data })
    .eq("id", id);
  if (error) return { error: error.message };

  if (postId) revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (id) await supabase.from("comments").delete().eq("id", id);
  if (postId) revalidatePath(`/community/${postId}`);
}

export async function toggleLike(formData: FormData): Promise<void> {
  const { supabase, user } = await requireProfile();
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) return;

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  }
  revalidatePath(`/community/${postId}`);
}

// 조회수 1회 집계(하루·뷰어 단위 중복방지). 상세 페이지에서 1회 호출.
export async function recordView(postId: string): Promise<void> {
  if (!postId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let key = user?.id ?? "";
  if (!key) {
    const store = await cookies();
    key = store.get("cv")?.value ?? "";
    if (!key) {
      key = crypto.randomUUID();
      store.set("cv", key, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  // (post_id, viewer_key, day) 충돌이면 무시 → 트리거가 view_count를 안 올린다.
  await supabase
    .from("post_views")
    .upsert(
      { post_id: postId, viewer_key: key },
      { onConflict: "post_id,viewer_key,day", ignoreDuplicates: true },
    );
}

// ───────────────────────── 신고 / 모더레이션 (Phase 3) ─────────────────────────

const REASON_VALUES = REPORT_REASONS.map((r) => r.value) as string[];

// 글·댓글 신고. 서로 다른 신고자 5명 누적 시 DB 트리거가 자동 숨김.
export async function reportTarget(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireProfile();
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 500);

  if ((targetType !== "post" && targetType !== "comment") || !targetId)
    return { error: "잘못된 요청입니다." };
  if (!REASON_VALUES.includes(reason))
    return { fieldErrors: { reason: "신고 사유를 선택하세요." } };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reason as ReportReason,
    detail: detail || null,
  });

  if (error) {
    if (/duplicate key|unique/i.test(error.message))
      return { error: "이미 신고한 항목입니다." };
    return { error: error.message };
  }
  return { ok: true };
}

// 운영진: 글/댓글 숨김 ↔ 복원. 복원 시 해당 대상의 신고를 처리완료로.
export async function moderateHide(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const hidden = formData.get("hidden") === "true";
  const table =
    targetType === "post" ? "posts" : targetType === "comment" ? "comments" : null;
  if (!table || !targetId) return;

  await supabase.from(table).update({ is_hidden: hidden }).eq("id", targetId);
  if (!hidden) {
    await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("target_type", targetType)
      .eq("target_id", targetId);
  }
  revalidatePath("/community/admin");
}

// 운영진: 대상 글/댓글 삭제 + 관련 신고 정리(reports는 글/댓글 FK가 없어 수동 삭제).
export async function moderateDelete(formData: FormData): Promise<void> {
  const { supabase } = await requireStaff();
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const table =
    targetType === "post" ? "posts" : targetType === "comment" ? "comments" : null;
  if (!table || !targetId) return;

  await supabase.from(table).delete().eq("id", targetId);
  await supabase
    .from("reports")
    .delete()
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  revalidatePath("/community/admin");
}

// admin: 역할 변경(운영진 승격/해제). admin 지정은 UI 밖(스크립트)에서만.
export async function setRole(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || (role !== "user" && role !== "moderator")) return;
  if (userId === user.id) return; // 본인 역할은 UI에서 못 바꾼다.

  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/community/admin");
}

// ───────────────────────── 알림 (Phase 4) ─────────────────────────

// 종 드롭다운의 알림 클릭 → 읽음 처리 후 대상 글로 이동.
export async function markNotificationRead(formData: FormData): Promise<void> {
  const { supabase, user } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  if (id)
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
  redirect(postId ? `/community/${postId}` : "/community");
}

// 본인 미읽음 알림 전체 읽음 처리.
export async function markAllNotificationsRead(): Promise<void> {
  const { supabase, user } = await requireProfile();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  revalidatePath("/community");
}

// 알림 설정(이벤트×채널 매트릭스) 저장. 체크 안 된 체크박스는 폼에 안 실리므로 off로 간주.
const PREF_EVENTS = ["comment", "reply", "like", "notice"] as const;
const PREF_CHANNELS = ["bell", "email"] as const;

export async function updateNotificationPrefs(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireProfile();
  const row: Record<string, boolean> = {};
  for (const ev of PREF_EVENTS) {
    for (const ch of PREF_CHANNELS) {
      const name = `${ev}_${ch}`;
      row[name] = formData.get(name) === "on";
    }
  }
  const { error } = await supabase
    .from("notification_prefs")
    .upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath("/community/settings");
  return { ok: true };
}
