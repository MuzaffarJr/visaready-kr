import type { Answers, ChecklistSnapshot, FlowId } from "@/lib/rules";

/**
 * Browser-only persistence for one checklist per flow. Storage can be
 * unavailable (private mode, blocked site data), so every access is guarded
 * and the app works without it.
 */
export type SavedChecklist = {
  v: 1;
  snapshot: ChecklistSnapshot;
  ready: Record<string, boolean>;
};

const key = (flowId: FlowId) => `visaready:checklist:${flowId}`;

export function loadChecklist(flowId: FlowId): SavedChecklist | undefined {
  try {
    const raw = window.localStorage.getItem(key(flowId));
    if (!raw) return undefined;
    return parseSavedChecklist(JSON.parse(raw), flowId);
  } catch {
    return undefined;
  }
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

function isSource(value: unknown): boolean {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.url) &&
    value.url.startsWith("https://")
  );
}

const hasSources = (value: Json) => Array.isArray(value.sources) && value.sources.every(isSource);

function isItem(value: unknown): boolean {
  return (
    isObject(value) &&
    isString(value.requirementId) &&
    isString(value.koreanName) &&
    isString(value.englishName) &&
    isString(value.kind) &&
    isString(value.note) &&
    hasSources(value)
  );
}

function isFee(value: unknown): boolean {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.label) &&
    typeof value.amountKrw === "number" &&
    hasSources(value)
  );
}

/**
 * Storage is user-controlled, so a record is only trusted when every field
 * the checklist page reads has the expected shape. Anything else is treated
 * as missing and the checklist is generated fresh.
 */
export function parseSavedChecklist(value: unknown, flowId: FlowId): SavedChecklist | undefined {
  if (!isObject(value) || value.v !== 1) return undefined;
  const { snapshot, ready = {} } = value;
  if (
    !isObject(snapshot) ||
    snapshot.flowId !== flowId ||
    typeof snapshot.ruleSetVersion !== "number" ||
    typeof snapshot.provisional !== "boolean" ||
    !isObject(snapshot.answers) ||
    !Array.isArray(snapshot.items) ||
    !snapshot.items.every(isItem) ||
    !Array.isArray(snapshot.fees) ||
    !snapshot.fees.every(isFee)
  ) {
    return undefined;
  }
  if (!isObject(ready) || !Object.values(ready).every((v) => typeof v === "boolean")) return undefined;
  return { v: 1, snapshot: snapshot as ChecklistSnapshot, ready: ready as Record<string, boolean> };
}

export function saveChecklist(flowId: FlowId, saved: Omit<SavedChecklist, "v">): void {
  try {
    window.localStorage.setItem(key(flowId), JSON.stringify({ v: 1, ...saved }));
  } catch {
    // Progress simply is not kept; the checklist itself still works.
  }
}

export function sameAnswers(a: Answers, b: Answers): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => a[k] === b[k]);
}
