import { SWITCH_TYPE_META, type SwitchType } from "@/data/switches";

export default function TypeBadge({ type }: { type: SwitchType }) {
  const meta = SWITCH_TYPE_META[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: meta.accent + "66",
        backgroundColor: meta.accent + "1a",
        color: meta.accent,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.accent }}
      />
      {meta.labelKo}
    </span>
  );
}
