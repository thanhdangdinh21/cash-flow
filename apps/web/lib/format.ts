/**
 * Converts an API decimal string (Prisma Decimal fields serialize as strings,
 * e.g. "25.5") to a number for arithmetic — sums, comparisons, chart values.
 */
export const toAmount = (v: string | number): number => Number(v);

export function money(
  n: string | number,
  opts: { sign?: boolean; cents?: boolean } = {},
): string {
  const { sign = false, cents = true } = opts;
  const value = toAmount(n);
  const abs = Math.abs(value);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const prefix = sign ? (value >= 0 ? "+ $" : "− $") : "$";
  return prefix + s;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthName(index: number): string {
  const name = MONTHS[index];
  if (name === undefined) {
    throw new RangeError(`Invalid month index: ${index}`);
  }
  return name;
}

function dayName(index: number): string {
  const name = DAYS[index];
  if (name === undefined) {
    throw new RangeError(`Invalid day index: ${index}`);
  }
  return name;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d)
  ) {
    throw new RangeError(`Invalid ISO date: ${iso}`);
  }
  return new Date(y, m - 1, d);
}

/** "Today · Mar 24" / "Yesterday · Mar 23" / "Fri · Mar 20" */
export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  const md = `${monthName(d.getMonth())} ${d.getDate()}`;
  if (diff === 0) return `Today · ${md}`;
  if (diff === 1) return `Yesterday · ${md}`;
  return `${dayName(d.getDay())} · ${md}`;
}

/** "Mar 24" */
export function shortDate(iso: string): string {
  const d = parseISO(iso);
  return `${monthName(d.getMonth())} ${d.getDate()}`;
}

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fullMonthName(index: number): string {
  const name = FULL_MONTHS[index];
  if (name === undefined) {
    throw new RangeError(`Invalid month index: ${index}`);
  }
  return name;
}

/** "March 2026" for a "yyyy-mm" key */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (
    y === undefined ||
    m === undefined ||
    !Number.isInteger(y) ||
    !Number.isInteger(m)
  ) {
    throw new RangeError(`Invalid month key: ${monthKey}`);
  }
  return `${fullMonthName(m - 1)} ${y}`;
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (
    y === undefined ||
    m === undefined ||
    !Number.isInteger(y) ||
    !Number.isInteger(m)
  ) {
    throw new RangeError(`Invalid month key: ${monthKey}`);
  }
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
