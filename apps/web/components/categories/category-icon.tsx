import { categoryMeta } from "@/lib/category-icons";

export function CategoryIcon({ icon, size = 40 }: { icon?: string | null; size?: number }) {
  const meta = categoryMeta(icon);
  const Icon = meta.icon;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.31),
        backgroundColor: `${meta.tint}24`,
        color: meta.tint,
      }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  );
}
