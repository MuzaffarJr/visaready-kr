import type { RuleSet } from "../types";
import { addressChangeProof, addressChangedQuestion, residenceProof, sharedRequirements } from "./shared";

export const d10ExtensionV1: RuleSet = {
  flowId: "d10-extension",
  version: 1,
  status: "draft",
  effectiveFrom: "2026-01-01",
  sources: [],
  fees: [],
  questions: [addressChangedQuestion],
  requirements: [
    ...sharedRequirements,
    {
      id: "job-activity",
      koreanName: "구직활동 증빙서류",
      englishName: "Job-Seeking Activity Evidence",
      kind: "required",
      note: "Evidence of job-seeking activity.",
      sourceIds: [],
    },
    residenceProof,
    addressChangeProof,
  ],
  changelog: "Initial draft migrated from the demo checklist. Not source-verified.",
};
