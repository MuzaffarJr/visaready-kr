import { evaluateCondition } from "./condition";
import { isWithin } from "./dates";
import { validateAnswers, type AnswerIssue } from "./validate";
import type {
  Answers,
  ChecklistSnapshot,
  FlowId,
  IsoDate,
  Result,
  RuleSet,
  RulesMode,
  SourceRef,
} from "./types";

export type SelectError = { code: "no-ruleset"; flowId: FlowId; on: IsoDate; mode: RulesMode };

const ALLOWED_STATUS: Record<RulesMode, ReadonlySet<RuleSet["status"]>> = {
  production: new Set(["verified"]),
  preview: new Set(["verified", "in_review", "draft"]),
};

/**
 * Picks the rule set that governs `flowId` on date `on`. In production only a
 * verified, currently effective version qualifies; the highest version wins.
 */
export function selectRuleSet(
  ruleSets: readonly RuleSet[],
  flowId: FlowId,
  on: IsoDate,
  mode: RulesMode,
): Result<RuleSet, SelectError> {
  const candidates = ruleSets
    .filter(
      (set) =>
        set.flowId === flowId &&
        ALLOWED_STATUS[mode].has(set.status) &&
        isWithin(on, set.effectiveFrom, set.effectiveTo),
    )
    .sort((a, b) => {
      // In preview, a verified version still outranks a draft of any version.
      const verifiedFirst = Number(b.status === "verified") - Number(a.status === "verified");
      return verifiedFirst !== 0 ? verifiedFirst : b.version - a.version;
    });

  const chosen = candidates[0];
  return chosen
    ? { ok: true, value: chosen }
    : { ok: false, error: { code: "no-ruleset", flowId, on, mode } };
}

export type GenerateError = { code: "invalid-answers"; issues: AnswerIssue[] };

/** Pure: the same rule set and answers always yield the same checklist. */
export function generateChecklist(
  ruleSet: RuleSet,
  answers: Answers,
  generatedAt: string,
): Result<ChecklistSnapshot, GenerateError> {
  const issues = validateAnswers(ruleSet.questions, answers);
  if (issues.length > 0) return { ok: false, error: { code: "invalid-answers", issues } };

  const sourceById = new Map(ruleSet.sources.map((source) => [source.id, source]));
  const resolve = (ids: string[]): SourceRef[] =>
    ids.flatMap((id) => {
      const source = sourceById.get(id);
      return source ? [source] : [];
    });

  const items = ruleSet.requirements
    .filter((rule) => !rule.when || evaluateCondition(rule.when, answers))
    .map((rule) => ({
      requirementId: rule.id,
      koreanName: rule.koreanName,
      englishName: rule.englishName,
      kind: rule.kind,
      note: rule.note,
      sources: resolve(rule.sourceIds),
    }));

  const fees = ruleSet.fees
    .filter((fee) => !fee.when || evaluateCondition(fee.when, answers))
    .map((fee) => ({
      id: fee.id,
      label: fee.label,
      amountKrw: fee.amountKrw,
      sources: resolve(fee.sourceIds),
    }));

  return {
    ok: true,
    value: {
      flowId: ruleSet.flowId,
      ruleSetVersion: ruleSet.version,
      ruleSetStatus: ruleSet.status,
      provisional: ruleSet.status !== "verified",
      generatedAt,
      answers: { ...answers },
      items,
      fees,
    },
  };
}

export type SnapshotDrift =
  | { status: "current" }
  | {
      status: "outdated";
      latestVersion: number;
      added: string[];
      removed: string[];
      /** Questions the new version asks that this application never answered. */
      unansweredQuestions: string[];
    };

/**
 * Compares a stored checklist with what the latest rule set would produce for
 * the same answers. It never mutates the snapshot: the application keeps the
 * checklist it was created with until the user accepts the update.
 */
export function compareWithLatest(
  snapshot: ChecklistSnapshot,
  latest: RuleSet,
): SnapshotDrift {
  if (latest.flowId !== snapshot.flowId || latest.version === snapshot.ruleSetVersion) {
    return { status: "current" };
  }

  const known = new Set(latest.questions.map((question) => question.id));
  const carriedAnswers = Object.fromEntries(
    Object.entries(snapshot.answers).filter(([key]) => known.has(key)),
  );
  const regenerated = generateChecklist(latest, carriedAnswers, snapshot.generatedAt);
  if (!regenerated.ok) {
    // The diff is unknowable until the user answers the new or changed questions.
    return {
      status: "outdated",
      latestVersion: latest.version,
      added: [],
      removed: [],
      unansweredQuestions: regenerated.error.issues.map((issue) => issue.questionId),
    };
  }

  const next = new Set(regenerated.value.items.map((item) => item.requirementId));
  const previous = new Set(snapshot.items.map((item) => item.requirementId));

  return {
    status: "outdated",
    latestVersion: latest.version,
    added: [...next].filter((id) => !previous.has(id)),
    removed: [...previous].filter((id) => !next.has(id)),
    unansweredQuestions: [],
  };
}
