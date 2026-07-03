import { DEMO_TODAY } from "./seed";

export function money(n: number, opts: { sign?: boolean; cents?: boolean } = {}): string {
  const { sign = false, cents = true } = opts;
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const prefix = sign ? (n >= 0 ? "+ $" : "− $") : "$";
  return prefix + s;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Today · Mar 24" / "Yesterday · Mar 23" / "Fri · Mar 20" */
export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  const today = parseISO(DEMO_TODAY);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  const md = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (diff === 0) return `Today · ${md}`;
  if (diff === 1) return `Yesterday · ${md}`;
  return `${DAYS[d.getDay()]} · ${md}`;
}

/** "Mar 24" */
export function shortDate(iso: string): string {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "March 2026" for a "yyyy-mm" key */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${FULL_MONTHS[m - 1]} ${y}`;
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nowTimeLabel(): string {
  const d = new Date();
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}
