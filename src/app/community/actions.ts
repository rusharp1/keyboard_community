"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile, requireUser } from "@/lib/auth/guards";
import { BODY_MAX, COMMENT_MAX, TITLE_MAX } from "@/lib/community/limits";

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
