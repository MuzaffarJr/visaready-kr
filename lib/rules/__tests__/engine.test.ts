import { describe, expect, it } from "vitest";
import { compareWithLatest, generateChecklist, selectRuleSet } from "../engine";
import { makeRuleSet } from "./fixtures";

const NOW = "2026-10-01T00:00:00.000Z";
const answers = { addressChanged: false, funding: "self" };

describe("selectRuleSet", () => {
  it("production picks the highest verified, effective version", () => {
    const v1 = makeRuleSet({ version: 1, effectiveTo: "2026-06-01" });
    const v2 = makeRuleSet({ version: 2, effectiveFrom: "2026-06-01" });
    const result = selectRuleSet([v1, v2], "d2-extension", "2026-10-01", "production");
    expect(result.ok && result.value.version).toBe(2);
  });

  it("production respects effective windows for past dates", () => {
    const v1 = makeRuleSet({ version: 1, effectiveTo: "2026-06-01" });
    const v2 = makeRuleSet({ version: 2, effectiveFrom: "2026-06-01" });
    const result = selectRuleSet([v1, v2], "d2-extension", "2026-03-15", "production");
    expect(result.ok && result.value.version).toBe(1);
  });

  it("production never returns a draft, even if it is newer", () => {
    const draft = makeRuleSet({ version: 1, status: "draft" });
    const result = selectRuleSet([draft], "d2-extension", "2026-10-01", "production");
    expect(result).toEqual({
      ok: false,
      error: { code: "no-ruleset", flowId: "d2-extension", on: "2026-10-01", mode: "production" },
    });
  });

  it("production ignores rule sets that are not yet effective", () => {
    const future = makeRuleSet({ effectiveFrom: "2027-01-01" });
    expect(selectRuleSet([future], "d2-extension", "2026-10-01", "production").ok).toBe(false);
  });

  it("preview accepts drafts but prefers a verified version", () => {
    const verified = makeRuleSet({ version: 1 });
    const draft = makeRuleSet({ version: 2, status: "draft" });
    const result = selectRuleSet([verified, draft], "d2-extension", "2026-10-01", "preview");
    expect(result.ok && result.value.version).toBe(1);
    const onlyDraft = selectRuleSet([draft], "d2-extension", "2026-10-01", "preview");
    expect(onlyDraft.ok && onlyDraft.value.status).toBe("draft");
  });

  it("never selects deprecated versions", () => {
    const deprecated = makeRuleSet({ status: "deprecated" });
    expect(selectRuleSet([deprecated], "d2-extension", "2026-10-01", "preview").ok).toBe(false);
  });
});

describe("generateChecklist", () => {
  it("includes required items and evaluates conditions", () => {
    const result = generateChecklist(makeRuleSet(), answers, NOW);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.items.map((i) => i.requirementId)).toEqual(["passport", "bank-statement"]);

    const changed = generateChecklist(makeRuleSet(), { addressChanged: true, funding: "scholarship" }, NOW);
    if (!changed.ok) throw new Error("expected ok");
    expect(changed.value.items.map((i) => i.requirementId)).toEqual(["passport", "address-proof"]);
  });

  it("pins the rule set version and resolves sources and fees", () => {
    const result = generateChecklist(makeRuleSet({ version: 7 }), answers, NOW);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.ruleSetVersion).toBe(7);
    expect(result.value.provisional).toBe(false);
    expect(result.value.items[0]?.sources[0]?.url).toBe("https://www.hikorea.go.kr/");
    expect(result.value.fees).toEqual([
      expect.objectContaining({ id: "extension-fee", amountKrw: 60000 }),
    ]);
  });

  it("marks draft output as provisional", () => {
    const result = generateChecklist(makeRuleSet({ status: "draft" }), answers, NOW);
    expect(result.ok && result.value.provisional).toBe(true);
  });

  it("rejects missing, unknown and mistyped answers", () => {
    const result = generateChecklist(
      makeRuleSet(),
      { addressChanged: "yes", extra: true },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.issues).toEqual([
      { questionId: "addressChanged", message: "expected yes or no" },
      { questionId: "funding", message: "missing answer" },
      { questionId: "extra", message: "unknown question" },
    ]);
  });

  it("is deterministic", () => {
    const a = generateChecklist(makeRuleSet(), answers, NOW);
    const b = generateChecklist(makeRuleSet(), answers, NOW);
    expect(a).toEqual(b);
  });
});

describe("compareWithLatest", () => {
  const original = generateChecklist(makeRuleSet(), answers, NOW);
  if (!original.ok) throw new Error("fixture invalid");
  const snapshot = original.value;

  it("reports current when the version is unchanged", () => {
    expect(compareWithLatest(snapshot, makeRuleSet())).toEqual({ status: "current" });
  });

  it("reports added and removed items without mutating the snapshot", () => {
    const before = structuredClone(snapshot);
    const v2 = makeRuleSet({
      version: 2,
      requirements: [
        ...makeRuleSet().requirements.filter((r) => r.id !== "bank-statement"),
        { id: "tb-test", koreanName: "결핵 진단서", englishName: "TB test", kind: "required", note: "", sourceIds: ["hikorea-guide"] },
      ],
    });
    expect(compareWithLatest(snapshot, v2)).toEqual({
      status: "outdated",
      latestVersion: 2,
      added: ["tb-test"],
      removed: ["bank-statement"],
      unansweredQuestions: [],
    });
    expect(snapshot).toEqual(before);
  });

  it("asks for new answers instead of guessing a diff", () => {
    const v2 = makeRuleSet({
      version: 2,
      questions: [...makeRuleSet().questions, { id: "hasJobOffer", kind: "boolean", prompt: "?" }],
    });
    const drift = compareWithLatest(snapshot, v2);
    expect(drift).toMatchObject({ status: "outdated", unansweredQuestions: ["hasJobOffer"], added: [], removed: [] });
  });
});
