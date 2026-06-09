// 일회성 진단: 특정 이메일의 Supabase auth 유저 상태를 조회(읽기 전용).
// 실행: node scripts/diag-user.mjs shop2930@naver.com
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const email = (process.argv[2] ?? "shop2930@naver.com").toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`Supabase URL: ${url}`);
console.log(`조회 이메일: ${email}\n`);

let found = null;
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("listUsers 오류:", error.message);
    process.exit(1);
  }
  const u = data.users.find((x) => x.email?.toLowerCase() === email);
  if (u) { found = u; break; }
  if (data.users.length < 1000) break;
}

if (!found) {
  console.log("❌ 이 이메일의 auth 유저가 존재하지 않습니다. (지금 가입하면 정상적으로 새로 생성돼야 함)");
  process.exit(0);
}

const u = found;
const identities = (u.identities ?? []).map((i) => i.provider);
console.log("✅ auth 유저 존재");
console.log("  id:                ", u.id);
console.log("  email_confirmed_at:", u.email_confirmed_at ?? "(미확인)");
console.log("  created_at:        ", u.created_at);
console.log("  last_sign_in_at:   ", u.last_sign_in_at ?? "(없음)");
console.log("  identities(provider):", identities.length ? identities.join(", ") : "(없음)");
console.log("  app_metadata:      ", JSON.stringify(u.app_metadata ?? {}));
console.log("  user_metadata:     ", JSON.stringify(u.user_metadata ?? {}));

// 비밀번호 설정 여부는 직접 노출되지 않음 → 식별자/메타로 추정.
const hasEmailIdentity = identities.includes("email");
const hasNaver = !!(u.app_metadata && u.app_metadata.naver_id);
console.log("\n진단:");
if (hasNaver && !hasEmailIdentity) {
  console.log("  → 네이버로 생성된 계정으로 보입니다(비밀번호 미설정).");
  console.log("    이메일+비밀번호 로그인은 안 되는 게 정상. 네이버 버튼 또는 비번 재설정으로 들어가세요.");
} else if (hasEmailIdentity) {
  console.log("  → 이메일 가입 식별자가 있습니다. 비번이 틀렸거나 이메일 미확인일 수 있습니다.");
  if (!u.email_confirmed_at) console.log("    email_confirmed_at 이 비어 있음 → 확인 메일 링크 미클릭 상태.");
} else {
  console.log("  → 식별자 정보가 비어 있습니다(관리자 생성 등). 비번 재설정으로 비밀번호를 설정하면 로그인 가능.");
}

// profiles 행 존재 여부도 확인.
const { data: prof } = await admin.from("profiles").select("id, nickname").eq("id", u.id).maybeSingle();
console.log("\n  profiles 행:", prof ? `있음 (nickname=${prof.nickname})` : "없음(온보딩 미완료)");
