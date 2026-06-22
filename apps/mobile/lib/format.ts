import { CURRENCIES } from '@repo/shared/currencies';

const symbolByCode = new Map(CURRENCIES.map((c) => [c.code, c.symbol]));

export function currencySymbol(code?: string): string {
  return symbolByCode.get(code ?? 'USD') ?? '$';
}

export interface MoneyOptions {
  sign?: boolean; // prefix + / − by the value's sign
  cents?: boolean; // show 2 decimals (default true)
  currency?: string; // ISO code, defaults to USD
}

// Port of the design's money() helper: "− $84.20", "+ $2,480"
export function money(value: number | string, opts: MoneyOptions = {}): string {
  const n = typeof value === 'string' ? parseFloat(value || '0') : value;
  const { sign = false, cents = true, currency } = opts;
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const symbol = currencySymbol(currency);
  const prefix = sign ? (n >= 0 ? `+ ${symbol}` : `− ${symbol}`) : symbol;
  return prefix + s;
}

export function num(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'string' ? parseFloat(value || '0') : value;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Mon · Mar 24" — the home screen's date eyebrow
export function eyebrowDate(d: Date = new Date()): string {
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// "Today · Mar 24" / "Yesterday · Mar 23" / "Fri · Mar 20" — activity day groups
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  const md = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (diffDays === 0) return `Today · ${md}`;
  if (diffDays === 1) return `Yesterday · ${md}`;
  return `${DAYS[d.getDay()]} · ${md}`;
}

// "Today · Mar 24" for form fields (falls through to "Mar 24, 2026")
export function fieldDate(d: Date): string {
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const md = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (sameDay) return `Today · ${md}`;
  return d.getFullYear() === today.getFullYear() ? md : `${md}, ${d.getFullYear()}`;
}

// "March 2026" — activity header eyebrow
export function monthYear(d: Date = new Date()): string {
  const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${FULL[d.getMonth()]} ${d.getFullYear()}`;
}
