import { describe, expect, it } from "vitest";
import { ruleSets } from "../registry";
import { validateRegistry, validateRuleSet } from "../validate";
import { makeRuleSet } from "./fixtures";

const messages = (issues: { message: string }[]) => issues.map((i) => i.message);

describe("validateRuleSet", () => {
  it("accepts a well-formed verified rule set", () => {
    expect(validateRuleSet(makeRuleSet())).toEqual([]);
  });

  it("requires sources and a verification record for verified rule sets", () => {
    const base = makeRuleSet();
    const issues = validateRuleSet({
      ...base,
      verification: undefined,
      requirements: base.requirements.map((r) => ({ ...r, sourceIds: [] })),
    });
    expect(messages(issues)).toContain("verified rule set needs a verification record");
    expect(messages(issues)).toContain("verified rules must cite at least one source");
  });

  it("allows drafts without sources", () => {
    const base = makeRuleSet({ status: "draft", verification: undefined });
    const draft = { ...base, requirements: base.requirements.map((r) => ({ ...r, sourceIds: [] })) };
    expect(validateRuleSet(draft)).toEqual([]);
  });

  it("catches broken references and bad data", () => {
    const base = makeRuleSet();
    const issues = validateRuleSet({
      ...base,
      effectiveFrom: "2026-13-40",
      sources: [{ ...base.sources[0]!, url: "http://insecure.example" }],
      fees: [{ id: "fee", label: "Fee", amountKrw: -1, sourceIds: ["missing"] }],
      requirements: [
        ...base.requirements,
        { id: "passport", koreanName: "", englishName: "", kind: "conditional", note: "", sourceIds: ["hikorea-guide"] },
        {
          id: "ghost",
          koreanName: "",
          englishName: "",
          kind: "conditional",
          when: { fact: "notAQuestion", equals: true },
          note: "",
          sourceIds: ["hikorea-guide"],
        },
      ],
    });
    expect(messages(issues)).toEqual(
      expect.arrayContaining([
        "effectiveFrom must be YYYY-MM-DD",
        "source url must use https",
        "amountKrw must be a non-negative integer",
        'unknown source "missing"',
        "duplicate requirement id",
        "conditional requirement needs a condition",
        'condition reads unknown fact "notAQuestion"',
      ]),
    );
  });
});

describe("validateRegistry", () => {
  it("flags overlapping verified versions and duplicate versions", () => {
    const issues = validateRegistry([
      makeRuleSet({ version: 1 }),
      makeRuleSet({ version: 2, effectiveFrom: "2026-06-01" }),
      makeRuleSet({ version: 2, status: "draft" }),
    ]);
    expect(messages(issues)).toEqual(
      expect.arrayContaining(["effective window overlaps v1", "duplicate version"]),
    );
  });

  it("accepts back-to-back verified versions", () => {
    expect(
      validateRegistry([
        makeRuleSet({ version: 1, effectiveTo: "2026-06-01" }),
        makeRuleSet({ version: 2, effectiveFrom: "2026-06-01" }),
      ]),
    ).toEqual([]);
  });

  it("the shipped rule data is valid", () => {
    expect(validateRegistry(ruleSets)).toEqual([]);
  });
});
