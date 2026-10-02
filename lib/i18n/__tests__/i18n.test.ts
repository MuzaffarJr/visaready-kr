import { describe, expect, it } from "vitest";
import { flows, generateChecklist, ruleSets } from "../../rules";
import {
  allLocales,
  feeLabel,
  flowText,
  format,
  getMessages,
  locales,
  missingTranslations,
  negotiateLocale,
  orphanTranslations,
  plural,
  questionText,
  requirementText,
  scaffoldedLocales,
  switchLocalePath,
} from "..";

describe("negotiateLocale", () => {
  it("prefers the highest quality supported language", () => {
    expect(negotiateLocale("ru-RU,ru;q=0.9,uz;q=0.8,en;q=0.7")).toBe("uz");
    expect(negotiateLocale("en-US,en;q=0.9,uz;q=0.5")).toBe("en");
    expect(negotiateLocale("uz;q=0.4,en;q=0.6")).toBe("en");
  });

  it("ignores region and script subtags", () => {
    expect(negotiateLocale("uz-Cyrl-UZ")).toBe("uz");
  });

  it("falls back to English for unsupported or missing headers", () => {
    expect(negotiateLocale("ko-KR,ko;q=0.9")).toBe("en");
    expect(negotiateLocale("vi")).toBe("en");
    expect(negotiateLocale("")).toBe("en");
    expect(negotiateLocale(undefined)).toBe("en");
    expect(negotiateLocale("uz;q=0")).toBe("en");
  });
});

describe("switchLocalePath", () => {
  it("replaces or inserts the locale segment and keeps the rest", () => {
    expect(switchLocalePath("/en/checklist", "uz")).toBe("/uz/checklist");
    expect(switchLocalePath("/en", "uz")).toBe("/uz");
    expect(switchLocalePath("/", "uz")).toBe("/uz");
    expect(switchLocalePath("/start", "en")).toBe("/en/start");
  });
});

describe("message helpers", () => {
  it("formats placeholders and keeps unknown ones visible", () => {
    expect(format("{complete} of {total} ready", { complete: 1, total: 8 })).toBe("1 of 8 ready");
    expect(format("Rules v{version}", {})).toBe("Rules v{version}");
  });

  it("uses locale plural rules", () => {
    const forms = { one: "one", other: "other" };
    expect(plural("en", 1, forms)).toBe("one");
    expect(plural("en", 2, forms)).toBe("other");
  });
});

describe("catalogue coverage", () => {
  it.each(locales)("%s translates every UI key and all shipped rule content", (locale) => {
    expect(missingTranslations(locale)).toEqual([]);
  });

  it.each(allLocales)("%s has no translations for rule content that does not exist", (locale) => {
    expect(orphanTranslations(locale)).toEqual([]);
  });

  it.each(scaffoldedLocales)("%s reports what is untranslated and falls back to English", (locale) => {
    const missing = missingTranslations(locale);
    // Reported in the test output so translators can see how much is left.
    console.info(`[i18n] ${locale}: ${missing.length} untranslated keys`);
    expect(missing.length).toBeGreaterThan(0);
    expect(getMessages(locale).checklist.title).toBe(getMessages("en").checklist.title);
  });
});

describe("rule content", () => {
  const v2 = ruleSets.find((set) => set.flowId === "d2-extension" && set.version === 2)!;
  const snapshot = generateChecklist(v2, { studyType: "degree", thesisStage: true }, "2026-10-02T00:00:00Z");
  if (!snapshot.ok) throw new Error("fixture answers must be valid");

  it("translates requirements by rule set version and keeps English as the fallback", () => {
    const passport = snapshot.value.items.find((item) => item.requirementId === "passport")!;
    expect(requirementText("uz", snapshot.value, passport).name).toBe("Pasport");
    expect(requirementText("en", snapshot.value, passport)).toEqual({ name: "Passport", note: "Original passport." });
    expect(requirementText("vi", snapshot.value, passport).name).toBe("Passport");
    expect(requirementText("uz", { ...snapshot.value, ruleSetVersion: 99 }, passport).name).toBe("Passport");
  });

  it("translates fees, questions and options", () => {
    const fee = snapshot.value.fees[0]!;
    expect(feeLabel("uz", snapshot.value, fee)).not.toBe(fee.label);
    const studyType = v2.questions.find((question) => question.id === "studyType")!;
    const text = questionText("uz", v2, studyType);
    expect(text.prompt).not.toBe(studyType.prompt);
    expect(text.options.map((option) => option.value)).toEqual(["degree", "research"]);
    expect(questionText("en", v2, studyType).prompt).toBe(studyType.prompt);
  });

  it("translates flow labels", () => {
    expect(flowText("uz", flows[0]!).label).not.toBe(flows[0]!.label);
    expect(flowText("en", flows[0]!)).toEqual({ label: flows[0]!.label, description: flows[0]!.description });
  });
});
