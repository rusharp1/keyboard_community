import { createClient } from "@/lib/supabase/client";

// 글 본문 인라인 이미지(RichEditor) 업로드 공용 헬퍼.
// 브라우저에서 Supabase Storage(post-images)로 올리고 공개 URL을 돌려준다.
export const POST_IMAGE_BUCKET = "post-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadResult = { url?: string; error?: string };

export async function uploadPostImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { error: "이미지 파일만 올릴 수 있습니다." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `각 이미지는 5MB 이하여야 합니다 (${file.name}).` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) return { error: `업로드 실패: ${upErr.message}` };

  return {
    url: supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
  };
}
