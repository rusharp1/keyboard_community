// 운영 역할 수동 지정(첫 admin은 UI 밖, DB에서만 지정).
// 사용: node scripts/set-role.mjs <email> <admin|moderator|user>
// 예:   node scripts/set-role.mjs shop2930@naver.com admin
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const [email, role] = process.argv.slice(2);
const ROLES = ["admin", "moderator", "user"];
if (!email || !ROLES.includes(role)) {
  console.error("사용: node scripts/set-role.mjs <email> <admin|moderator|user>");
  process.exit(1);
}

// 이메일 → auth user → profile.
const { data: list, error: le } = await db.auth.admin.listUsers();
if (le) throw le;
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`❌ 해당 이메일의 계정 없음: ${email}`);
  process.exit(1);
}

const { data: prof, error: pe } = await db
  .from("profiles")
  .update({ role })
  .eq("id", user.id)
  .select("id, nickname, role")
  .single();
if (pe) {
  console.error(`❌ 역할 변경 실패: ${pe.message}`);
  process.exit(1);
}

console.log(`✅ ${prof.nickname} (${email}) → role=${prof.role}`);
