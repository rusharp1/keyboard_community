/* eslint-disable @typescript-eslint/no-unused-expressions */
// Phase 9 런타임 검증(다축 리뷰·집계·중복·범위·신고 자동숨김·활동점수). self-clean.
// 선행: community.sql Phase 9 적용(reviews 테이블/뷰/트리거, reports 'review', posts item 컬럼).
// 실행: node scripts/verify-phase9.mjs
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
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.05;

const stamp = Date.now();
const ITEM = { type: "switch", slug: `verify-${stamp}` };
const userIds = [];
let reviewId = null;

const mkUser = async (tag) => {
  const { data, error } = await db.auth.admin.createUser({
    email: `verify_rv_${tag}_${stamp}@example.com`,
    password: `Verify!${stamp}${tag}`,
    email_confirm: true,
    user_metadata: { nickname: `__verify_rv_${tag}_${stamp}`.slice(0, 20) },
  });
  if (error) throw new Error(`유저 생성 실패(${tag}): ${error.message}`);
  userIds.push(data.user.id);
  return data.user.id;
};
const score = async (id) =>
  (await db.from("profiles").select("activity_score").eq("id", id).single()).data
    ?.activity_score;
const stats = async () =>
  (
    await db
      .from("review_stats")
      .select("n, avg_overall")
      .eq("item_type", ITEM.type)
      .eq("item_slug", ITEM.slug)
      .maybeSingle()
  ).data;

try {
  const probe = await db.from("reviews").select("id").limit(1);
  if (probe.error)
    throw new Error(`reviews 테이블 없음 — community.sql Phase 9 적용 필요: ${probe.error.message}`);

  const a = await mkUser("a");

  // 1) 다축 리뷰 insert(5,4,3) → 집계 n=1, overall=4.00.
  const ins = await db
    .from("reviews")
    .insert({ user_id: a, item_type: ITEM.type, item_slug: ITEM.slug, axis1: 5, axis2: 4, axis3: 3, body: "검증" })
    .select("id")
    .single();
  if (ins.error) throw new Error(`리뷰 insert 실패: ${ins.error.message}`);
  reviewId = ins.data.id;
  let s = await stats();
  s && Number(s.n) === 1 && near(s.avg_overall, 4)
    ? ok("리뷰 1건 → review_stats n=1, 종합 4.00")
    : no(`집계 이상: ${JSON.stringify(s)}`);

  // 2) 작성자 활동점수 +2.
  (await score(a)) === 2
    ? ok("리뷰 작성 → 활동점수 +2")
    : no(`활동점수 이상: ${await score(a)}`);

  // 3) 같은 유저·같은 아이템 중복 insert 차단(unique).
  const dup = await db.from("reviews").insert({
    user_id: a, item_type: ITEM.type, item_slug: ITEM.slug, axis1: 1, axis2: 1, axis3: 1,
  });
  dup.error && /duplicate|unique/i.test(dup.error.message)
    ? ok("같은 유저·아이템 중복 리뷰 차단(unique)")
    : no(`중복 차단 실패: ${dup.error?.message ?? "에러 없음"}`);

  // 4) 별점 범위(1~5) check.
  const bad = await db.from("reviews").insert({
    user_id: a, item_type: ITEM.type, item_slug: `${ITEM.slug}-x`, axis1: 6, axis2: 3, axis3: 3,
  });
  bad.error && /check|violates|between|range/i.test(bad.error.message)
    ? ok("별점 1~5 범위 check 차단")
    : no(`범위 check 실패: ${bad.error?.message ?? "에러 없음"}`);
  if (!bad.error)
    await db.from("reviews").delete().eq("user_id", a).eq("item_slug", `${ITEM.slug}-x`);

  // 5) 두 번째 리뷰어(1,1,1) → 집계 n=2, overall=2.5.
  const b = await mkUser("b");
  await db.from("reviews").insert({
    user_id: b, item_type: ITEM.type, item_slug: ITEM.slug, axis1: 1, axis2: 1, axis3: 1,
  });
  s = await stats();
  s && Number(s.n) === 2 && near(s.avg_overall, 2.5)
    ? ok("리뷰 2건 → n=2, 종합 2.5")
    : no(`2건 집계 이상: ${JSON.stringify(s)}`);

  // 6) 서로 다른 5명 신고 → A 리뷰 자동숨김 + 'locked' 알림.
  for (let i = 0; i < 5; i++) {
    const r = await mkUser(`rep${i}`);
    const { error } = await db.from("reports").insert({
      reporter_id: r, target_type: "review", target_id: reviewId, reason: "spam",
    });
    if (error) throw new Error(`리뷰 신고 실패(${i}): ${error.message}`);
  }
  const hidden = (await db.from("reviews").select("is_hidden").eq("id", reviewId).single())
    .data?.is_hidden;
  hidden === true
    ? ok("리뷰 신고 5명 → 자동숨김(is_hidden)")
    : no(`리뷰 자동숨김 실패: is_hidden=${hidden}`);

  const { count: locked } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", a)
    .eq("type", "locked");
  (locked ?? 0) >= 1
    ? ok("숨김 작성자에게 'locked' 알림")
    : no(`locked 알림 없음: ${locked}`);

  // 7) 숨김 제외 집계 → n=1(B만).
  s = await stats();
  s && Number(s.n) === 1
    ? ok("숨김 리뷰는 집계 제외 → n=1")
    : no(`숨김 제외 집계 이상: ${JSON.stringify(s)}`);
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  if (reviewId)
    await db.from("reports").delete().eq("target_type", "review").eq("target_id", reviewId);
  for (const id of userIds) await db.auth.admin.deleteUser(id);
  console.log(`\n🧹 임시 유저 ${userIds.length}명 + 리뷰/신고/알림 cascade 삭제`);
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
