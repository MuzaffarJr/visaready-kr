import { d10ExtensionV1 } from "./data/d10-extension";
import { d2ExtensionV1 } from "./data/d2-extension";
import { d2ToD10V1 } from "./data/d2-to-d10";
import type { FlowDefinition, FlowId, RuleSet } from "./types";

export const flows: readonly FlowDefinition[] = [
  { id: "d2-extension", label: "D-2 Extension", description: "Extend your current student status." },
  { id: "d2-to-d10", label: "D-2 → D-10", description: "Change from student to job-seeker status." },
  { id: "d10-extension", label: "D-10 Extension", description: "Extend your job-seeker status." },
];

/** Every published version of every flow. Append new versions; never edit old ones. */
export const ruleSets: readonly RuleSet[] = [d2ExtensionV1, d2ToD10V1, d10ExtensionV1];

export function findFlow(id: string | null | undefined): FlowDefinition | undefined {
  return flows.find((flow) => flow.id === id);
}

export function isFlowId(id: string | null | undefined): id is FlowId {
  return findFlow(id) !== undefined;
}
