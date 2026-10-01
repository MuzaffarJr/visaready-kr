export type FlowId =
  | "d2-extension"
  | "d2-to-d10"
  | "d10-extension";

export type AnswerMap = Record<string, string | boolean>;

export type Requirement = {
  id: string;
  koreanName: string;
  englishName: string;
  type: "required" | "conditional";
  note: string;
  verified: boolean;
};

export const flows: {
  id: FlowId;
  label: string;
  description: string;
}[] = [
  {
    id: "d2-extension",
    label: "D-2 Extension",
    description: "Extend your current student status.",
  },
  {
    id: "d2-to-d10",
    label: "D-2 → D-10",
    description: "Change from student to job-seeker status.",
  },
  {
    id: "d10-extension",
    label: "D-10 Extension",
    description: "Extend your job-seeker status.",
  },
];

const shared: Requirement[] = [
  {
    id: "passport",
    koreanName: "여권",
    englishName: "Passport",
    type: "required",
    note: "Identity document.",
    verified: false,
  },
  {
    id: "residence-card",
    koreanName: "외국인등록증",
    englishName: "Residence Card",
    type: "required",
    note: "Current Korean residence card.",
    verified: false,
  },
  {
    id: "application-form",
    koreanName: "통합신청서",
    englishName: "Application Form",
    type: "required",
    note: "Immigration application form.",
    verified: false,
  },
];

const byFlow: Record<FlowId, Requirement[]> = {
  "d2-extension": [
    {
      id: "enrollment",
      koreanName: "재학증명서",
      englishName: "Certificate of Enrollment",
      type: "required",
      note: "Confirms current enrollment.",
      verified: false,
    },
    {
      id: "transcript",
      koreanName: "성적증명서",
      englishName: "Academic Transcript",
      type: "required",
      note: "Academic record.",
      verified: false,
    },
    {
      id: "residence-proof",
      koreanName: "체류지 입증서류",
      englishName: "Proof of Residence",
      type: "required",
      note: "Evidence of current Korean address.",
      verified: false,
    },
  ],
  "d2-to-d10": [
    {
      id: "graduation",
      koreanName: "졸업증명서",
      englishName: "Graduation Certificate",
      type: "required",
      note: "Confirms graduation status.",
      verified: false,
    },
    {
      id: "job-plan",
      koreanName: "구직활동계획서",
      englishName: "Job-Seeking Activity Plan",
      type: "required",
      note: "Plan for job-seeking activities.",
      verified: false,
    },
    {
      id: "residence-proof",
      koreanName: "체류지 입증서류",
      englishName: "Proof of Residence",
      type: "required",
      note: "Evidence of current Korean address.",
      verified: false,
    },
  ],
  "d10-extension": [
    {
      id: "job-activity",
      koreanName: "구직활동 증빙서류",
      englishName: "Job-Seeking Activity Evidence",
      type: "required",
      note: "Evidence of job-seeking activity.",
      verified: false,
    },
    {
      id: "residence-proof",
      koreanName: "체류지 입증서류",
      englishName: "Proof of Residence",
      type: "required",
      note: "Evidence of current Korean address.",
      verified: false,
    },
  ],
};

const addressChange: Requirement = {
  id: "address-change-proof",
  koreanName: "체류지 변경 입증서류",
  englishName: "Address Change Supporting Document",
  type: "conditional",
  note: "Added when the user reports an address change.",
  verified: false,
};

export function buildChecklist(
  flow: FlowId,
  answers: AnswerMap,
): Requirement[] {
  const base = [...shared, ...byFlow[flow]];

  if (answers.addressChanged === true) {
    base.push(addressChange);
  }

  return base;
}
