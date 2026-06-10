/* eslint-disable @typescript-eslint/no-unused-expressions */
// Phase 3 런타임 검증(신고·자동숨김·제약). 임시 신고자 5명+테스트 글을 만들었다가 끝나면 삭제.
// 선행: 갱신된 community.sql 적용(reports 테이블/트리거).
// 실행: node scripts/verify-phase3.mjs
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let pass = 0;
let fail = 0;
const ok = (m) => (console.log(`✅ ${m}`), pass++);
const no = (m) => (console.log(`❌ ${m}`), fail++);
const isHidden = async (id) =>
  (await db.from("posts").select("is_hidden").eq("id", id).single()).data?.is_hidden;

const stamp = Date.now();
const userIds = [];
let postId = null;

try {
  // reports 테이블 존재 확인.
  const probe = await db.from("reports").select("id").limit(1);
  if (probe.error) throw new Error(`reports 테이블 없음 — community.sql 적용 필요: ${probe.error.message}`);

  // 작성자: 기존 프로필 하나 재사용.
  const { data: author } = await db
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!author) throw new Error("기존 프로필이 없어 테스트 글 작성자를 못 정함");

  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  // 임시 신고자 5명(트리거가 닉네임 메타데이터로 profiles 자동 생성).
  for (let i = 1; i <= 5; i++) {
    const { data, error } = await db.auth.admin.createUser({
      email: `verify_r${i}_${stamp}@example.com`,
      password: `Verify!${stamp}${i}`,
      email_confirm: true,
      user_metadata: { nickname: `__verify_r${i}_${stamp}` },
    });
    if (error) throw new Error(`임시 유저 생성 실패: ${error.message}`);
    userIds.push(data.user.id);
  }
  // 프로필 자동 생성 확인.
  const { count: profCount } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("id", userIds);
  profCount === 5
    ? ok("임시 신고자 5명 프로필 자동 생성")
    : no(`프로필 자동 생성: ${profCount}/5 (handle_new_user 트리거 확인 필요)`);

  // 테스트 글.
  const { data: post, error: pe } = await db
    .from("posts")
    .insert({
      user_id: author.id,
      category_id: cat.id,
      title: "[검증용] phase3 신고",
      body: "",
    })
    .select("id")
    .single();
  if (pe) throw pe;
  postId = post.id;

  // 신고 4건 → 아직 숨김 아님.
  for (let i = 0; i < 4; i++) {
    const { error } = await db.from("reports").insert({
      reporter_id: userIds[i],
      target_type: "post",
      target_id: postId,
      reason: "spam",
    });
    if (error) throw new Error(`신고 insert 실패(${i}): ${error.message}`);
  }
  (await isHidden(postId)) === false
    ? ok("4건에서는 숨김 아님(임계값 미만)")
    : no("4건에서 이미 숨김됨(임계값 오류)");

  // 5번째 신고 → 자동 숨김.
  await db.from("reports").insert({
    reporter_id: userIds[4],
    target_type: "post",
    target_id: postId,
    reason: "abuse",
  });
  (await isHidden(postId)) === true
    ? ok("서로 다른 신고자 5명 → 자동 숨김")
    : no("5명인데도 숨김 안 됨(트리거 오류)");

  // 중복 신고 차단(unique).
  const dup = await db.from("reports").insert({
    reporter_id: userIds[0],
    target_type: "post",
    target_id: postId,
    reason: "etc",
  });
  dup.error && /duplicate|unique/i.test(dup.error.message)
    ? ok("같은 신고자 중복 신고 차단(unique)")
    : no(`중복 신고 차단 실패: ${dup.error?.message ?? "에러 없음"}`);

  // 잘못된 사유 차단(check).
  const bad = await db.from("reports").insert({
    reporter_id: userIds[1],
    target_type: "post",
    target_id: postId,
    reason: "nope",
  });
  bad.error && /check|violates/i.test(bad.error.message)
    ? ok("허용되지 않은 사유 차단(check)")
    : no(`사유 check 실패: ${bad.error?.message ?? "에러 없음"}`);
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  if (postId) await db.from("posts").delete().eq("id", postId);
  // 임시 유저 삭제 → 프로필·신고 cascade 정리.
  for (const id of userIds) await db.auth.admin.deleteUser(id);
  console.log(`\n🧹 테스트 글 삭제 + 임시 유저 ${userIds.length}명 삭제`);
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
