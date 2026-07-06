import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayLabel,
  money,
  monthKeyOf,
  monthLabel,
  parseISO,
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
});

describe("addMonths", () => {
  it("subtracts a month across a year boundary", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("adds a month across a year boundary", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
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
});
