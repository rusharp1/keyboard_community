// 커뮤니티 스키마 적용 여부 점검(읽기 전용).
// 실행: node scripts/check-community-schema.mjs
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, key, { auth: { persistSession: false } });

async function probe(label, fn) {
  const { error } = await fn();
  console.log(error ? `❌ ${label}: ${error.message}` : `✅ ${label}`);
}

console.log(`Supabase: ${url}\n`);
await probe("profiles.role 컬럼", () =>
  db.from("profiles").select("role, activity_score").limit(1),
);
await probe("categories 테이블", () => db.from("categories").select("slug").limit(1));
await probe("posts 테이블", () => db.from("posts").select("id").limit(1));
await probe("comments 테이블", () => db.from("comments").select("id").limit(1));
await probe("post_likes 테이블", () => db.from("post_likes").select("post_id").limit(1));

// Phase 2
await probe("posts.images 컬럼", () => db.from("posts").select("images").limit(1));
await probe("post_views 테이블", () => db.from("post_views").select("post_id").limit(1));

const { data: bucket } = await db.storage.getBucket("post-images");
console.log(
  bucket ? `✅ Storage 버킷 post-images (public=${bucket.public})` : "❌ Storage 버킷 post-images 없음",
);

// Phase 3
await probe("reports 테이블", () =>
  db.from("reports").select("id, status").limit(1),
);

const { data: cats } = await db.from("categories").select("slug, name").order("position");
console.log("\n카테고리:", cats?.map((c) => `${c.slug}(${c.name})`).join(", ") ?? "(없음)");
