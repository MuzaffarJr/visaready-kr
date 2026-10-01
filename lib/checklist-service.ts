import { rulesMode } from "@/lib/config";
import {
  flows,
  ruleSets,
  seoulDate,
  selectRuleSet,
  type FlowDefinition,
  type FlowId,
  type Result,
  type RuleSet,
  type SelectError,
} from "@/lib/rules";

/** Application-layer entry point: binds the pure engine to config and the clock. */
export function currentRuleSet(flowId: FlowId, now: Date = new Date()): Result<RuleSet, SelectError> {
  return selectRuleSet(ruleSets, flowId, seoulDate(now), rulesMode);
}

/** Flows that can produce a checklist today in the configured mode. */
export function availableFlows(now: Date = new Date()): FlowDefinition[] {
  return flows.filter((flow) => currentRuleSet(flow.id, now).ok);
}
