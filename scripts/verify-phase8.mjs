/* eslint-disable @typescript-eslint/no-unused-expressions */
// Phase 8 런타임 검증(벌점 누적·제재 에스컬레이션·중복차단). 임시 작성자 1명 생성→삭제(self-clean).
// 선행: 갱신된 community.sql 의 Phase 8 섹션 적용(penalties 테이블/트리거, profiles 제재컬럼).
// 실행: node scripts/verify-phase8.mjs
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

const stamp = Date.now();
let authorId = null;
let dupTarget = null;

const prof = async () =>
  (
    await db
      .from("profiles")
      .select("penalty_points, suspended_until, is_banned")
      .eq("id", authorId)
      .single()
  ).data;

// 누적 도달용 벌점 1건 부과(서로 다른 target_id로 unique 회피).
const addPenalty = async (points) => {
  const target_id = crypto.randomUUID();
  const { error } = await db.from("penalties").insert({
    user_id: authorId,
    points,
    target_type: "post",
    target_id,
  });
  if (error) throw new Error(`penalty insert(+${points}) 실패: ${error.message}`);
  return target_id;
};

// suspended_until 이 now+days 부근(±0.5일)인지.
const aroundDays = (iso, days) => {
  if (!iso) return false;
  const diffDays = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  return Math.abs(diffDays - days) < 0.5;
};

try {
  const probe = await db.from("penalties").select("id").limit(1);
  if (probe.error)
    throw new Error(`penalties 테이블 없음 — community.sql Phase 8 적용 필요: ${probe.error.message}`);

  // 임시 작성자(트리거가 닉네임 메타로 profiles 자동 생성, penalty_points 기본 0).
  const { data: u, error: ue } = await db.auth.admin.createUser({
    email: `verify_p_${stamp}@example.com`,
    password: `Verify!${stamp}`,
    email_confirm: true,
    user_metadata: { nickname: `__verify_p_${stamp}` },
  });
  if (ue) throw new Error(`임시 유저 생성 실패: ${ue.message}`);
  authorId = u.user.id;

  // +2 (누적 2): 제재 없음.
  dupTarget = await addPenalty(2);
  let p = await prof();
  p.penalty_points === 2 && !p.is_banned && p.suspended_until == null
    ? ok("누적 2점 — 제재 없음, 점수 가산")
    : no(`누적 2점 상태 이상: ${JSON.stringify(p)}`);

  // +1 (누적 3): 경고 단계 — 정지 없음.
  await addPenalty(1);
  p = await prof();
  p.penalty_points === 3 && !p.is_banned && p.suspended_until == null
    ? ok("누적 3점 — 경고 단계(정지 없음)")
    : no(`누적 3점 상태 이상: ${JSON.stringify(p)}`);

  // +2 (누적 5): 7일 정지.
  await addPenalty(2);
  p = await prof();
  p.penalty_points === 5 && !p.is_banned && aroundDays(p.suspended_until, 7)
    ? ok("누적 5점 → 7일 활동정지")
    : no(`누적 5점 7일정지 실패: ${JSON.stringify(p)}`);

  // +3 (누적 8): 30일 정지로 에스컬레이트.
  await addPenalty(3);
  p = await prof();
  p.penalty_points === 8 && !p.is_banned && aroundDays(p.suspended_until, 30)
    ? ok("누적 8점 → 30일 활동정지(에스컬레이트)")
    : no(`누적 8점 30일정지 실패: ${JSON.stringify(p)}`);

  // +2 (누적 10): 영구 이용정지.
  await addPenalty(2);
  p = await prof();
  p.penalty_points === 10 && p.is_banned === true
    ? ok("누적 10점 → 영구 이용정지(is_banned)")
    : no(`누적 10점 ban 실패: ${JSON.stringify(p)}`);

  // 'penalty' 알림이 부과 횟수만큼 생성됐는지(5건).
  const { count: noti } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authorId)
    .eq("type", "penalty");
  noti === 5
    ? ok("'penalty' 알림 5건 생성(부과 1건당 1건)")
    : no(`penalty 알림 수 불일치: ${noti}/5`);

  // 같은 콘텐츠 중복 부과 차단(unique target_type+target_id).
  const dup = await db.from("penalties").insert({
    user_id: authorId,
    points: 1,
    target_type: "post",
    target_id: dupTarget,
  });
  dup.error && /duplicate|unique/i.test(dup.error.message)
    ? ok("같은 콘텐츠 중복 부과 차단(unique)")
    : no(`중복 부과 차단 실패: ${dup.error?.message ?? "에러 없음"}`);

  // 점수 범위(1~5) check 위반 차단(6은 거부).
  const bad = await db.from("penalties").insert({
    user_id: authorId,
    points: 6,
    target_type: "post",
    target_id: crypto.randomUUID(),
  });
  bad.error && /check|violates|range|between/i.test(bad.error.message)
    ? ok("점수 1~5 범위 check 차단(6 거부)")
    : no(`점수 범위 check 실패: ${bad.error?.message ?? "에러 없음"}`);

  // '심각(+5)' 한 방 → 누적 5점=7일 정지 임계 도달(즉시 정지) 확인.
  const sev = await db.from("penalties").insert({
    user_id: authorId,
    points: 5,
    target_type: "comment",
    target_id: crypto.randomUUID(),
  });
  sev.error
    ? no(`+5 부과 실패(1~5 허용 안 됨?): ${sev.error.message}`)
    : ok("심각(+5) 부과 허용(1~5 범위)");
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  // 임시 유저 삭제 → profiles·penalties·notifications cascade 정리.
  if (authorId) await db.auth.admin.deleteUser(authorId);
  console.log(`\n🧹 임시 작성자 + 벌점/알림 cascade 삭제`);
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
