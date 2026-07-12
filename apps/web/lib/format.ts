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
  // API date fields (e.g. Transaction.date) arrive as full ISO 8601
  // datetimes ("2026-07-02T00:00:00.000Z"), not bare "yyyy-mm-dd" — take
  // just the date portion before splitting.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
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

/**
 * Last calendar day of a "yyyy-mm" month key, as "yyyy-mm-dd". The
 * transactions API's `to` filter is an inclusive `lte`, so range queries
 * for "this month" must pass this rather than the 1st of next month —
 * the latter would also match any transaction dated exactly midnight on
 * the 1st of the following month.
 */
export function monthEndDate(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (
    y === undefined ||
    m === undefined ||
    !Number.isInteger(y) ||
    !Number.isInteger(m)
  ) {
    throw new RangeError(`Invalid month key: ${monthKey}`);
  }
  const d = new Date(y, m, 0); // day 0 of next month = last day of this month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Filters raw amount-input text down to digits and at most one decimal
 * separator (`.` or `,`). Any additional separator is dropped rather than
 * kept — passing the result straight to `parseFloat` after normalizing the
 * separator to `.` (see `parseAmountText`) would otherwise silently stop at
 * the second separator and produce a wildly wrong magnitude (e.g. a pasted
 * "1,234.56" becoming 1.234 via naive single-replace + parseFloat).
 */
export function sanitizeAmountInput(raw: string): string {
  let seenSeparator = false;
  let result = "";
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if ((ch === "." || ch === ",") && !seenSeparator) {
      result += ch;
      seenSeparator = true;
    }
  }
  return result;
}

/** Sanitizes then parses raw amount-input text into a number (0 if empty). */
export function parseAmountText(raw: string): number {
  const sanitized = sanitizeAmountInput(raw).replace(",", ".");
  return parseFloat(sanitized || "0");
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
