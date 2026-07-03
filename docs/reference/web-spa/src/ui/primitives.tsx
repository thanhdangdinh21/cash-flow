/* React ports of the Money Flow design-system primitives (mf-* classes). */
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { I } from "./icons";

/* ── Button ─────────────────────────────────────────────── */
export function Button({
  variant = "secondary",
  size = "md",
  block,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}) {
  return (
    <button
      type="button"
      className={`mf-btn mf-btn--${size} mf-btn--${variant}${block ? " mf-btn--block" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  size = "md",
  variant,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`mf-icon-btn mf-icon-btn--${size}${variant ? ` mf-icon-btn--${variant}` : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Badge / Tag ────────────────────────────────────────── */
export function Badge({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: "neutral" | "positive" | "negative" | "warning" | "info" | "solid" | "outline";
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`mf-badge mf-badge--${tone}`}>
      {dot && <span className="mf-badge__dot" />}
      {children}
    </span>
  );
}

export function Tag({
  selected,
  onClick,
  children,
  style,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const cls = `mf-tag${selected ? " mf-tag--selected" : ""}`;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} style={{ cursor: "pointer", ...style }}>
        {children}
      </button>
    );
  }
  return <span className={cls} style={style}>{children}</span>;
}

/* ── Input / Select ─────────────────────────────────────── */
export function Input({
  label,
  hint,
  error,
  prefix,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: boolean; prefix?: string }) {
  const input = (
    <input className={`mf-input${error ? " mf-input--error" : ""}${prefix ? " mf-input--with-prefix" : ""} ${className}`.trim()} {...rest} />
  );
  const wrapped = prefix ? (
    <span className="mf-input-wrap">
      <span className="mf-input-wrap__prefix">{prefix}</span>
      {input}
    </span>
  ) : input;
  if (!label && !hint) return wrapped;
  return (
    <label className="mf-field">
      {label && <span className="mf-field__label">{label}</span>}
      {wrapped}
      {hint && <span className={`mf-field__hint${error ? " mf-field__hint--error" : ""}`}>{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  className = "",
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] | string[] }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const select = (
    <span className="mf-select-wrap">
      <select className={`mf-input mf-select ${className}`.trim()} {...rest}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="mf-select-wrap__chevron"><I.chevD size={16} /></span>
    </span>
  );
  if (!label) return select;
  return (
    <label className="mf-field">
      <span className="mf-field__label">{label}</span>
      {select}
    </label>
  );
}

/* ── Switch ─────────────────────────────────────────────── */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="mf-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="mf-switch__track"><span className="mf-switch__thumb" /></span>
    </label>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
  return <span className={`mf-avatar mf-avatar--${size}`}>{initials}</span>;
}

/* ── ProgressBar ────────────────────────────────────────── */
export function ProgressBar({ value, max, tone }: { value: number; max: number; tone?: "positive" | "warning" | "negative" }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <div className={`mf-progress${tone ? ` mf-progress--${tone}` : ""}`}>
      <div className="mf-progress__track">
        <div className="mf-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
