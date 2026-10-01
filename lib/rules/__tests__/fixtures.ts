import type { RuleSet } from "../types";

export const source = {
  id: "hikorea-guide",
  title: "HiKorea visa guide",
  authority: "hikorea",
  url: "https://www.hikorea.go.kr/",
  retrievedAt: "2026-09-01",
} as const;

export function makeRuleSet(overrides: Partial<RuleSet> = {}): RuleSet {
  return {
    flowId: "d2-extension",
    version: 1,
    status: "verified",
    effectiveFrom: "2026-01-01",
    verification: { verifiedAt: "2026-09-01", verifiedBy: "reviewer" },
    sources: [{ ...source }],
    fees: [{ id: "extension-fee", label: "Extension fee", amountKrw: 60000, sourceIds: [source.id] }],
    questions: [
      { id: "addressChanged", kind: "boolean", prompt: "Address changed?" },
      {
        id: "funding",
        kind: "choice",
        prompt: "Who funds your studies?",
        options: [
          { value: "self", label: "Self" },
          { value: "scholarship", label: "Scholarship" },
        ],
      },
    ],
    requirements: [
      { id: "passport", koreanName: "여권", englishName: "Passport", kind: "required", note: "", sourceIds: [source.id] },
      {
        id: "address-proof",
        koreanName: "체류지 변경 입증서류",
        englishName: "Address change proof",
        kind: "conditional",
        when: { fact: "addressChanged", equals: true },
        note: "",
        sourceIds: [source.id],
      },
      {
        id: "bank-statement",
        koreanName: "잔고증명서",
        englishName: "Bank statement",
        kind: "conditional",
        when: { not: { fact: "funding", equals: "scholarship" } },
        note: "",
        sourceIds: [source.id],
      },
    ],
    changelog: "test",
    ...overrides,
  };
}
