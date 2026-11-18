import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { owedLine } from "./net-worth";

const t = ((key: string, opts: { amount: string }) =>
  `${key}=${opts.amount}`) as unknown as TFunction;

describe("owedLine", () => {
  it("is null when nothing is owed either way", () => {
    expect(owedLine({ owedToYou: 0, youOwe: 0 }, t)).toBeNull();
  });

  it("lists only the non-zero sides", () => {
    expect(owedLine({ owedToYou: 200, youOwe: 0 }, t)).toBe("netWorth.owedToYou=$200.00");
    expect(owedLine({ owedToYou: 0, youOwe: 75.5 }, t)).toBe("netWorth.youOwe=$75.50");
  });

  it("joins both sides with a middle dot", () => {
    expect(owedLine({ owedToYou: 150, youOwe: 50 }, t)).toBe(
      "netWorth.owedToYou=$150.00 · netWorth.youOwe=$50.00",
    );
  });
});
