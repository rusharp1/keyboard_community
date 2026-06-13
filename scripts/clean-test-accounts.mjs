// 운영 공개 전 테스트 계정 정리. @example.com·@yopmail.com·__rpttest_/__verify 닉네임 계정 삭제.
// 실제 계정(아래 KEEP)은 보존. 계정 삭제 시 profiles·posts·comments·reviews·penalties 등 cascade 정리.
// 신고(reports)는 글/댓글 FK가 없어 작성자 글 기준으로 먼저 정리한다.
// 실행: node scripts/clean-test-accounts.mjs        (미리보기)
//       node scripts/clean-test-accounts.mjs --yes  (실제 삭제)
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const KEEP = ["shop2930@naver.com", "yolee102@naver.com"];
const apply = process.argv.includes("--yes");

async function allUsers() {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    out.push(...data.users);
    if (data.users.length < 200) break;
  }
  return out;
}

const isTest = (u) => {
  const email = (u.email ?? "").toLowerCase();
  const nick = u.user_metadata?.nickname ?? "";
  if (KEEP.includes(email)) return false;
  return (
    email.endsWith("@example.com") ||
    email.endsWith("@yopmail.com") ||
    nick.startsWith("__rpttest_") ||
    nick.startsWith("__verify") ||
    email.startsWith("verify_")
  );
};

const users = await allUsers();
const targets = users.filter(isTest);

console.log(`전체 ${users.length}명 중 테스트 계정 ${targets.length}명:`);
for (const u of targets) console.log(`  - ${u.email} (${u.user_metadata?.nickname ?? "?"})`);

if (!apply) {
  console.log(`\n미리보기입니다. 실제 삭제하려면 --yes 를 붙이세요.`);
  process.exit(0);
}

let removed = 0;
for (const u of targets) {
  // 작성자 글 → 관련 신고·글 먼저 삭제(reports는 FK 없음).
  const { data: posts } = await db.from("posts").select("id").eq("user_id", u.id);
  for (const p of posts ?? []) {
    await db.from("reports").delete().eq("target_type", "post").eq("target_id", p.id);
    await db.from("posts").delete().eq("id", p.id);
  }
  const { error } = await db.auth.admin.deleteUser(u.id);
  if (error) console.log(`  ❌ ${u.email}: ${error.message}`);
  else removed++;
}
console.log(`\n🧹 ${removed}/${targets.length}명 삭제 완료. (보존: ${KEEP.join(", ")})`);
