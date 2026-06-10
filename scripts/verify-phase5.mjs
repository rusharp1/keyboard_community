/* eslint-disable @typescript-eslint/no-unused-expressions */
// Phase 5 런타임 검증(댓글 좋아요: 카운터·활동점수·알림). 임시 유저 A·B를 만들었다가 끝나면 삭제.
// 선행: 갱신된 community.sql 적용(comment_likes/comments.like_count + 트리거).
// 실행: node scripts/verify-phase5.mjs
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

const likeCount = async (commentId) =>
  (await db.from("comments").select("like_count").eq("id", commentId).single()).data
    ?.like_count ?? -1;
const score = async (uid) =>
  (await db.from("profiles").select("activity_score").eq("id", uid).single()).data
    ?.activity_score ?? -1;
const countNotif = async (uid, type) =>
  (
    await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("type", type)
  ).count ?? 0;

const stamp = Date.now();
const users = {};
const postIds = [];

try {
  const probe = await db.from("comment_likes").select("comment_id").limit(1);
  if (probe.error)
    throw new Error(`comment_likes 없음 — community.sql 적용 필요: ${probe.error.message}`);

  for (const who of ["a", "b"]) {
    const { data, error } = await db.auth.admin.createUser({
      email: `verify_cl_${who}_${stamp}@example.com`,
      password: `Verify!${stamp}${who}`,
      email_confirm: true,
      user_metadata: { nickname: `__verify_cl_${who}_${stamp}` },
    });
    if (error) throw new Error(`임시 유저 생성 실패(${who}): ${error.message}`);
    users[who] = data.user.id;
  }

  const { data: free } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  // A의 글 + A의 댓글.
  const { data: post } = await db
    .from("posts")
    .insert({ user_id: users.a, category_id: free.id, title: "[검증] 댓글좋아요", body: "" })
    .select("id")
    .single();
  postIds.push(post.id);
  const { data: comment } = await db
    .from("comments")
    .insert({ post_id: post.id, user_id: users.a, body: "A의 댓글" })
    .select("id")
    .single();

  // A가 like_bell 켜둠(기본 OFF라 알림 검증 위해 ON).
  await db.from("notification_prefs").upsert({ user_id: users.a, like_bell: true });

  const scoreBefore = await score(users.a);

  // 1) B가 A 댓글 좋아요 → like_count 1, 작성자 점수 +2, A에게 'like'(comment_id 있음).
  await db.from("comment_likes").insert({ comment_id: comment.id, user_id: users.b });
  (await likeCount(comment.id)) === 1
    ? ok("댓글 좋아요 → like_count 1")
    : no(`like_count: ${await likeCount(comment.id)}`);
  (await score(users.a)) === scoreBefore + 2
    ? ok("댓글 작성자 활동점수 +2")
    : no(`점수: ${await score(users.a)} (기대 ${scoreBefore + 2})`);
  (await countNotif(users.a, "like")) === 1
    ? ok("댓글 작성자에게 'like' 알림 1건")
    : no(`like 알림: ${await countNotif(users.a, "like")}`);

  // 알림에 comment_id가 채워졌는지(앱 포맷터가 "댓글 좋아요"로 표시하는 근거).
  const { data: notif } = await db
    .from("notifications")
    .select("comment_id")
    .eq("user_id", users.a)
    .eq("type", "like")
    .maybeSingle();
  notif?.comment_id === comment.id
    ? ok("'like' 알림에 comment_id 채워짐(댓글 좋아요 구분)")
    : no(`comment_id: ${notif?.comment_id}`);

  // 2) 좋아요 취소 → like_count 0, 점수 원복.
  await db
    .from("comment_likes")
    .delete()
    .eq("comment_id", comment.id)
    .eq("user_id", users.b);
  (await likeCount(comment.id)) === 0
    ? ok("좋아요 취소 → like_count 0")
    : no(`취소 후 like_count: ${await likeCount(comment.id)}`);
  (await score(users.a)) === scoreBefore
    ? ok("좋아요 취소 → 활동점수 원복")
    : no(`취소 후 점수: ${await score(users.a)} (기대 ${scoreBefore})`);

  // 3) 자기 댓글 좋아요는 자기 알림 안 감(여전히 1; notify가 self skip).
  await db.from("comment_likes").insert({ comment_id: comment.id, user_id: users.a });
  (await countNotif(users.a, "like")) === 1
    ? ok("자기 댓글 좋아요는 자기 알림 안 보냄")
    : no(`자기 좋아요 후 like 알림: ${await countNotif(users.a, "like")}`);
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  for (const id of postIds) await db.from("posts").delete().eq("id", id);
  for (const id of Object.values(users)) await db.auth.admin.deleteUser(id);
  console.log(`\n🧹 테스트 글 ${postIds.length}개 + 임시 유저 ${Object.keys(users).length}명 삭제`);
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
