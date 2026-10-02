import type { FlowId } from "../rules";

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Translated text for one rule set version. English lives in the rule data itself. */
export type RuleSetText = {
  questions?: Record<string, { prompt: string; help?: string; options?: Record<string, string> }>;
  requirements?: Record<string, { name: string; note: string }>;
  fees?: Record<string, string>;
};

/**
 * Rule content translations. Rule sets are keyed by `ruleSetKey(flowId,
 * version)`, so a checklist pinned to an older version keeps the wording that
 * matches it.
 */
export type RuleCatalog = {
  flows: Partial<Record<FlowId, { label: string; description: string }>>;
  ruleSets: Record<string, RuleSetText>;
};

export const ruleSetKey = (flowId: FlowId, version: number) => `${flowId}@${version}`;
