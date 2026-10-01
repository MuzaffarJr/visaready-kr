import type { RuleSet } from "../types";
import { addressChangeProof, addressChangedQuestion, residenceProof, sharedRequirements } from "./shared";

export const d2ExtensionV1: RuleSet = {
  flowId: "d2-extension",
  version: 1,
  status: "draft",
  effectiveFrom: "2026-01-01",
  sources: [],
  fees: [],
  questions: [addressChangedQuestion],
  requirements: [
    ...sharedRequirements,
    {
      id: "enrollment",
      koreanName: "재학증명서",
      englishName: "Certificate of Enrollment",
      kind: "required",
      note: "Confirms current enrollment.",
      sourceIds: [],
    },
    {
      id: "transcript",
      koreanName: "성적증명서",
      englishName: "Academic Transcript",
      kind: "required",
      note: "Academic record.",
      sourceIds: [],
    },
    residenceProof,
    addressChangeProof,
  ],
  changelog: "Initial draft migrated from the demo checklist. Not source-verified.",
};
