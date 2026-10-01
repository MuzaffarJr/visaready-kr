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
    const parsed = JSON.parse(raw) as Partial<SavedChecklist>;
    if (parsed.v !== 1 || parsed.snapshot?.flowId !== flowId || !Array.isArray(parsed.snapshot.items)) {
      return undefined;
    }
    return { v: 1, snapshot: parsed.snapshot, ready: parsed.ready ?? {} };
  } catch {
    return undefined;
  }
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
