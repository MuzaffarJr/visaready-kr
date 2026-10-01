import type { Answers, Condition } from "./types";

export function evaluateCondition(condition: Condition, answers: Answers): boolean {
  if ("all" in condition) return condition.all.every((c) => evaluateCondition(c, answers));
  if ("any" in condition) return condition.any.some((c) => evaluateCondition(c, answers));
  if ("not" in condition) return !evaluateCondition(condition.not, answers);
  return answers[condition.fact] === condition.equals;
}

/** Every fact id a condition reads, used to validate rule sets. */
export function conditionFacts(condition: Condition): string[] {
  if ("all" in condition) return condition.all.flatMap(conditionFacts);
  if ("any" in condition) return condition.any.flatMap(conditionFacts);
  if ("not" in condition) return conditionFacts(condition.not);
  return [condition.fact];
}
