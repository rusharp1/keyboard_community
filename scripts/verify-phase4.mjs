/* eslint-disable @typescript-eslint/no-unused-expressions */
// Phase 4 런타임 검증(알림 트리거·설정·자기알림 방지). 임시 유저 A·B·C + 테스트 글을 만들었다가 끝나면 삭제.
// 선행: 갱신된 community.sql 적용(notifications/notification_prefs/notify + 트리거).
// 실행: node scripts/verify-phase4.mjs
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

// (수신자, type) 알림 개수.
const countNotif = async (uid, type) =>
  (
    await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("type", type)
  ).count ?? 0;

const stamp = Date.now();
const users = {}; // role → id
const postIds = [];
const reporterIds = []; // 자동잠금 통보 검증용 임시 신고자

try {
  const probe = await db.from("notifications").select("id").limit(1);
  if (probe.error)
    throw new Error(`notifications 테이블 없음 — community.sql 적용 필요: ${probe.error.message}`);

  // 임시 유저 A·B·C(트리거가 닉네임 메타로 profiles 자동 생성).
  for (const who of ["a", "b", "c"]) {
    const { data, error } = await db.auth.admin.createUser({
      email: `verify_n_${who}_${stamp}@example.com`,
      password: `Verify!${stamp}${who}`,
      email_confirm: true,
      user_metadata: { nickname: `__verify_n_${who}_${stamp}` },
    });
    if (error) throw new Error(`임시 유저 생성 실패(${who}): ${error.message}`);
    users[who] = data.user.id;
  }

  const { data: free } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();
  const { data: notice } = await db
    .from("categories")
    .select("id")
    .eq("slug", "notice")
    .maybeSingle();

  // A의 글 P.
  const { data: post, error: pe } = await db
    .from("posts")
    .insert({ user_id: users.a, category_id: free.id, title: "[검증] 알림", body: "" })
    .select("id")
    .single();
  if (pe) throw pe;
  postIds.push(post.id);

  // 1) B가 P에 댓글 → A에게 'comment'.
  const { data: c1, error: ce } = await db
    .from("comments")
    .insert({ post_id: post.id, user_id: users.b, body: "B의 댓글" })
    .select("id")
    .single();
  if (ce) throw ce;
  (await countNotif(users.a, "comment")) === 1
    ? ok("최상위 댓글 → 글 작성자에게 'comment'")
    : no(`comment 알림: ${await countNotif(users.a, "comment")}`);

  // 2) C가 B의 댓글에 대댓글 → B에게 'reply'(A에겐 추가 comment 없음).
  await db
    .from("comments")
    .insert({ post_id: post.id, user_id: users.c, parent_id: c1.id, body: "C의 대댓글" });
  (await countNotif(users.b, "reply")) === 1
    ? ok("대댓글 → 상위 댓글 작성자에게 'reply'")
    : no(`reply 알림: ${await countNotif(users.b, "reply")}`);
  (await countNotif(users.a, "comment")) === 1
    ? ok("대댓글은 글 작성자에게 중복 comment 안 보냄")
    : no(`대댓글 후 A comment 수: ${await countNotif(users.a, "comment")}`);

  // 3) 자기 알림 방지: A가 자기 글에 댓글 → A에게 알림 없음(여전히 1).
  await db
    .from("comments")
    .insert({ post_id: post.id, user_id: users.a, body: "작성자 본인 댓글" });
  (await countNotif(users.a, "comment")) === 1
    ? ok("자기 글 댓글은 자기 알림 안 보냄")
    : no(`자기 댓글 후 A comment 수: ${await countNotif(users.a, "comment")}`);

  // 4) 좋아요 기본 OFF: B가 A 글 좋아요 → like_bell 기본 false → A에게 알림 없음.
  await db.from("post_likes").insert({ post_id: post.id, user_id: users.b });
  (await countNotif(users.a, "like")) === 0
    ? ok("좋아요 알림 기본 OFF(like_bell=false) → 미생성")
    : no(`기본 off인데 like 알림 생성됨: ${await countNotif(users.a, "like")}`);

  // 5) A가 like_bell 켜면 → C 좋아요 시 'like' 생성.
  await db.from("notification_prefs").upsert({ user_id: users.a, like_bell: true });
  await db.from("post_likes").insert({ post_id: post.id, user_id: users.c });
  (await countNotif(users.a, "like")) === 1
    ? ok("like_bell ON 후 좋아요 → 'like' 생성")
    : no(`like_bell on인데 like 알림: ${await countNotif(users.a, "like")}`);

  // 6) 공지 fan-out: A가 공지 글 작성(service_role로 admin_only 우회) → B·C에게 'notice'.
  const { data: np, error: npe } = await db
    .from("posts")
    .insert({ user_id: users.a, category_id: notice.id, title: "[검증] 공지", body: "" })
    .select("id")
    .single();
  if (npe) throw npe;
  postIds.push(np.id);
  const bNotice = await countNotif(users.b, "notice");
  const cNotice = await countNotif(users.c, "notice");
  const aNotice = await countNotif(users.a, "notice");
  bNotice >= 1 && cNotice >= 1
    ? ok("공지 글 → 작성자 외 전체에게 'notice' fan-out")
    : no(`notice fan-out: B=${bNotice}, C=${cNotice}`);
  aNotice === 0
    ? ok("공지 작성자 본인은 notice 알림 제외")
    : no(`공지 작성자에게 notice 생김: ${aNotice}`);

  // 7) 자동잠금 통보: 서로 다른 6명 신고자 + A의 새 글 L.
  for (let i = 1; i <= 6; i++) {
    const { data, error } = await db.auth.admin.createUser({
      email: `verify_rep${i}_${stamp}@example.com`,
      password: `Verify!${stamp}r${i}`,
      email_confirm: true,
      user_metadata: { nickname: `__verify_rep${i}_${stamp}` },
    });
    if (error) throw new Error(`임시 신고자 생성 실패(${i}): ${error.message}`);
    reporterIds.push(data.user.id);
  }
  const { data: locked, error: le } = await db
    .from("posts")
    .insert({ user_id: users.a, category_id: free.id, title: "[검증] 자동잠금", body: "" })
    .select("id")
    .single();
  if (le) throw le;
  postIds.push(locked.id);

  // 신고 5건 → 자동숨김 + 작성자(A)에게 'locked' 1건.
  for (let i = 0; i < 5; i++) {
    await db.from("reports").insert({
      reporter_id: reporterIds[i],
      target_type: "post",
      target_id: locked.id,
      reason: "spam",
    });
  }
  (await countNotif(users.a, "locked")) === 1
    ? ok("신고 5건 자동숨김 → 작성자에게 'locked' 1건")
    : no(`locked 알림: ${await countNotif(users.a, "locked")}`);

  // 6번째 신고 → 이미 숨김 상태라 중복 알림 없음(여전히 1).
  await db.from("reports").insert({
    reporter_id: reporterIds[5],
    target_type: "post",
    target_id: locked.id,
    reason: "abuse",
  });
  (await countNotif(users.a, "locked")) === 1
    ? ok("6번째 신고에도 locked 알림 중복 없음(전환 시 1회만)")
    : no(`6번째 후 locked 알림: ${await countNotif(users.a, "locked")}`);
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  // 글 삭제 → 관련 알림/댓글/좋아요 cascade(post_id FK on delete cascade 포함).
  for (const id of postIds) await db.from("posts").delete().eq("id", id);
  const allUsers = [...Object.values(users), ...reporterIds];
  for (const id of allUsers) await db.auth.admin.deleteUser(id);
  console.log(`\n🧹 테스트 글 ${postIds.length}개 + 임시 유저 ${allUsers.length}명 삭제`);
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
