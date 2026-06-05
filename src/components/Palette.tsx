export default function Palette({
  colors,
  className = "",
  size = "md",
}: {
  colors: string[];
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {colors.map((c, i) => (
        <span
          key={`${c}-${i}`}
          title={c}
          className={`${dim} rounded-md border border-border`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
