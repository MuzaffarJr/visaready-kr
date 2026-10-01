import type { Question, RequirementRule } from "../types";

// Draft content carried over from the first vertical slice. Nothing here is
// verified against an official source yet, so every rule set using it stays
// in `draft` status and the UI labels the checklist as provisional.

export const addressChangedQuestion: Question = {
  id: "addressChanged",
  kind: "boolean",
  prompt: "Has your registered address changed?",
  help: "This answer can affect which proof-of-residence documents appear in your checklist.",
};

export const sharedRequirements: RequirementRule[] = [
  {
    id: "passport",
    koreanName: "여권",
    englishName: "Passport",
    kind: "required",
    note: "Identity document.",
    sourceIds: [],
  },
  {
    id: "residence-card",
    koreanName: "외국인등록증",
    englishName: "Residence Card",
    kind: "required",
    note: "Current Korean residence card.",
    sourceIds: [],
  },
  {
    id: "application-form",
    koreanName: "통합신청서",
    englishName: "Application Form",
    kind: "required",
    note: "Immigration application form.",
    sourceIds: [],
  },
];

export const residenceProof: RequirementRule = {
  id: "residence-proof",
  koreanName: "체류지 입증서류",
  englishName: "Proof of Residence",
  kind: "required",
  note: "Evidence of current Korean address.",
  sourceIds: [],
};

export const addressChangeProof: RequirementRule = {
  id: "address-change-proof",
  koreanName: "체류지 변경 입증서류",
  englishName: "Address Change Supporting Document",
  kind: "conditional",
  when: { fact: "addressChanged", equals: true },
  note: "Added when the user reports an address change.",
  sourceIds: [],
};
