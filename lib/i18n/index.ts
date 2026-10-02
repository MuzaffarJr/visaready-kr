import { flows, ruleSets, type FlowDefinition, type FlowId, type Question } from "../rules";
import { languageTags, locales, scaffoldedLocales, type AnyLocale } from "./config";
import { en, type Messages } from "./messages/en";
import { vi, zh } from "./messages/scaffold";
import { uz } from "./messages/uz";
import { viRules, zhRules } from "./rules/scaffold";
import { uzRules } from "./rules/uz";
import { ruleSetKey, type DeepPartial, type RuleCatalog, type RuleSetText } from "./types";

export * from "./config";
export type { Messages } from "./messages/en";
export { ruleSetKey } from "./types";

const catalogues: Record<AnyLocale, DeepPartial<Messages>> = { en, uz, vi, zh };
const ruleCatalogues: Record<AnyLocale, RuleCatalog | undefined> = { en: undefined, uz: uzRules, vi: viRules, zh: zhRules };

type Tree = { [key: string]: string | Tree };

function mergeOver(base: Tree, override: Tree | undefined): Tree {
  const out: Tree = {};
  for (const [key, value] of Object.entries(base)) {
    const next = override?.[key];
    if (typeof value === "string") out[key] = typeof next === "string" ? next : value;
    else out[key] = mergeOver(value, typeof next === "object" ? next : undefined);
  }
  return out;
}

const merged = new Map<AnyLocale, Messages>();

/** UI copy for a locale. Any key the locale lacks falls back to English. */
export function getMessages(locale: AnyLocale): Messages {
  let messages = merged.get(locale);
  if (!messages) {
    messages = mergeOver(en as unknown as Tree, catalogues[locale] as Tree) as unknown as Messages;
    merged.set(locale, messages);
  }
  return messages;
}

/** Replaces `{name}` placeholders. Unknown placeholders are left visible so they are caught in review. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Picks the singular or plural message for `count` using the locale's plural rules. */
export function plural(locale: AnyLocale, count: number, forms: { one: string; other: string }): string {
  return new Intl.PluralRules(languageTags[locale]).select(count) === "one" ? forms.one : forms.other;
}

function ruleSetText(locale: AnyLocale, flowId: FlowId, version: number): RuleSetText | undefined {
  return ruleCatalogues[locale]?.ruleSets[ruleSetKey(flowId, version)];
}

export function flowText(locale: AnyLocale, flow: FlowDefinition): { label: string; description: string } {
  return ruleCatalogues[locale]?.flows[flow.id] ?? { label: flow.label, description: flow.description };
}

export type LocalizedQuestion = {
  prompt: string;
  help?: string;
  options: { value: string; label: string }[];
};

export function questionText(
  locale: AnyLocale,
  ruleSet: { flowId: FlowId; version: number },
  question: Question,
): LocalizedQuestion {
  const text = ruleSetText(locale, ruleSet.flowId, ruleSet.version)?.questions?.[question.id];
  const help = text ? text.help : question.help;
  return {
    prompt: text?.prompt ?? question.prompt,
    ...(help ? { help } : {}),
    options:
      question.kind === "choice"
        ? question.options.map((option) => ({ value: option.value, label: text?.options?.[option.value] ?? option.label }))
        : [],
  };
}

/** Localized name and note for a checklist item; the Korean name always comes from the snapshot. */
export function requirementText(
  locale: AnyLocale,
  snapshot: { flowId: FlowId; ruleSetVersion: number },
  item: { requirementId: string; englishName: string; note: string },
): { name: string; note: string } {
  return (
    ruleSetText(locale, snapshot.flowId, snapshot.ruleSetVersion)?.requirements?.[item.requirementId] ?? {
      name: item.englishName,
      note: item.note,
    }
  );
}

export function feeLabel(
  locale: AnyLocale,
  snapshot: { flowId: FlowId; ruleSetVersion: number },
  fee: { id: string; label: string },
): string {
  return ruleSetText(locale, snapshot.flowId, snapshot.ruleSetVersion)?.fees?.[fee.id] ?? fee.label;
}

function missingKeys(base: Tree, catalogue: Tree | undefined, prefix: string): string[] {
  return Object.entries(base).flatMap(([key, value]) => {
    const path = prefix + key;
    const own = catalogue?.[key];
    if (typeof value === "string") return typeof own === "string" && own.trim() ? [] : [path];
    return missingKeys(value, typeof own === "object" ? own : undefined, path + ".");
  });
}

/**
 * Every UI key and every piece of shipped rule content the locale does not
 * translate (and therefore shows in English). Rule content without English
 * text of its own, such as a question with no help, is not expected either.
 */
export function missingTranslations(locale: AnyLocale): string[] {
  if (locale === "en") return [];
  const missing = missingKeys(en as unknown as Tree, catalogues[locale] as Tree, "ui.");
  const catalogue = ruleCatalogues[locale];

  for (const flow of flows) {
    if (!catalogue?.flows[flow.id]) missing.push(`flows.${flow.id}`);
  }
  for (const set of ruleSets) {
    const key = ruleSetKey(set.flowId, set.version);
    const text = catalogue?.ruleSets[key];
    for (const question of set.questions) {
      const q = text?.questions?.[question.id];
      if (!q) {
        missing.push(`rules.${key}.questions.${question.id}`);
        continue;
      }
      if (question.help && !q.help) missing.push(`rules.${key}.questions.${question.id}.help`);
      if (question.kind === "choice") {
        for (const option of question.options) {
          if (!q.options?.[option.value]) missing.push(`rules.${key}.questions.${question.id}.options.${option.value}`);
        }
      }
    }
    for (const rule of set.requirements) {
      if (!text?.requirements?.[rule.id]) missing.push(`rules.${key}.requirements.${rule.id}`);
    }
    for (const fee of set.fees) {
      if (!text?.fees?.[fee.id]) missing.push(`rules.${key}.fees.${fee.id}`);
    }
  }
  return missing;
}

/** Translations that point at nothing: a renamed requirement or a typo in a key. */
export function orphanTranslations(locale: AnyLocale): string[] {
  const catalogue = ruleCatalogues[locale];
  if (!catalogue) return [];
  const orphans: string[] = [];
  for (const [key, text] of Object.entries(catalogue.ruleSets)) {
    const set = ruleSets.find((candidate) => ruleSetKey(candidate.flowId, candidate.version) === key);
    if (!set) {
      orphans.push(`rules.${key}`);
      continue;
    }
    for (const id of Object.keys(text.questions ?? {})) {
      if (!set.questions.some((question) => question.id === id)) orphans.push(`rules.${key}.questions.${id}`);
    }
    for (const id of Object.keys(text.requirements ?? {})) {
      if (!set.requirements.some((rule) => rule.id === id)) orphans.push(`rules.${key}.requirements.${id}`);
    }
    for (const id of Object.keys(text.fees ?? {})) {
      if (!set.fees.some((fee) => fee.id === id)) orphans.push(`rules.${key}.fees.${id}`);
    }
  }
  return orphans;
}

export const allLocales: readonly AnyLocale[] = [...locales, ...scaffoldedLocales];
