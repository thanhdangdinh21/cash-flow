import { describe, expect, it } from "vitest";
import {
  addMonths,
  chartMonthLabel,
  dayLabel,
  money,
  monthEndDate,
  monthKeyOf,
  monthLabel,
  parseAmountText,
  parseISO,
  sanitizeAmountInput,
  shortDate,
  toAmount,
} from "./format";

function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("money", () => {
  it("formats a positive amount with cents", () => {
    expect(money(1234.5)).toBe("$1,234.50");
  });

  it("formats a negative amount with a sign using U+2212 minus", () => {
    expect(money(-20, { sign: true })).toBe("− $20.00");
  });

  it("formats a positive amount with a sign", () => {
    expect(money(20, { sign: true })).toBe("+ $20.00");
  });

  it("formats without cents when cents: false", () => {
    expect(money(1234.5, { cents: false })).toBe("$1,235");
  });

  it("accepts an API decimal string", () => {
    expect(money("1234.5")).toBe("$1,234.50");
  });

  it("accepts a negative decimal string with a sign", () => {
    expect(money("-20", { sign: true })).toBe("− $20.00");
  });
});

describe("toAmount", () => {
  it("converts an API decimal string to a number", () => {
    expect(toAmount("25.5")).toBe(25.5);
  });
});

describe("dayLabel", () => {
  const now = new Date();

  function daysAgo(days: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }

  it("labels today's date as Today", () => {
    expect(dayLabel(isoOf(now))).toMatch(/^Today · /);
  });

  it("labels yesterday's date as Yesterday", () => {
    expect(dayLabel(isoOf(daysAgo(1)))).toMatch(/^Yesterday · /);
  });

  it("labels a date 5 days ago with its weekday abbreviation", () => {
    expect(dayLabel(isoOf(daysAgo(5)))).toMatch(
      /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) · /,
    );
  });

  it("accepts a full ISO 8601 datetime string (API Transaction.date shape)", () => {
    expect(dayLabel(`${isoOf(now)}T00:00:00.000Z`)).toMatch(/^Today · /);
  });

  it("localizes Today / Yesterday for Vietnamese", () => {
    expect(dayLabel(isoOf(now), "vi")).toMatch(/^Hôm nay · /);
    expect(dayLabel(isoOf(daysAgo(1)), "vi")).toMatch(/^Hôm qua · /);
  });
});

describe("input validation", () => {
  it("parseISO rejects non-numeric segments", () => {
    expect(() => parseISO("a-b-c")).toThrow(RangeError);
  });

  it("parseISO rejects a missing day segment", () => {
    expect(() => parseISO("2026-07")).toThrow(RangeError);
  });

  it("monthLabel rejects a garbage key", () => {
    expect(() => monthLabel("garbage")).toThrow(RangeError);
  });

  it("addMonths rejects a garbage key", () => {
    expect(() => addMonths("garbage", 1)).toThrow(RangeError);
  });
});

describe("monthLabel", () => {
  it("formats a yyyy-mm key as a full month name and year", () => {
    expect(monthLabel("2026-07")).toBe("July 2026");
  });

  it("localizes the month name for Vietnamese", () => {
    expect(monthLabel("2026-07", "vi")).toBe("Tháng 7 năm 2026");
  });

  it("rejects an out-of-range month", () => {
    expect(() => monthLabel("2026-13")).toThrow(RangeError);
  });
});

describe("addMonths", () => {
  it("subtracts a month across a year boundary", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("adds a month across a year boundary", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });
});

describe("sanitizeAmountInput", () => {
  it("strips non-numeric characters", () => {
    expect(sanitizeAmountInput("abc12.50xyz")).toBe("12.50");
  });

  it("keeps a single decimal point", () => {
    expect(sanitizeAmountInput("12.50")).toBe("12.50");
  });

  it("keeps a single decimal comma", () => {
    expect(sanitizeAmountInput("12,50")).toBe("12,50");
  });

  it("drops a second separator instead of silently truncating the value", () => {
    // A pasted thousands-formatted amount ("1,234.56") must not silently
    // become 1.234 (parseFloat stopping at the second separator) — the
    // extra separator is dropped and its surrounding digits kept in place.
    expect(sanitizeAmountInput("1,234.56")).toBe("1,23456");
  });

  it("drops a repeated decimal point", () => {
    expect(sanitizeAmountInput("12..50")).toBe("12.50");
  });

  it("returns an empty string unchanged", () => {
    expect(sanitizeAmountInput("")).toBe("");
  });
});

describe("parseAmountText", () => {
  it("parses a plain decimal amount", () => {
    expect(parseAmountText("12.50")).toBe(12.5);
  });

  it("parses a comma-decimal amount", () => {
    expect(parseAmountText("12,50")).toBe(12.5);
  });

  it("never silently truncates a multi-separator paste to the wrong magnitude", () => {
    // Must not equal 1.234 (the old bug) — the exact interpretation of a
    // thousands-formatted paste is out of scope, but it must stay in the
    // same order of magnitude as the digits entered.
    expect(parseAmountText("1,234.56")).not.toBe(1.234);
    expect(parseAmountText("1,234.56")).toBeCloseTo(1.23456);
  });

  it("returns 0 for an empty string", () => {
    expect(parseAmountText("")).toBe(0);
  });
});

describe("monthEndDate", () => {
  it("returns the last day of a 30-day month", () => {
    expect(monthEndDate("2026-06")).toBe("2026-06-30");
  });

  it("returns the last day of a 31-day month", () => {
    expect(monthEndDate("2026-12")).toBe("2026-12-31");
  });

  it("returns Feb 28 in a non-leap year", () => {
    expect(monthEndDate("2026-02")).toBe("2026-02-28");
  });

  it("returns Feb 29 in a leap year", () => {
    expect(monthEndDate("2024-02")).toBe("2024-02-29");
  });

  it("rejects a garbage key", () => {
    expect(() => monthEndDate("garbage")).toThrow(RangeError);
  });
});

describe("monthKeyOf", () => {
  it("extracts the yyyy-mm key from an ISO date", () => {
    expect(monthKeyOf("2026-07-03")).toBe("2026-07");
  });
});

describe("shortDate", () => {
  it("formats an ISO date as an abbreviated month and day", () => {
    expect(shortDate("2026-03-24")).toBe("Mar 24");
  });

  it("localizes for Vietnamese", () => {
    expect(shortDate("2026-03-24", "vi")).toBe("24 thg 3");
  });
});

describe("chartMonthLabel", () => {
  it("keeps the API's English abbreviation in English", () => {
    expect(chartMonthLabel("Oct")).toBe("Oct");
  });

  it("localizes the API's month abbreviation for Vietnamese", () => {
    expect(chartMonthLabel("Oct", "vi")).toBe("Tháng 10");
  });

  it("passes through non-month labels such as weekly day buckets", () => {
    expect(chartMonthLabel("26", "vi")).toBe("26");
  });
});
