/**
 * Rules domain types.
 *
 * This module is the source of truth for immigration requirements. It must stay
 * framework-free: no React, Next.js or Supabase imports (enforced by ESLint).
 */

/** Calendar date in ISO format, `YYYY-MM-DD`, interpreted in Asia/Seoul. */
export type IsoDate = string;

export type FlowId = "d2-extension" | "d2-to-d10" | "d10-extension";

/**
 * Lifecycle of a rule set version.
 * Only `verified` versions may produce a production checklist.
 */
export type RuleSetStatus = "draft" | "in_review" | "verified" | "deprecated";

export type SourceAuthority =
  | "hikorea"
  | "ministry-of-justice"
  | "immigration-office"
  | "other-official";

/** An official document that backs one or more rules. */
export type SourceRef = {
  id: string;
  title: string;
  authority: SourceAuthority;
  url: string;
  /** Date the source was last read by a reviewer. */
  retrievedAt: IsoDate;
  /** Page, section or table inside the source, when relevant. */
  locator?: string;
};

export type Fee = {
  id: string;
  label: string;
  amountKrw: number;
  sourceIds: string[];
  when?: Condition;
};

export type AnswerValue = string | boolean;
export type Answers = Readonly<Record<string, AnswerValue>>;

export type Question =
  | { id: string; kind: "boolean"; prompt: string; help?: string }
  | {
      id: string;
      kind: "choice";
      prompt: string;
      help?: string;
      options: { value: string; label: string }[];
    };

/** Declarative, serializable condition evaluated against user answers. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { fact: string; equals: AnswerValue };

export type RequirementKind = "required" | "conditional";

export type RequirementRule = {
  id: string;
  koreanName: string;
  englishName: string;
  kind: RequirementKind;
  /** Present for conditional requirements; absent means always included. */
  when?: Condition;
  note: string;
  sourceIds: string[];
};

export type Verification = {
  verifiedAt: IsoDate;
  verifiedBy: string;
};

/**
 * A versioned, immutable set of rules for one flow. A rule change is a new
 * version, never an in-place edit of a published one.
 */
export type RuleSet = {
  flowId: FlowId;
  version: number;
  status: RuleSetStatus;
  effectiveFrom: IsoDate;
  /** Exclusive end date. */
  effectiveTo?: IsoDate;
  verification?: Verification;
  sources: SourceRef[];
  fees: Fee[];
  questions: Question[];
  requirements: RequirementRule[];
  changelog: string;
};

export type FlowDefinition = {
  id: FlowId;
  label: string;
  description: string;
};

/**
 * `production` only accepts verified rule sets. `preview` also accepts
 * draft and in-review rule sets and marks the output as provisional.
 */
export type RulesMode = "production" | "preview";

export type ChecklistItem = {
  requirementId: string;
  koreanName: string;
  englishName: string;
  kind: RequirementKind;
  note: string;
  sources: SourceRef[];
};

/**
 * The checklist as generated for one application. It records which rule set
 * version produced it so later rule changes never rewrite it silently.
 */
export type ChecklistSnapshot = {
  flowId: FlowId;
  ruleSetVersion: number;
  ruleSetStatus: RuleSetStatus;
  provisional: boolean;
  /** Date a reviewer verified the rule set; absent for unverified rule sets. */
  verifiedAt?: IsoDate;
  generatedAt: string;
  answers: Answers;
  items: ChecklistItem[];
  fees: { id: string; label: string; amountKrw: number; sources: SourceRef[] }[];
};

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
