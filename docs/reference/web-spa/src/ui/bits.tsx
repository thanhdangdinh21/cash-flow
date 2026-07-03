/* Shared text/number/logo/category bits — ported from web/ui.jsx. */
import type { CSSProperties, ReactNode } from "react";
import { money } from "../data/format";
import type { Category } from "../data/types";
import { I } from "./icons";

export function Amt({
  v,
  sign = true,
  cents = true,
  tone = "auto",
  size,
  weight = 600,
  style,
  className = "",
}: {
  v: number;
  sign?: boolean;
  cents?: boolean;
  tone?: "auto" | "pos" | "neg" | "";
  size?: number;
  weight?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const t = tone === "auto" ? (v > 0 ? "pos" : "") : tone;
  return (
    <span
      className={`w-amount ${t ? `w-${t}` : ""} ${className}`.trim()}
      style={{ fontSize: size, fontWeight: weight, letterSpacing: "-0.01em", ...style }}
    >
      {money(v, { sign, cents })}
    </span>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className="w-eyebrow" style={style}>{children}</div>;
}

export function Kbd({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <kbd className="w-kbd" style={style}>{children}</kbd>;
}

export function Keys({ k, style }: { k: string; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", ...style }}>
      {k.split(" ").map((key, i) => <Kbd key={i}>{key}</Kbd>)}
    </span>
  );
}

export function LogoMark({ size = 22, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style} aria-label="Money Flow">
      <path d="M5 24.5 Q 12.5 12.5 20 18.5 T 35 12.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M5 31.5 Q 12.5 19.5 20 25.5 T 35 19.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );
}

export function Logo({ size = 22, word = true, wordSize = 15, gap = 9, style }: {
  size?: number; word?: boolean; wordSize?: number; gap?: number; style?: CSSProperties;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, ...style }}>
      <LogoMark size={size} />
      {word && <span style={{ fontSize: wordSize, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>Money flow</span>}
    </span>
  );
}

/* ── Category chips ─────────────────────────────────────── */

const FALLBACK = { icon: "flag", tint: "#8C897D", label: "Global" };

export function CatChip({
  cat,
  size = 26,
  icon = 14,
  radius = 8,
  style,
}: {
  cat?: Pick<Category, "icon" | "tint"> | null;
  size?: number;
  icon?: number;
  radius?: number;
  style?: CSSProperties;
}) {
  const meta = cat ?? FALLBACK;
  const Glyph = I[meta.icon] ?? I.flag;
  return (
    <span className="w-chip" style={{ width: size, height: size, borderRadius: radius, background: meta.tint + "1A", color: meta.tint, ...style }}>
      <Glyph size={icon} />
    </span>
  );
}

export function CatLabel({
  cat,
  size = 24,
  icon = 13,
  gap = 8,
  fontSize = 13,
  text,
}: {
  cat?: Pick<Category, "icon" | "tint" | "label"> | null;
  size?: number;
  icon?: number;
  gap?: number;
  fontSize?: number;
  text?: string;
}) {
  const meta = cat ?? FALLBACK;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, minWidth: 0 }}>
      <CatChip cat={meta} size={size} icon={icon} />
      <span style={{ fontSize, fontWeight: 500, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {text ?? meta.label}
      </span>
    </span>
  );
}
