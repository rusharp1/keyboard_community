import {
  SWITCH_TYPE_META,
  SILENT_META,
  type SwitchType,
} from "@/data/switches";

function Badge({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: accent + "66",
        backgroundColor: accent + "1a",
        color: accent,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: accent }}
      />
      {label}
    </span>
  );
}

export default function TypeBadge({ type }: { type: SwitchType }) {
  const meta = SWITCH_TYPE_META[type];
  return <Badge label={meta.labelKo} accent={meta.accent} />;
}

export function SilentBadge() {
  return <Badge label={SILENT_META.labelKo} accent={SILENT_META.accent} />;
}
