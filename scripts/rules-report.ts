/**
 * Prints a Markdown report of every rule set: status, effective window and
 * source coverage. Exits non-zero when the registry is invalid.
 * CI appends the output to the job summary.
 */
import { ruleSets, validateRegistry } from "../lib/rules";

const lines: string[] = [
  "## Rule sets",
  "",
  "| Flow | Version | Status | Effective | Verified | Requirements with sources | Fees |",
  "| --- | --- | --- | --- | --- | --- | --- |",
];

for (const set of [...ruleSets].sort((a, b) => a.flowId.localeCompare(b.flowId) || a.version - b.version)) {
  const cited = set.requirements.filter((r) => r.sourceIds.length > 0).length;
  lines.push(
    `| ${set.flowId} | v${set.version} | ${set.status} | ${set.effectiveFrom} → ${set.effectiveTo ?? "open"} | ` +
      `${set.verification ? `${set.verification.verifiedAt} by ${set.verification.verifiedBy}` : "—"} | ` +
      `${cited}/${set.requirements.length} | ${set.fees.length} |`,
  );
}

const issues = validateRegistry(ruleSets);
lines.push("", issues.length === 0 ? "Registry valid." : "### Issues", "");
for (const issue of issues) lines.push(`- \`${issue.path}\`: ${issue.message}`);

console.log(lines.join("\n"));
process.exitCode = issues.length === 0 ? 0 : 1;
