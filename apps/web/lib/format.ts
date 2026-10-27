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

// Date labels follow the UI language (i18next `i18n.language`: "en" | "vi").
// Callers pass that code; Intl does the month/weekday/"today" wording.
const INTL_LOCALES: Record<string, string> = { en: "en-US", vi: "vi-VN" };

function intlLocale(lang: string): string {
  return INTL_LOCALES[lang] ?? "en-US";
}

function capitalize(s: string, locale: string): string {
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

// The reports API labels chart points with fixed English abbreviations.
const API_MONTH_ABBRS = [
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

/** "Mar 24" (en) / "24 thg 3" (vi) */
export function shortDate(iso: string, lang = "en"): string {
  const d = parseISO(iso);
  return new Intl.DateTimeFormat(intlLocale(lang), { month: "short", day: "numeric" }).format(d);
}

/** "Today · Mar 24" / "Yesterday · Mar 23" / "Fri · Mar 20", localized */
export function dayLabel(iso: string, lang = "en"): string {
  const locale = intlLocale(lang);
  const d = parseISO(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  const md = shortDate(iso, lang);
  if (diff === 0 || diff === 1) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diff, "day");
    return `${capitalize(relative, locale)} · ${md}`;
  }
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
  return `${weekday} · ${md}`;
}

/** "March 2026" for a "yyyy-mm" key, localized */
export function monthLabel(monthKey: string, lang = "en"): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (
    y === undefined ||
    m === undefined ||
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    m < 1 ||
    m > 12
  ) {
    throw new RangeError(`Invalid month key: ${monthKey}`);
  }
  const locale = intlLocale(lang);
  const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
  return capitalize(label, locale);
}

/**
 * Localizes a reports-API month abbreviation ("Jan".."Dec") for chart axes
 * and tooltips. Unknown labels (e.g. weekly day-of-month buckets) pass through.
 */
export function chartMonthLabel(apiLabel: string, lang = "en"): string {
  const index = API_MONTH_ABBRS.indexOf(apiLabel);
  if (index === -1) return apiLabel;
  return new Intl.DateTimeFormat(intlLocale(lang), { month: "short" }).format(
    new Date(2000, index, 1),
  );
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
