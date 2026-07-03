import type { AppState, Account, Category, Transaction } from "./types";

/* The demo dataset is anchored to the design's date so labels like
   "Today · Mar 24" and the March aggregates match the mockups. */
export const DEMO_TODAY = "2026-03-24";
export const DEMO_MONTH = "2026-03";
export const DEMO_MONTH_LABEL = "March 2026";

const ACCOUNTS: Account[] = [
  { id: "cash", name: "Cash wallet", type: "Asset", currency: "USD", balance: 240.5, seeded: true, icon: "wallet" },
  { id: "checking", name: "Everyday", type: "Asset", currency: "USD", balance: 3204.18, sub: "Checking ·· 4821", icon: "wallet" },
  { id: "savings", name: "Rainy day", type: "Asset", currency: "USD", balance: 5180.4, sub: "Savings ·· 0093", icon: "wallet" },
  { id: "travel", name: "Travel fund", type: "Asset", currency: "USD", balance: 1616.32, sub: "Savings ·· 7732", icon: "wallet" },
  {
    id: "gold", name: "Gold", type: "Asset", currency: "USD", balance: 2148.6,
    commodity: true, unit: "gram", qty: 28.4, avgCost: 75.66, icon: "target",
    lots: [
      { date: "Feb 12", qty: 10.0, unit: 73.2, total: 732.0 },
      { date: "Mar 03", qty: 12.4, unit: 76.1, total: 943.64 },
      { date: "Mar 18", qty: 6.0, unit: 78.83, total: 472.96 },
    ],
  },
  {
    id: "visa", name: "Visa credit", type: "Liability", currency: "USD", balance: -890.2, sub: "Credit ·· 5512", icon: "card",
    credit: { limit: 5000, apr: 19.99, statementDay: "25th of the month", dueDay: "15th of the month", minPayment: 35, remind: true },
  },
  { id: "geninc", name: "General income", type: "Income", currency: "USD", balance: 4960.0, seeded: true, icon: "trendUp" },
  { id: "genexp", name: "General expense", type: "Expense", currency: "USD", balance: 2440.0, seeded: true, icon: "receipt" },
];

/* Single table; hierarchy via parentId. */
const CATEGORIES: Category[] = [
  { id: "dining", label: "Dining", icon: "coffee", tint: "#BE4A30", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "dining-coffee", label: "Coffee", icon: "coffee", tint: "#BE4A30", type: "Expense", parentId: "dining", accountId: "genexp" },
  { id: "dining-rest", label: "Restaurants", icon: "receipt", tint: "#BE4A30", type: "Expense", parentId: "dining", accountId: "genexp" },
  { id: "dining-take", label: "Takeout", icon: "gift", tint: "#BE4A30", type: "Expense", parentId: "dining", accountId: "genexp" },
  { id: "fun", label: "Fun", icon: "film", tint: "#7A4FB0", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "fun-movies", label: "Movies", icon: "film", tint: "#7A4FB0", type: "Expense", parentId: "fun", accountId: "genexp" },
  { id: "fun-subs", label: "Subscriptions", icon: "repeat", tint: "#7A4FB0", type: "Expense", parentId: "fun", accountId: "genexp" },
  { id: "groceries", label: "Groceries", icon: "cart", tint: "#1A7A50", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "groc-super", label: "Supermarket", icon: "cart", tint: "#1A7A50", type: "Expense", parentId: "groceries", accountId: "genexp" },
  { id: "groc-farm", label: "Farmers market", icon: "gift", tint: "#1A7A50", type: "Expense", parentId: "groceries", accountId: "genexp" },
  { id: "rent", label: "Housing", icon: "home2", tint: "#2C5E8A", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "rent-rent", label: "Rent", icon: "home2", tint: "#2C5E8A", type: "Expense", parentId: "rent", accountId: "genexp" },
  { id: "rent-ins", label: "Insurance", icon: "fileText", tint: "#2C5E8A", type: "Expense", parentId: "rent", accountId: "genexp" },
  { id: "transport", label: "Transport", icon: "car", tint: "#B07A1E", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "trans-ride", label: "Rideshare", icon: "car", tint: "#B07A1E", type: "Expense", parentId: "transport", accountId: "genexp" },
  { id: "trans-transit", label: "Transit", icon: "swap", tint: "#B07A1E", type: "Expense", parentId: "transport", accountId: "genexp" },
  { id: "trans-fuel", label: "Fuel", icon: "zap", tint: "#B07A1E", type: "Expense", parentId: "transport", accountId: "genexp" },
  { id: "utilities", label: "Utilities", icon: "zap", tint: "#3A7A6E", type: "Expense", parentId: null, accountId: "genexp" },
  { id: "income", label: "Income", icon: "trendUp", tint: "#1A7A50", type: "Income", parentId: null, accountId: "geninc" },
  { id: "income-salary", label: "Salary", icon: "wallet", tint: "#1A7A50", type: "Income", parentId: "income", accountId: "geninc" },
  { id: "income-free", label: "Freelance", icon: "handCoins", tint: "#1A7A50", type: "Income", parentId: "income", accountId: "geninc" },
];

/* March transactions sum exactly to the design's aggregates:
   groceries 480 · dining 286 · housing 1,250 · transport 192 ·
   utilities 132 · fun 100 (spent 2,440) · income 4,960. */
const TXNS: Transaction[] = [
  // Today · Mar 24
  { id: 1, type: "expense", merchant: "Whole Foods Market", categoryId: "groc-super", amount: -84.2, date: "2026-03-24", time: "2:14 PM", accountId: "checking", attach: "receipt.jpg" },
  { id: 2, type: "expense", merchant: "Blue Bottle Coffee", categoryId: "dining-coffee", amount: -6.75, date: "2026-03-24", time: "8:41 AM", accountId: "checking" },
  // Yesterday · Mar 23
  { id: 3, type: "income", merchant: "Acme Payroll", categoryId: "income-salary", amount: 2480.0, date: "2026-03-23", time: "9:00 AM", accountId: "checking" },
  { id: 4, type: "expense", merchant: "Lyft", categoryId: "trans-ride", amount: -18.4, date: "2026-03-23", time: "7:22 PM", accountId: "checking" },
  { id: 5, type: "expense", merchant: "Trader Joe's", categoryId: "groc-super", amount: -52.06, date: "2026-03-23", time: "5:03 PM", accountId: "checking", attach: "receipt.jpg" },
  // Sat · Mar 21
  { id: 6, type: "debt", merchant: "Lent to Sam Ortiz", contactName: "Sam Ortiz", debtDir: "lent", amount: -45.0, date: "2026-03-21", time: "9:12 PM", accountId: "checking", note: "Dinner split", interest: "None" },
  // Fri · Mar 20
  { id: 7, type: "expense", merchant: "Hillside Apartments", categoryId: "rent-rent", amount: -1250.0, date: "2026-03-20", time: "8:00 AM", accountId: "checking", note: "April rent", recurring: true },
  { id: 8, type: "expense", merchant: "Metro card top-up", categoryId: "trans-transit", amount: -44.0, date: "2026-03-20", time: "7:31 AM", accountId: "cash" },
  // Wed · Mar 18
  { id: 9, type: "expense", merchant: "Nopa", categoryId: "dining-rest", amount: -86.4, date: "2026-03-18", time: "8:34 PM", accountId: "visa" },
  { id: 10, type: "transfer", merchant: "Gold purchase · 6 g", amount: -472.96, date: "2026-03-18", time: "10:05 AM", accountId: "checking", toAccountId: "gold" },
  // Mon · Mar 16
  { id: 11, type: "expense", merchant: "AMC Metreon", categoryId: "fun-movies", amount: -32.0, date: "2026-03-16", time: "7:45 PM", accountId: "visa" },
  // Sun · Mar 15
  { id: 12, type: "expense", merchant: "Whole Foods Market", categoryId: "groc-super", amount: -118.34, date: "2026-03-15", time: "11:20 AM", accountId: "checking" },
  // Thu · Mar 12
  { id: 13, type: "expense", merchant: "Basil Thai takeout", categoryId: "dining-take", amount: -48.65, date: "2026-03-12", time: "7:02 PM", accountId: "checking" },
  // Wed · Mar 11
  { id: 14, type: "expense", merchant: "Shell", categoryId: "trans-fuel", amount: -71.2, date: "2026-03-11", time: "5:48 PM", accountId: "visa" },
  // Tue · Mar 10
  { id: 15, type: "expense", merchant: "PG&E", categoryId: "utilities", amount: -88.0, date: "2026-03-10", time: "6:00 AM", accountId: "checking", recurring: true },
  { id: 16, type: "expense", merchant: "Comcast", categoryId: "utilities", amount: -44.0, date: "2026-03-10", time: "6:00 AM", accountId: "checking", recurring: true },
  // Mon · Mar 09
  { id: 17, type: "income", merchant: "Acme Payroll", categoryId: "income-salary", amount: 2480.0, date: "2026-03-09", time: "9:00 AM", accountId: "checking" },
  // Sun · Mar 08
  { id: 18, type: "expense", merchant: "Ferry Plaza farmers market", categoryId: "groc-farm", amount: -47.9, date: "2026-03-08", time: "10:15 AM", accountId: "cash" },
  // Fri · Mar 06
  { id: 19, type: "expense", merchant: "Souvla", categoryId: "dining-rest", amount: -110.0, date: "2026-03-06", time: "8:12 PM", accountId: "visa" },
  // Wed · Mar 04
  { id: 20, type: "expense", merchant: "Lyft", categoryId: "trans-ride", amount: -58.4, date: "2026-03-04", time: "11:38 PM", accountId: "checking" },
  // Tue · Mar 03
  { id: 21, type: "expense", merchant: "Blue Bottle Coffee", categoryId: "dining-coffee", amount: -34.2, date: "2026-03-03", time: "8:40 AM", accountId: "checking" },
  // Mon · Mar 02
  { id: 22, type: "expense", merchant: "Costco", categoryId: "groc-super", amount: -177.5, date: "2026-03-02", time: "4:26 PM", accountId: "checking" },
  { id: 23, type: "debt", merchant: "Borrowed from Ana Sousa", contactName: "Ana Sousa", debtDir: "borrowed", amount: 150.0, date: "2026-03-02", time: "12:30 PM", accountId: "checking", note: "Borrowed for deposit", interest: "None" },
  // Sun · Mar 01
  { id: 24, type: "expense", merchant: "Netflix & Spotify", categoryId: "fun-subs", amount: -68.0, date: "2026-03-01", time: "3:00 AM", accountId: "visa", recurring: true },
  // February — prior month history
  { id: 25, type: "debt", merchant: "Lent to Daniel Chen", contactName: "Daniel Chen", debtDir: "lent", amount: -320.0, date: "2026-02-18", time: "6:10 PM", accountId: "checking", note: "Lent for flights", interest: "2% · yearly" },
  { id: 26, type: "transfer", merchant: "Gold purchase · 10 g", amount: -732.0, date: "2026-02-12", time: "9:30 AM", accountId: "savings", toAccountId: "gold" },
];

export function makeSeedState(): AppState {
  return {
    accounts: structuredClone(ACCOUNTS),
    categories: structuredClone(CATEGORIES),
    transactions: structuredClone(TXNS),
    budgets: [
      { categoryId: "groceries", limit: 500 },
      { categoryId: "dining", limit: 250 },
      { categoryId: "fun", limit: 200 },
    ],
    members: [
      { id: "m1", name: "Maya Chen", role: "Owner", you: true },
      { id: "m2", name: "Daniel Chen", role: "Editor" },
      { id: "m3", name: "Priya Patel", role: "Viewer" },
    ],
    contacts: [
      { id: "c1", name: "Daniel Chen", note: "Lent for flights · Feb 18" },
      { id: "c2", name: "Ana Sousa", note: "Borrowed for deposit · Mar 02" },
      { id: "c3", name: "Sam Ortiz", note: "Dinner split · Mar 21" },
    ],
    netWorthHistory: [
      { m: "Oct", v: 7720 },
      { m: "Nov", v: 8160 },
      { m: "Dec", v: 8040 },
      { m: "Jan", v: 8690 },
      { m: "Feb", v: 9420 },
    ],
    settings: { theme: "light", density: "comfortable", kbdHints: true, sidebar: "paper" },
    nextTxnId: 100,
  };
}

/* Dining spend, six months back — powers the category-trend report.
   March is derived live from transactions. */
export const TREND_DINING_HISTORY = [
  { m: "Oct", v: 210 },
  { m: "Nov", v: 245 },
  { m: "Dec", v: 330 },
  { m: "Jan", v: 250 },
  { m: "Feb", v: 262 },
];

export const CURRENCIES = [
  { code: "USD", name: "US dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Pound sterling", symbol: "£" },
  { code: "JPY", name: "Japanese yen", symbol: "¥" },
  { code: "VND", name: "Vietnamese dong", symbol: "₫" },
];

export const ROLES: ReadonlyArray<"Owner" | "Admin" | "Editor" | "Viewer"> = ["Owner", "Admin", "Editor", "Viewer"];
