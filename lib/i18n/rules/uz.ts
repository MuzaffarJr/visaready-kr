import { ruleSetKey, type RuleCatalog, type RuleSetText } from "../types";

// Uzbek wording for rule content. Korean document names are never translated
// here: the checklist always shows the Korean name from the rule data.

const addressChanged = {
  prompt: "Roʻyxatdan oʻtgan manzilingiz oʻzgarganmi?",
  help: "Bu javob roʻyxatingizda yashash joyini tasdiqlovchi qaysi hujjatlar chiqishiga taʼsir qiladi.",
};

/** Shared by the three v1 drafts (lib/rules/data/shared.ts). */
const sharedV1: Required<Pick<RuleSetText, "questions" | "requirements">> = {
  questions: { addressChanged },
  requirements: {
    passport: { name: "Pasport", note: "Shaxsni tasdiqlovchi hujjat." },
    "residence-card": { name: "ID karta (xorijlikni roʻyxatga olish kartasi)", note: "Amaldagi Koreya ID kartasi." },
    "application-form": { name: "Ariza shakli", note: "Immigratsiya ariza shakli." },
    "residence-proof": {
      name: "Yashash joyini tasdiqlovchi hujjat",
      note: "Koreyadagi hozirgi manzilingizni tasdiqlovchi hujjat.",
    },
    "address-change-proof": {
      name: "Manzil oʻzgarganini tasdiqlovchi hujjat",
      note: "Manzilingiz oʻzgargan boʻlsa qoʻshiladi.",
    },
  },
};

export const uzRules: RuleCatalog = {
  flows: {
    "d2-extension": {
      label: "D-2 muddatini uzaytirish",
      description: "Talabalik vizangiz (D-2) muddatini uzaytiring.",
    },
    "d2-to-d10": {
      label: "D-2 → D-10",
      description: "Talaba vizasidan ish qidiruvchi vizasiga oʻting.",
    },
    "d10-extension": {
      label: "D-10 muddatini uzaytirish",
      description: "Ish qidiruvchi vizangiz (D-10) muddatini uzaytiring.",
    },
  },
  ruleSets: {
    [ruleSetKey("d2-extension", 1)]: {
      questions: sharedV1.questions,
      requirements: {
        ...sharedV1.requirements,
        enrollment: { name: "Oʻqish joyidan maʼlumotnoma", note: "Hozir oʻqiyotganingizni tasdiqlaydi." },
        transcript: { name: "Baholar qaydnomasi (transkript)", note: "Oʻzlashtirish qaydnomasi." },
      },
    },
    [ruleSetKey("d2-extension", 2)]: {
      questions: {
        studyType: {
          prompt: "Qanday taʼlim olyapsiz?",
          help: "Bunga qarab oʻqishingizni yoki ilmiy faoliyatingizni tasdiqlaysiz.",
          options: {
            degree: "Darajali taʼlim (kollej, bakalavr, magistratura, doktorantura)",
            research: "Maxsus ilmiy tadqiqot",
          },
        },
        thesisStage: {
          prompt: "Siz dissertatsiya tayyorlayotgan magistrant yoki doktorantmisiz?",
          help: "Dissertatsiya bosqichidagi talabalardan ilmiy rahbar tavsiyanomasi soʻralishi mumkin.",
        },
      },
      requirements: {
        "application-form": {
          name: "Yagona ariza shakli",
          note: "Idorada toʻldiriladi yoki HiKorea elektron arizasiga yuklanadi.",
        },
        passport: { name: "Pasport", note: "Pasportning asl nusxasi." },
        "residence-card": { name: "ID karta (xorijlikni roʻyxatga olish kartasi)", note: "Amaldagi Koreya ID kartangiz." },
        enrollment: { name: "Oʻqish joyidan maʼlumotnoma", note: "Universitetingiz joriy semestr uchun beradi." },
        "research-proof": {
          name: "Ilmiy faoliyatni tasdiqlovchi hujjat",
          note: "Muassasangizdan olib borayotgan tadqiqotingizni tasdiqlovchi hujjat.",
        },
        transcript: {
          name: "Baholar qaydnomasi (transkript)",
          note: "Oʻqishni muntazam davom ettirayotganingizni tasdiqlaydi. Universitetlar eng soʻnggi transkriptni soʻraydi.",
        },
        "financial-proof": {
          name: "Kontrakt va yashash xarajatlari uchun mablagʻ borligini tasdiqlovchi hujjat",
          note: "Masalan, bank qoldigʻi haqida maʼlumotnoma (은행잔고증명서) yoki kontrakt toʻlangani haqida maʼlumotnoma (등록금 납입증명서). Baʼzi universitetlar GPA 2.0 va undan yuqori boʻlsa bu talab qoʻyilmasligini aytadi; xalqaro boʻlimingizdan aniqlang.",
        },
        "residence-proof": {
          name: "Yashash joyini tasdiqlovchi hujjat",
          note: "Ijara shartnomasi, uy egasining tasdigʻi, kommunal toʻlov kvitansiyasi yoki yotoqxona toʻlovi kvitansiyasi.",
        },
        "advisor-recommendation": {
          name: "Ilmiy rahbar tavsiyanomasi",
          note: "Dissertatsiya rahbaringizdan xat. Gov24 roʻyxatida bor; 5-2-ilovada hali tasdiqlanmagan.",
        },
      },
      fees: { "extension-fee": "Yashash muddatini uzaytirish yigʻimi" },
    },
    [ruleSetKey("d2-to-d10", 1)]: {
      questions: sharedV1.questions,
      requirements: {
        ...sharedV1.requirements,
        graduation: { name: "Bitiruv haqida maʼlumotnoma", note: "Oʻqishni tamomlaganingizni tasdiqlaydi." },
        "job-plan": { name: "Ish qidirish rejasi", note: "Ish qidirish boʻyicha rejangiz." },
      },
    },
    [ruleSetKey("d10-extension", 1)]: {
      questions: sharedV1.questions,
      requirements: {
        ...sharedV1.requirements,
        "job-activity": {
          name: "Ish qidirish faoliyatini tasdiqlovchi hujjatlar",
          note: "Ish qidirganingizni tasdiqlovchi dalillar.",
        },
      },
    },
  },
};
