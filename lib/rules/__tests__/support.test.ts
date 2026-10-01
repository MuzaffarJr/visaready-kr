import { describe, expect, it } from "vitest";
import { parseAnswers } from "../answers";
import { evaluateCondition } from "../condition";
import { isIsoDate, seoulDate } from "../dates";
import { makeRuleSet } from "./fixtures";

describe("evaluateCondition", () => {
  it("supports all, any and not", () => {
    const answers = { a: true, b: "x" };
    expect(evaluateCondition({ all: [{ fact: "a", equals: true }, { fact: "b", equals: "x" }] }, answers)).toBe(true);
    expect(evaluateCondition({ any: [{ fact: "a", equals: false }, { fact: "b", equals: "x" }] }, answers)).toBe(true);
    expect(evaluateCondition({ not: { fact: "a", equals: true } }, answers)).toBe(false);
    expect(evaluateCondition({ fact: "missing", equals: true }, answers)).toBe(false);
  });
});

describe("parseAnswers", () => {
  const { questions } = makeRuleSet();
  const from = (record: Record<string, string>) => (key: string) => record[key];

  it("converts declared answers to typed values", () => {
    expect(parseAnswers(questions, from({ addressChanged: "true", funding: "self" }))).toEqual({
      addressChanged: true,
      funding: "self",
    });
  });

  it("drops malformed and undeclared values", () => {
    expect(parseAnswers(questions, from({ addressChanged: "yes", funding: "lottery", other: "1" }))).toEqual({});
  });
});

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("26-2-1")).toBe(false);
  });

  it("uses the Korean calendar day", () => {
    // 15:30 UTC is 00:30 the next day in Seoul.
    expect(seoulDate(new Date("2026-09-30T15:30:00Z"))).toBe("2026-10-01");
  });
});
