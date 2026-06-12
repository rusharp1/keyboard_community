/* eslint-disable @typescript-eslint/no-unused-expressions */
// QA 픽스처: 신고 4건이 달린 글 1개를 라이브 보드에 생성한다(검증 스크립트와 달리 self-clean 안 함).
// 사용자가 5번째 신고자가 되어 자동숨김(서로 다른 5명) → 검토큐 복원/삭제를 눈으로 확인하기 위한 것.
//
// 실행:
//   node scripts/seed-report-post.mjs                 # 임시 작성자가 글을 씀(깔끔)
//   node scripts/seed-report-post.mjs you@example.com # 기존 유저를 작성자로 → 자동숨김 시 'locked' 알림 받음
//   node scripts/seed-report-post.mjs --hidden [n]    # 신고 5건(=이미 자동숨김)된 글 n개(기본 5) 생성
//   node scripts/seed-report-post.mjs --clean         # 이 스크립트가 만든 QA 픽스처 전부 정리
//
// 선행: community.sql 적용(reports/on_report_insert/notify 등). DDL 불가 머신이라 service_role DML만 사용.
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("환경변수 누락(.env.local의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const QA_PREFIX = "qa_report_"; // 이 스크립트가 만든 임시 계정 식별용 이메일 prefix
const QA_TITLE_MARK = "[QA] 신고 자동숨김 테스트";
const QA_TITLE_LIKE = "[QA]%"; // --clean이 정리할 QA 글 제목(4건·5건 픽스처 모두 포함)
const SITE = "https://keyboard-community.vercel.app";

// 기존 유저를 이메일로 조회.
async function findUserByEmail(email) {
  const want = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers 오류: ${error.message}`);
    const u = data.users.find((x) => x.email?.toLowerCase() === want);
    if (u) return u;
    if (data.users.length < 1000) break;
  }
  return null;
}

// --clean: QA 픽스처(글 + 임시 계정) 정리.
async function clean() {
  // 1) QA 마커 글 삭제(관련 reports/notifications는 FK cascade).
  const { data: posts } = await db
    .from("posts")
    .select("id, title")
    .ilike("title", QA_TITLE_LIKE);
  for (const p of posts ?? []) {
    await db.from("posts").delete().eq("id", p.id);
    console.log(`🗑️  글 삭제: ${p.id} (${p.title})`);
  }
  // 2) qa_report_* 임시 계정 삭제(profiles는 FK cascade).
  let removed = 0;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers 오류: ${error.message}`);
    for (const u of data.users) {
      if (u.email?.toLowerCase().startsWith(QA_PREFIX)) {
        await db.auth.admin.deleteUser(u.id);
        removed++;
      }
    }
    if (data.users.length < 1000) break;
  }
  console.log(`🗑️  임시 계정 ${removed}명 삭제`);
  console.log("✅ 정리 완료.");
}

async function seed(authorEmail) {
  const stamp = Date.now();
  const created = []; // 정리 안내용 {email, id}

  // 임시 유저 생성(닉네임 메타 → 트리거가 profiles 자동 생성).
  const mkUser = async (slug, nickname) => {
    const email = `${QA_PREFIX}${slug}_${stamp}@example.com`;
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: `Qa!${stamp}${slug}`,
      email_confirm: true,
      user_metadata: { nickname },
    });
    if (error) throw new Error(`임시 유저 생성 실패(${slug}): ${error.message}`);
    created.push({ email, id: data.user.id });
    return data.user.id;
  };

  // 작성자 결정.
  let authorId;
  let authorLabel;
  if (authorEmail) {
    const u = await findUserByEmail(authorEmail);
    if (!u) throw new Error(`작성자 이메일을 찾을 수 없음: ${authorEmail}`);
    authorId = u.id;
    authorLabel = `${authorEmail} (기존 계정 — 자동숨김 시 'locked' 알림 받음)`;
  } else {
    authorId = await mkUser("author", `__qa_author_${stamp}`);
    authorLabel = `임시 계정 __qa_author_${stamp}`;
  }

  // free 카테고리.
  const { data: free, error: ce } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();
  if (ce || !free) throw new Error(`free 카테고리 조회 실패: ${ce?.message ?? "없음"}`);

  // 글 생성.
  const { data: post, error: pe } = await db
    .from("posts")
    .insert({
      user_id: authorId,
      category_id: free.id,
      title: `${QA_TITLE_MARK} — 5번째 신고 시 숨김`,
      body:
        "이 글은 QA용 픽스처입니다. 이미 서로 다른 4명이 신고했어요.\n\n" +
        "**본인 계정으로 한 번 더 신고(5번째)** 하면 자동숨김되어 목록에서 사라집니다.\n" +
        "이후 운영자 계정으로 `/community/admin` 검토큐에서 복원/삭제를 확인하세요.\n\n" +
        "정리: `node scripts/seed-report-post.mjs --clean`",
    })
    .select("id")
    .single();
  if (pe) throw pe;

  // 임시 신고자 4명 + 신고 4건(서로 다른 신고자, open).
  for (let i = 1; i <= 4; i++) {
    const rid = await mkUser(`rep${i}`, `__qa_rep${i}_${stamp}`);
    const { error: re } = await db.from("reports").insert({
      reporter_id: rid,
      target_type: "post",
      target_id: post.id,
      reason: "spam",
    });
    if (re) throw new Error(`신고 insert 실패(rep${i}): ${re.message}`);
  }

  // 상태 검증.
  const { data: row } = await db
    .from("posts")
    .select("is_hidden")
    .eq("id", post.id)
    .single();
  const { count: openCount } = await db
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "post")
    .eq("target_id", post.id)
    .eq("status", "open");

  console.log("\n──────────────────────────────────────────────");
  console.log("✅ 신고 4건 픽스처 생성 완료");
  console.log(`   글 URL : ${SITE}/community/${post.id}`);
  console.log(`            (로컬: http://localhost:3000/community/${post.id})`);
  console.log(`   post id: ${post.id}`);
  console.log(`   작성자 : ${authorLabel}`);
  console.log(`   open 신고: ${openCount ?? "?"}건 / 자동숨김(is_hidden): ${row?.is_hidden}`);
  if (row?.is_hidden || (openCount ?? 0) >= 5)
    console.log("   ⚠️ 예상과 다름: 4건인데 벌써 숨김 — 임계값/중복 확인 필요");
  else console.log("   → 다른 계정으로 1건 더 신고하면 자동숨김됩니다.");
  console.log("\n   생성한 임시 계정(정리 대상):");
  for (const u of created) console.log(`     - ${u.email}`);
  console.log("\n   정리: node scripts/seed-report-post.mjs --clean");
  console.log("──────────────────────────────────────────────");
}

// --hidden: 신고 5건이 달려 이미 자동숨김된 글 count개 생성(검토큐 다건 테스트).
async function seedHidden(count, authorEmail) {
  const stamp = Date.now();
  const created = [];

  const mkUser = async (slug, nickname) => {
    const email = `${QA_PREFIX}${slug}_${stamp}@example.com`;
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: `Qa!${stamp}${slug}`,
      email_confirm: true,
      user_metadata: { nickname },
    });
    if (error) throw new Error(`임시 유저 생성 실패(${slug}): ${error.message}`);
    created.push({ email, id: data.user.id });
    return data.user.id;
  };

  // 작성자 1명 결정.
  let authorId;
  let authorLabel;
  if (authorEmail) {
    const u = await findUserByEmail(authorEmail);
    if (!u) throw new Error(`작성자 이메일을 찾을 수 없음: ${authorEmail}`);
    authorId = u.id;
    authorLabel = `${authorEmail} (기존 계정 — 자동숨김 시 'locked' 알림 받음)`;
  } else {
    authorId = await mkUser("author", `__qa_author_${stamp}`);
    authorLabel = `임시 계정 __qa_author_${stamp}`;
  }

  // 공유 신고자 5명(자동숨김은 대상별 distinct 신고자 5명 → 같은 5명이 각 글 신고해도 글마다 5 distinct).
  const reporterIds = [];
  for (let i = 1; i <= 5; i++) reporterIds.push(await mkUser(`rep${i}`, `__qa_rep${i}_${stamp}`));

  const { data: free, error: ce } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();
  if (ce || !free) throw new Error(`free 카테고리 조회 실패: ${ce?.message ?? "없음"}`);

  const results = [];
  for (let n = 1; n <= count; n++) {
    const { data: post, error: pe } = await db
      .from("posts")
      .insert({
        user_id: authorId,
        category_id: free.id,
        title: `[QA] 자동숨김 글 #${n} — 검토큐 테스트`,
        body:
          `이 글은 QA용 픽스처입니다(#${n}). 서로 다른 5명이 신고해 이미 자동숨김된 상태입니다.\n\n` +
          "목록엔 안 보이고 운영자 `/community/admin` 검토큐에만 나타납니다. 복원/삭제를 테스트하세요.\n\n" +
          "정리: `node scripts/seed-report-post.mjs --clean`",
      })
      .select("id")
      .single();
    if (pe) throw pe;

    for (let i = 0; i < 5; i++) {
      const { error: re } = await db.from("reports").insert({
        reporter_id: reporterIds[i],
        target_type: "post",
        target_id: post.id,
        reason: "spam",
      });
      if (re) throw new Error(`신고 insert 실패(글 #${n}, rep${i + 1}): ${re.message}`);
    }

    const { data: row } = await db
      .from("posts")
      .select("is_hidden")
      .eq("id", post.id)
      .single();
    results.push({ id: post.id, hidden: row?.is_hidden });
  }

  console.log("\n──────────────────────────────────────────────");
  console.log(`✅ 자동숨김 글 ${count}개 생성 완료 (각 신고 5건)`);
  console.log(`   작성자 : ${authorLabel}`);
  for (const r of results) {
    const mark = r.hidden ? "🙈 숨김" : "⚠️ 미숨김(이상!)";
    console.log(`   - ${mark}  ${r.id}  ${SITE}/community/${r.id}`);
  }
  if (results.some((r) => !r.hidden))
    console.log("   ⚠️ 일부 글이 숨김되지 않음 — on_report_insert 트리거/임계값 확인 필요");
  else console.log("   → 모두 자동숨김됨. 운영자 /community/admin 검토큐에서 확인하세요.");
  console.log("\n   생성한 임시 계정(정리 대상):");
  for (const u of created) console.log(`     - ${u.email}`);
  console.log("\n   정리: node scripts/seed-report-post.mjs --clean");
  console.log("──────────────────────────────────────────────");
}

try {
  const arg = process.argv[2];
  if (arg === "--clean") {
    await clean();
  } else if (arg === "--hidden") {
    const rest = process.argv.slice(3);
    const countArg = rest.find((a) => /^\d+$/.test(a));
    const emailArg = rest.find((a) => a.includes("@"));
    await seedHidden(countArg ? Number(countArg) : 5, emailArg ?? null);
  } else {
    await seed(arg && !arg.startsWith("--") ? arg : null);
  }
  process.exit(0);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
