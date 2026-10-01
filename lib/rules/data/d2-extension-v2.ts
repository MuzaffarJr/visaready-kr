import type { RuleSet } from "../types";

// Built from docs/research/d2-extension.md (automated research draft,
// 2026-10-01). Stays `draft` until a human reviewer checks every source
// (backlog P0-3). Requirement ids are kept stable from v1 where the document
// is the same, so saved checklists can be compared across versions.

export const d2ExtensionV2: RuleSet = {
  flowId: "d2-extension",
  version: 2,
  status: "draft",
  effectiveFrom: "2026-10-01",
  sources: [
    {
      id: "law-annex-5-2",
      title: "Immigration Act Enforcement Rules, Annex 5-2 (attached documents)",
      authority: "ministry-of-justice",
      url: "https://www.law.go.kr/LSW/flDownload.do?flSeq=157814773&bylClsCd=110201",
      retrievedAt: "2026-10-01",
      locator: "별표 5의2, row 유학(D-2), column 체류기간 연장허가 (amended 2024-12-24)",
    },
    {
      id: "gov24-extension",
      title: "Gov24: Extension of sojourn period",
      authority: "other-official",
      url: "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12700000097",
      retrievedAt: "2026-10-01",
      locator: "구비서류 (유학 D-2), 수수료, 처리기간",
    },
    {
      id: "law-rule-72",
      title: "Immigration Act Enforcement Rules, Article 72 (fees)",
      authority: "ministry-of-justice",
      url: "https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000817401",
      retrievedAt: "2026-10-01",
      locator: "제72조, 체류기간 연장허가 (version effective 2026-01-23)",
    },
    {
      id: "moj-manual-d2",
      title: "MOJ residence-status manual, D-2 excerpt (hosted by Ajou University)",
      authority: "ministry-of-justice",
      url: "https://www.ajou.ac.kr/se_en/board/news.do?mode=download&articleNo=288573&attachNo=269217",
      retrievedAt: "2026-10-01",
      locator: "유학(D-2) > 체류기간 연장허가 > 나. 제출서류; version date not visible",
    },
  ],
  fees: [
    {
      id: "extension-fee",
      label: "Extension of stay fee",
      amountKrw: 60000,
      sourceIds: ["law-rule-72", "gov24-extension"],
    },
  ],
  questions: [
    {
      id: "studyType",
      kind: "choice",
      prompt: "What are you studying?",
      help: "This decides whether you prove enrollment or research activity.",
      options: [
        { value: "degree", label: "A degree course (associate, bachelor, master, PhD)" },
        { value: "research", label: "Specific research" },
      ],
    },
    {
      id: "thesisStage",
      kind: "boolean",
      prompt: "Are you a master's or PhD student preparing your thesis?",
      help: "Thesis-stage graduate students may need a supervisor's recommendation.",
    },
  ],
  requirements: [
    {
      id: "application-form",
      koreanName: "통합신청서",
      englishName: "Integrated Application Form",
      kind: "required",
      note: "Filled in at the office or uploaded with a HiKorea e-application.",
      sourceIds: ["moj-manual-d2", "gov24-extension"],
    },
    {
      id: "passport",
      koreanName: "여권",
      englishName: "Passport",
      kind: "required",
      note: "Original passport.",
      sourceIds: ["gov24-extension", "moj-manual-d2"],
    },
    {
      id: "residence-card",
      koreanName: "외국인등록증",
      englishName: "Residence Card",
      kind: "required",
      note: "Your current Korean residence card.",
      sourceIds: ["gov24-extension", "moj-manual-d2"],
    },
    {
      id: "enrollment",
      koreanName: "재학증명서",
      englishName: "Certificate of Enrollment",
      kind: "conditional",
      when: { fact: "studyType", equals: "degree" },
      note: "Issued by your university for the current semester.",
      sourceIds: ["law-annex-5-2", "gov24-extension", "moj-manual-d2"],
    },
    {
      id: "research-proof",
      koreanName: "연구 활동 입증서류",
      englishName: "Proof of Research Activity",
      kind: "conditional",
      when: { fact: "studyType", equals: "research" },
      note: "Document from your institution confirming the research you are doing.",
      sourceIds: ["law-annex-5-2", "gov24-extension"],
    },
    {
      id: "transcript",
      koreanName: "성적증명서",
      englishName: "Academic Transcript",
      kind: "required",
      note: "Proves you are studying normally. Universities ask for the latest transcript.",
      sourceIds: ["moj-manual-d2"],
    },
    {
      id: "financial-proof",
      koreanName: "재정(학비, 체재비) 입증서류",
      englishName: "Proof of Funds for Tuition and Living Costs",
      kind: "required",
      note: "For example a bank balance certificate (은행잔고증명서) or tuition payment certificate (등록금 납입증명서). Some universities report a waiver when GPA is 2.0 or higher; check with your international office.",
      sourceIds: ["law-annex-5-2", "moj-manual-d2"],
    },
    {
      id: "residence-proof",
      koreanName: "체류지 입증서류",
      englishName: "Proof of Residence",
      kind: "required",
      note: "Lease contract, accommodation-provider confirmation, utility bill or dormitory fee receipt.",
      sourceIds: ["gov24-extension", "moj-manual-d2"],
    },
    {
      id: "advisor-recommendation",
      koreanName: "지도교수 추천서",
      englishName: "Supervisor's Recommendation",
      kind: "conditional",
      when: { fact: "thesisStage", equals: true },
      note: "Letter from your thesis supervisor. Listed by Gov24; not yet confirmed in Annex 5-2.",
      sourceIds: ["gov24-extension"],
    },
  ],
  changelog:
    "Rebuilt from official sources (Annex 5-2, Gov24, Rule 72, MOJ manual). Adds the KRW 60,000 fee, study type and thesis questions, financial proof and supervisor recommendation. Drops the address-change item, which no source supports. Draft until human review.",
};
