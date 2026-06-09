// 일회성: 특정 이메일의 Supabase auth 유저를 삭제(profiles는 FK cascade).
// 실행: node scripts/delete-user.mjs shop2930@naver.com
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const email = (process.argv[2] ?? "").toLowerCase();
if (!email) {
  console.error("이메일을 인자로 주세요: node scripts/delete-user.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let target = null;
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error("listUsers 오류:", error.message); process.exit(1); }
  const u = data.users.find((x) => x.email?.toLowerCase() === email);
  if (u) { target = u; break; }
  if (data.users.length < 1000) break;
}

if (!target) {
  console.log(`이미 없음: ${email} (삭제할 유저 없음)`);
  process.exit(0);
}

console.log(`삭제 대상: ${email} (id ${target.id})`);
const { error } = await admin.auth.admin.deleteUser(target.id);
if (error) { console.error("삭제 실패:", error.message); process.exit(1); }
console.log("✅ 삭제 완료.");
