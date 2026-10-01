import type { RuleSet } from "../types";
import { addressChangeProof, addressChangedQuestion, residenceProof, sharedRequirements } from "./shared";

export const d2ToD10V1: RuleSet = {
  flowId: "d2-to-d10",
  version: 1,
  status: "draft",
  effectiveFrom: "2026-01-01",
  sources: [],
  fees: [],
  questions: [addressChangedQuestion],
  requirements: [
    ...sharedRequirements,
    {
      id: "graduation",
      koreanName: "졸업증명서",
      englishName: "Graduation Certificate",
      kind: "required",
      note: "Confirms graduation status.",
      sourceIds: [],
    },
    {
      id: "job-plan",
      koreanName: "구직활동계획서",
      englishName: "Job-Seeking Activity Plan",
      kind: "required",
      note: "Plan for job-seeking activities.",
      sourceIds: [],
    },
    residenceProof,
    addressChangeProof,
  ],
  changelog: "Initial draft migrated from the demo checklist. Not source-verified.",
};
