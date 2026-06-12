import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import {
  getModerationQueue,
  getSanctionedUsers,
  getStaffAndCandidates,
} from "@/lib/community/queries";
import {
  adminSetSanction,
  moderateDelete,
  moderateHide,
  setRole,
} from "@/app/community/actions";
import ConfirmSubmitButton from "@/components/community/ConfirmSubmitButton";
import PenaltyButton from "@/components/community/PenaltyButton";
import { REASON_LABEL, ROLE_LABEL } from "@/lib/community/types";

export const metadata: Metadata = {
  title: "운영 — 커뮤니티",
};

export default async function AdminPage() {
  // 운영진만. (admin은 역할 관리 섹션까지 노출)
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";

  const queue = await getModerationQueue();
  const { staff, candidates } = isAdmin
    ? await getStaffAndCandidates()
    : { staff: [], candidates: [] };
  const sanctioned = isAdmin ? await getSanctionedUsers() : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/community" className="text-sm text-muted hover:text-foreground">
        ← 커뮤니티
      </Link>
      <h1 className="mt-3 text-2xl font-bold">운영</h1>

      {/* 신고 검토큐 */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">
          신고 검토큐 {queue.length > 0 && `(${queue.length})`}
        </h2>

        {queue.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            처리할 신고가 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {queue.map((item) => (
              <div
                key={`${item.target_type}:${item.target_id}`}
                className="rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5">
                    {item.target_type === "post" ? "글" : "댓글"}
                  </span>
                  <span className="font-medium text-accent">
                    신고 {item.report_count}
                  </span>
                  {item.is_hidden && (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">
                      숨김
                    </span>
                  )}
                  <span>·</span>
                  <span>{item.reasons.map((r) => REASON_LABEL[r]).join(", ")}</span>
                </div>

                <p className="mt-1.5 break-words text-sm text-foreground">
                  {item.missing ? (
                    <span className="text-muted italic">{item.preview}</span>
                  ) : item.post_id ? (
                    <Link
                      href={`/community/${item.post_id}`}
                      className="hover:text-accent hover:underline"
                    >
                      {item.preview}
                    </Link>
                  ) : (
                    item.preview
                  )}
                </p>

                {!item.missing && item.author_id && (
                  <p className="mt-1.5 text-xs text-muted">
                    작성자 {item.author_nickname ?? "(알 수 없음)"} · 누적 벌점{" "}
                    <span
                      className={
                        item.author_penalty_points > 0 ? "font-medium text-accent" : ""
                      }
                    >
                      {item.author_penalty_points}점
                    </span>
                  </p>
                )}

                {!item.missing && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <form action={moderateHide}>
                      <input type="hidden" name="target_type" value={item.target_type} />
                      <input type="hidden" name="target_id" value={item.target_id} />
                      <input
                        type="hidden"
                        name="hidden"
                        value={item.is_hidden ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-muted hover:text-foreground"
                      >
                        {item.is_hidden ? "복원" : "숨김"}
                      </button>
                    </form>
                    <form action={moderateDelete}>
                      <input type="hidden" name="target_type" value={item.target_type} />
                      <input type="hidden" name="target_id" value={item.target_id} />
                      <ConfirmSubmitButton
                        message="대상을 영구 삭제할까요? 되돌릴 수 없습니다."
                        className="rounded-md border border-border px-2.5 py-1 text-muted hover:text-accent"
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                    {item.author_id && (
                      <PenaltyButton
                        targetType={item.target_type}
                        targetId={item.target_id}
                        authorNickname={item.author_nickname}
                        alreadyPenalized={item.author_penalized}
                      />
                    )}
                  </div>
                )}

                {item.missing && (
                  <form action={moderateDelete} className="mt-2">
                    <input type="hidden" name="target_type" value={item.target_type} />
                    <input type="hidden" name="target_id" value={item.target_id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
                    >
                      신고 정리
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 역할 관리(admin 전용) */}
      {isAdmin && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">역할 관리</h2>

          <h3 className="mt-3 text-xs font-medium text-muted">현재 운영진</h3>
          <div className="mt-1.5 space-y-1.5">
            {staff.length === 0 && (
              <p className="text-sm text-muted">운영진이 없습니다.</p>
            )}
            {staff.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  {u.nickname}{" "}
                  <span className="text-xs text-accent">
                    {ROLE_LABEL[u.role]}
                  </span>
                </span>
                {u.role === "moderator" ? (
                  <form action={setRole}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <input type="hidden" name="role" value="user" />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-accent"
                    >
                      운영진 해제
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-muted">변경 불가</span>
                )}
              </div>
            ))}
          </div>

          <h3 className="mt-4 text-xs font-medium text-muted">
            승격 후보(활동 상위)
          </h3>
          <div className="mt-1.5 space-y-1.5">
            {candidates.length === 0 && (
              <p className="text-sm text-muted">후보가 없습니다.</p>
            )}
            {candidates.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  {u.nickname}{" "}
                  <span className="text-xs text-muted">활동 {u.activity_score}</span>
                </span>
                <form action={setRole}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="role" value="moderator" />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
                  >
                    운영진 승격
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 제재 관리(admin 전용) — 현재 정지/영구정지 회원 해제 */}
      {isAdmin && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">
            제재 관리 {sanctioned.length > 0 && `(${sanctioned.length})`}
          </h2>
          <div className="mt-1.5 space-y-1.5">
            {sanctioned.length === 0 && (
              <p className="text-sm text-muted">현재 제재 중인 회원이 없습니다.</p>
            )}
            {sanctioned.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  {u.nickname}{" "}
                  <span className="text-xs text-accent">
                    {u.is_banned
                      ? "영구정지"
                      : u.suspended_until
                        ? `정지 ${new Date(u.suspended_until).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}까지`
                        : "정지"}
                  </span>{" "}
                  <span className="text-xs text-muted">· 벌점 {u.penalty_points}</span>
                </span>
                <form action={adminSetSanction}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <ConfirmSubmitButton
                    message="이 회원의 제재를 해제할까요? 누적 벌점도 0으로 초기화됩니다."
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-accent"
                  >
                    제재 해제
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
