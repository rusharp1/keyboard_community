// Phase 2 런타임 검증(트리거/임베드/인기글). 테스트용 글을 만들었다가 끝나면 삭제.
// 실행: node scripts/verify-phase2.mjs
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const AUTHOR = "author:profiles!user_id(nickname, activity_score, role)";
let pass = 0;
let fail = 0;
const ok = (m) => (console.log(`✅ ${m}`), pass++);
const no = (m) => (console.log(`❌ ${m}`), fail++);

let postId = null;
try {
  // 기준 데이터: 글쓸 작성자(profiles) + 자유 카테고리.
  const { data: prof } = await db
    .from("profiles")
    .select("id, activity_score")
    .limit(1)
    .maybeSingle();
  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();
  if (!prof) throw new Error("profiles 행이 없음 — 테스트 작성자 필요");
  if (!cat) throw new Error("free 카테고리 없음");
  const scoreBefore = prof.activity_score;

  // 1) 이미지 배열 저장
  const imgs = ["https://example.com/a.jpg", "https://example.com/b.jpg"];
  const { data: created, error: ce } = await db
    .from("posts")
    .insert({
      user_id: prof.id,
      category_id: cat.id,
      title: "[검증용] phase2 smoke",
      body: "",
      images: imgs,
    })
    .select("id, images, view_count, like_count")
    .single();
  if (ce) throw ce;
  postId = created.id;
  Array.isArray(created.images) && created.images.length === 2
    ? ok(`이미지 배열 저장 (${created.images.length}장)`)
    : no(`이미지 배열 저장: ${JSON.stringify(created.images)}`);

  // 2) AUTHOR 임베드(FK 힌트) — Phase 1 회귀 가드
  const { data: embed, error: ee } = await db
    .from("posts")
    .select(`id, title, images, ${AUTHOR}`)
    .eq("id", postId)
    .single();
  ee || !embed?.author
    ? no(`author 임베드: ${ee?.message ?? "author 없음"}`)
    : ok("author 임베드(profiles!user_id) 동작");

  // 3) 조회수 트리거 — post_views insert → view_count 증가
  await db.from("post_views").insert({ post_id: postId, viewer_key: "verify-key-1" });
  let { data: v1 } = await db.from("posts").select("view_count").eq("id", postId).single();
  v1.view_count === 1 ? ok("조회수 트리거 (1)") : no(`조회수 트리거: ${v1.view_count}`);

  // 3b) 같은 (글·뷰어·날짜) 중복 — ignoreDuplicates면 트리거 미발화 → 그대로 1
  await db
    .from("post_views")
    .upsert(
      { post_id: postId, viewer_key: "verify-key-1" },
      { onConflict: "post_id,viewer_key,day", ignoreDuplicates: true },
    );
  let { data: v2 } = await db.from("posts").select("view_count").eq("id", postId).single();
  v2.view_count === 1 ? ok("중복 조회 무시 (여전히 1)") : no(`중복 조회 무시: ${v2.view_count}`);

  // 3c) 다른 뷰어 → 2
  await db.from("post_views").insert({ post_id: postId, viewer_key: "verify-key-2" });
  let { data: v3 } = await db.from("posts").select("view_count").eq("id", postId).single();
  v3.view_count === 2 ? ok("다른 뷰어 조회수 증가 (2)") : no(`다른 뷰어: ${v3.view_count}`);

  // 4) 좋아요 트리거 — like_count 증가
  await db.from("post_likes").insert({ post_id: postId, user_id: prof.id });
  let { data: l1 } = await db.from("posts").select("like_count").eq("id", postId).single();
  l1.like_count === 1 ? ok("좋아요 카운터 트리거 (1)") : no(`좋아요 카운터: ${l1.like_count}`);

  // 5) 활동점수 트리거 — 글+좋아요로 작성자 점수 상승
  const { data: profAfter } = await db
    .from("profiles")
    .select("activity_score")
    .eq("id", prof.id)
    .single();
  profAfter.activity_score > scoreBefore
    ? ok(`활동점수 상승 (${scoreBefore} → ${profAfter.activity_score})`)
    : no(`활동점수: ${scoreBefore} → ${profAfter.activity_score}`);

  // 6) 인기글 쿼리 — 최근 7일·가중점수>0에 이 글 포함
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: bestRaw } = await db
    .from("posts")
    .select("id, like_count, comment_count")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .limit(50);
  const best = (bestRaw ?? [])
    .map((p) => ({ id: p.id, score: p.like_count * 2 + p.comment_count }))
    .filter((x) => x.score > 0);
  best.some((x) => x.id === postId)
    ? ok(`인기글 후보 포함 (score=${best.find((x) => x.id === postId).score})`)
    : no("인기글 후보 미포함");
} catch (e) {
  no(`예외: ${e.message}`);
} finally {
  if (postId) {
    await db.from("posts").delete().eq("id", postId); // cascade로 views/likes 정리
    console.log("\n🧹 테스트 글 삭제 완료");
  }
  console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
  process.exit(fail ? 1 : 0);
}
