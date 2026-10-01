import type { RulesMode } from "@/lib/rules";

/**
 * `production` hides any flow without a verified rule set. Until the first
 * rule set is verified, deployments run in `preview` and label checklists as
 * provisional.
 */
export const rulesMode: RulesMode =
  process.env.NEXT_PUBLIC_RULES_MODE === "production" ? "production" : "preview";
