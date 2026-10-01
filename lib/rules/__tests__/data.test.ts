import { describe, expect, it } from "vitest";
import { d2ExtensionV2 } from "../data/d2-extension-v2";
import { generateChecklist, selectRuleSet } from "../engine";
import { ruleSets } from "../registry";
import { validateRuleSet } from "../validate";

const NOW = "2026-10-01T00:00:00.000Z";
const ids = (answers: Record<string, string | boolean>) => {
  const result = generateChecklist(d2ExtensionV2, answers, NOW);
  if (!result.ok) throw new Error("expected ok");
  return result.value.items.map((item) => item.requirementId);
};

describe("D-2 extension v2", () => {
  it("is the version preview mode serves from its effective date", () => {
    const selected = selectRuleSet(ruleSets, "d2-extension", "2026-10-01", "preview");
    expect(selected.ok && selected.value.version).toBe(2);
    const before = selectRuleSet(ruleSets, "d2-extension", "2026-09-30", "preview");
    expect(before.ok && before.value.version).toBe(1);
  });

  it("is still unavailable in production until a human verifies it", () => {
    expect(selectRuleSet(ruleSets, "d2-extension", "2026-10-01", "production").ok).toBe(false);
  });

  it("would pass the verified bar once a reviewer signs it off", () => {
    expect(
      validateRuleSet({
        ...d2ExtensionV2,
        status: "verified",
        verification: { verifiedAt: "2026-10-02", verifiedBy: "reviewer" },
      }),
    ).toEqual([]);
  });

  it("asks degree students for enrollment, research students for research proof", () => {
    const degree = ids({ studyType: "degree", thesisStage: false });
    expect(degree).toContain("enrollment");
    expect(degree).not.toContain("research-proof");
    expect(degree).not.toContain("advisor-recommendation");

    const research = ids({ studyType: "research", thesisStage: true });
    expect(research).toContain("research-proof");
    expect(research).not.toContain("enrollment");
    expect(research).toContain("advisor-recommendation");
  });

  it("charges the KRW 60,000 extension fee", () => {
    const result = generateChecklist(d2ExtensionV2, { studyType: "degree", thesisStage: false }, NOW);
    expect(result.ok && result.value.fees.map((fee) => fee.amountKrw)).toEqual([60000]);
  });
});
