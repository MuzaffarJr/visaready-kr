import { conditionFacts } from "./condition";
import { isIsoDate } from "./dates";
import type { Answers, Condition, Question, RuleSet } from "./types";

export type RuleSetIssue = { path: string; message: string };

/**
 * Structural and governance checks for one rule set. A verified rule set is
 * held to a stricter bar: every requirement and fee must cite an official
 * https source, and the verification record must be present.
 */
export function validateRuleSet(ruleSet: RuleSet): RuleSetIssue[] {
  const issues: RuleSetIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  const label = `${ruleSet.flowId}@v${ruleSet.version}`;

  if (!Number.isInteger(ruleSet.version) || ruleSet.version < 1) {
    add(label, "version must be a positive integer");
  }
  if (!isIsoDate(ruleSet.effectiveFrom)) add(label, "effectiveFrom must be YYYY-MM-DD");
  if (ruleSet.effectiveTo !== undefined) {
    if (!isIsoDate(ruleSet.effectiveTo)) add(label, "effectiveTo must be YYYY-MM-DD");
    else if (ruleSet.effectiveTo <= ruleSet.effectiveFrom) {
      add(label, "effectiveTo must be after effectiveFrom");
    }
  }

  const sourceIds = new Set<string>();
  for (const source of ruleSet.sources) {
    if (sourceIds.has(source.id)) add(`${label}.sources.${source.id}`, "duplicate source id");
    sourceIds.add(source.id);
    if (!source.url.startsWith("https://")) {
      add(`${label}.sources.${source.id}`, "source url must use https");
    }
    if (!isIsoDate(source.retrievedAt)) {
      add(`${label}.sources.${source.id}`, "retrievedAt must be YYYY-MM-DD");
    }
  }

  const questionIds = new Set<string>();
  for (const question of ruleSet.questions) {
    if (questionIds.has(question.id)) add(`${label}.questions.${question.id}`, "duplicate question id");
    questionIds.add(question.id);
    if (question.kind === "choice" && question.options.length < 2) {
      add(`${label}.questions.${question.id}`, "choice question needs at least two options");
    }
  }

  const checkCondition = (path: string, condition: Condition | undefined) => {
    if (!condition) return;
    for (const fact of conditionFacts(condition)) {
      if (!questionIds.has(fact)) add(path, `condition reads unknown fact "${fact}"`);
    }
  };

  const checkSources = (path: string, ids: string[]) => {
    for (const id of ids) {
      if (!sourceIds.has(id)) add(path, `unknown source "${id}"`);
    }
    if (ruleSet.status === "verified" && ids.length === 0) {
      add(path, "verified rules must cite at least one source");
    }
  };

  const requirementIds = new Set<string>();
  for (const requirement of ruleSet.requirements) {
    const path = `${label}.requirements.${requirement.id}`;
    if (requirementIds.has(requirement.id)) add(path, "duplicate requirement id");
    requirementIds.add(requirement.id);
    if (requirement.kind === "conditional" && !requirement.when) {
      add(path, "conditional requirement needs a condition");
    }
    if (requirement.kind === "required" && requirement.when) {
      add(path, "required requirement must not have a condition");
    }
    checkCondition(path, requirement.when);
    checkSources(path, requirement.sourceIds);
  }

  for (const fee of ruleSet.fees) {
    const path = `${label}.fees.${fee.id}`;
    if (!Number.isInteger(fee.amountKrw) || fee.amountKrw < 0) {
      add(path, "amountKrw must be a non-negative integer");
    }
    checkCondition(path, fee.when);
    checkSources(path, fee.sourceIds);
  }

  if (ruleSet.status === "verified") {
    if (!ruleSet.verification) add(label, "verified rule set needs a verification record");
    else if (!isIsoDate(ruleSet.verification.verifiedAt)) {
      add(label, "verification.verifiedAt must be YYYY-MM-DD");
    }
  }

  return issues;
}

/**
 * Checks across all versions of all flows: versions are unique per flow and
 * verified versions of one flow never overlap in time.
 */
export function validateRegistry(ruleSets: readonly RuleSet[]): RuleSetIssue[] {
  const issues: RuleSetIssue[] = ruleSets.flatMap(validateRuleSet);
  const byFlow = new Map<string, RuleSet[]>();
  for (const ruleSet of ruleSets) {
    byFlow.set(ruleSet.flowId, [...(byFlow.get(ruleSet.flowId) ?? []), ruleSet]);
  }

  for (const [flowId, sets] of byFlow) {
    const versions = new Set<number>();
    for (const set of sets) {
      if (versions.has(set.version)) {
        issues.push({ path: `${flowId}@v${set.version}`, message: "duplicate version" });
      }
      versions.add(set.version);
    }

    const verified = sets
      .filter((set) => set.status === "verified")
      .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    for (let i = 1; i < verified.length; i++) {
      const previous = verified[i - 1]!;
      const current = verified[i]!;
      if (previous.effectiveTo === undefined || previous.effectiveTo > current.effectiveFrom) {
        issues.push({
          path: `${flowId}@v${current.version}`,
          message: `effective window overlaps v${previous.version}`,
        });
      }
    }
  }

  return issues;
}

export type AnswerIssue = { questionId: string; message: string };

/** Rejects missing, unknown and wrongly typed answers before evaluation. */
export function validateAnswers(questions: readonly Question[], answers: Answers): AnswerIssue[] {
  const issues: AnswerIssue[] = [];
  const known = new Set(questions.map((q) => q.id));

  for (const question of questions) {
    const value = answers[question.id];
    if (value === undefined) {
      issues.push({ questionId: question.id, message: "missing answer" });
    } else if (question.kind === "boolean" && typeof value !== "boolean") {
      issues.push({ questionId: question.id, message: "expected yes or no" });
    } else if (
      question.kind === "choice" &&
      !question.options.some((option) => option.value === value)
    ) {
      issues.push({ questionId: question.id, message: "not one of the allowed options" });
    }
  }

  for (const key of Object.keys(answers)) {
    if (!known.has(key)) issues.push({ questionId: key, message: "unknown question" });
  }

  return issues;
}
